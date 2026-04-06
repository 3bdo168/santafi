// functions/index.js
// ==========================================
// تثبيت:
//   cd functions
//   npm install firebase-admin firebase-functions
//   firebase deploy --only functions
// ==========================================

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();

const BRANCHES = ["mansoura", "mit_ghamr", "zagazig"];

const PAYMOB_BASE_URL = "https://accept.paymob.com/api";

async function paymobAuthToken(apiKey) {
  const res = await fetch(`${PAYMOB_BASE_URL}/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  });
  const json = await res.json();
  if (!res.ok || !json?.token) {
    throw new Error(json?.message || "Paymob auth failed");
  }
  return json.token;
}

async function paymobRetrieveTransaction({ authToken, transactionId }) {
  const res = await fetch(
    `${PAYMOB_BASE_URL}/acceptance/transactions/${encodeURIComponent(transactionId)}?token=${encodeURIComponent(authToken)}`,
    { method: "GET" },
  );
  const json = await res.json();
  if (!res.ok || !json?.id) {
    throw new Error(json?.message || "Paymob retrieve transaction failed");
  }
  return json;
}

// ✅ Finalize Paymob payment: verify transaction server-side then update Firestore
exports.finalizePaymobPayment = onCall(
  { region: "europe-west1" },
  async (req) => {
    if (!req.auth?.uid) {
      throw new HttpsError("unauthenticated", "Login required");
    }

    const {
      branchId,
      orderId, // shared Firestore id (branch orders + all_orders)
      transactionId,
    } = req.data || {};

    if (!branchId || !orderId || !transactionId) {
      throw new HttpsError("invalid-argument", "branchId, orderId, transactionId are required");
    }

    const apiKey = process.env.PAYMOB_API_KEY;
    if (!apiKey) {
      throw new HttpsError("failed-precondition", "Missing PAYMOB_API_KEY on server");
    }

    const db = getFirestore();

    const branchOrderRef = db.collection(branchId).doc("orders").collection("data").doc(orderId);
    const globalOrderRef = db.collection("all_orders").doc(orderId);

    const [branchSnap, globalSnap] = await Promise.all([branchOrderRef.get(), globalOrderRef.get()]);
    if (!branchSnap.exists || !globalSnap.exists) {
      throw new HttpsError("not-found", "Order not found");
    }

    const order = globalSnap.data() || {};
    if (order.clientUid && order.clientUid !== req.auth.uid) {
      throw new HttpsError("permission-denied", "Not your order");
    }

    try {
      const authToken = await paymobAuthToken(apiKey);
      const tx = await paymobRetrieveTransaction({ authToken, transactionId });

      const success = tx.success === true && tx.pending === false;
      const amountCents = Number(tx.amount_cents) || 0;

      const updates = {
        paymentProvider: "paymob",
        paymobTransactionId: String(tx.id),
        paymobOrderId: tx.order ? String(tx.order) : order.paymobOrderId || null,
        paymentStatus: success ? "paid" : "failed",
        paymentVerifiedAt: FieldValue.serverTimestamp(),
        paymentAmountCents: amountCents,
      };

      // Only unlock the order for processing if paid
      if (success) {
        updates.status = order.status === "pending_payment" ? "pending" : (order.status || "pending");
      }

      await Promise.all([
        branchOrderRef.set(updates, { merge: true }),
        globalOrderRef.set(updates, { merge: true }),
      ]);

      return { ok: true, success, updates };
    } catch (err) {
      await Promise.all([
        branchOrderRef.set(
          { paymentStatus: "verify_error", paymentVerifyError: String(err?.message || err), paymentVerifiedAt: FieldValue.serverTimestamp() },
          { merge: true },
        ),
        globalOrderRef.set(
          { paymentStatus: "verify_error", paymentVerifyError: String(err?.message || err), paymentVerifiedAt: FieldValue.serverTimestamp() },
          { merge: true },
        ),
      ]);
      throw new HttpsError("internal", "Payment verification failed");
    }
  },
);

// ✅ بتشتغل كل يوم الساعة 12 منتصف الليل (توقيت القاهرة)
exports.midnightArchive = onSchedule(
  {
    schedule: "0 0 * * *",       // cron: كل يوم الساعة 00:00
    timeZone: "Africa/Cairo",    // ✅ توقيت القاهرة
    region: "europe-west1",      // أقرب region لمصر
  },
  async () => {
    const db = getFirestore();

    for (const branchId of BRANCHES) {
      const ordersCol = db.collection(branchId).doc("orders").collection("data");
      const archiveCol = db.collection(branchId).doc("archived_orders").collection("data");

      const snap = await ordersCol.get();
      if (snap.empty) continue;

      // ✅ بياخد كل الأوردرات اللي مش في الأرشيف ويحطهم فيه
      const batch = db.batch();
      let count = 0;

      snap.docs.forEach((docSnap) => {
        const order = docSnap.data();

        // ✅ بس الأوردرات اللي status بتاعها مش pending
        // (الـ pending لسه ممكن يكون محتاج attention)
        // لو عايز تأرشف الكل بما فيهم pending شيل الـ if
        if (order.status !== "pending" && order.status !== "pending_payment") {
          const newDoc = archiveCol.doc();
          batch.set(newDoc, {
            ...order,
            archivedAt: new Date(),
            archivedBy: "auto_midnight",
          });
          batch.delete(ordersCol.doc(docSnap.id));
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        console.log(`✅ [${branchId}] Archived ${count} orders at midnight`);
      } else {
        console.log(`ℹ️ [${branchId}] No orders to archive`);
      }
    }
  }
);