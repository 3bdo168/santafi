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

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeSizeKey = (selectedSize) => {
  const s = String(selectedSize || "single").toLowerCase();
  if (s === "s" || s === "single" || s === "small") return "single";
  if (s === "d" || s === "double") return "double";
  if (s === "t" || s === "triple") return "triple";
  return "single";
};

const applyProductDiscount = (basePrice, product) => {
  const original = Number(basePrice) || 0;
  if (!product?.discountActive) return { original, discounted: original, discountAmount: 0 };
  const type = product.discountType || "none";
  const rawValue = Number(product.discountValue) || 0;
  if (type === "none" || rawValue <= 0) return { original, discounted: original, discountAmount: 0 };
  const discountAmount =
    type === "percent" ? original * (clamp(rawValue, 0, 100) / 100) : Math.min(rawValue, original);
  const discounted = Math.max(0, original - discountAmount);
  return { original, discounted, discountAmount };
};

const isOfferActiveNow = (docData, now = new Date()) => {
  if (!docData) return false;
  if (docData.isActive === false) return false;
  const start = docData.startsAt?.toDate?.() || (docData.startsAt ? new Date(docData.startsAt) : null);
  const end = docData.endsAt?.toDate?.() || (docData.endsAt ? new Date(docData.endsAt) : null);
  if (start && start.getTime() > now.getTime()) return false;
  if (end && end.getTime() < now.getTime()) return false;
  return true;
};

const normalizeSpinConfig = (data = {}) => ({
  enabled: Boolean(data.enabled),
  dailyLimit: Math.max(0, Number(data.dailyLimit || 0)),
  prizes: Array.isArray(data.prizes) ? data.prizes : [],
});

const pickWeightedPrize = (prizes = []) => {
  const enabledPrizes = prizes.filter((p) => p.enabled !== false && Number(p.weight || 0) > 0);
  const totalWeight = enabledPrizes.reduce((sum, prize) => sum + Number(prize.weight || 0), 0);
  if (!enabledPrizes.length || totalWeight <= 0) return null;

  let cursor = Math.random() * totalWeight;
  for (const prize of enabledPrizes) {
    cursor -= Number(prize.weight || 0);
    if (cursor <= 0) return prize;
  }
  return enabledPrizes[enabledPrizes.length - 1];
};

const todaySpinLogId = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};



exports.spinWheel = onCall({ region: "europe-west1" }, async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Login required");

  const branchId = String(req.data?.branchId || "").trim();
  if (!BRANCHES.includes(branchId)) {
    throw new HttpsError("invalid-argument", "Valid branchId is required");
  }

  const db = getFirestore();
  const uid = req.auth.uid;
  const configRef = db.collection("wheelSettings").doc(branchId);

  const configSnap = await configRef.get();
  const liveConfig = normalizeSpinConfig(configSnap.exists ? configSnap.data() : {});
  if (!liveConfig.enabled) throw new HttpsError("failed-precondition", "disabled");

  if (liveConfig.dailyLimit > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const spinsSnap = await db.collection("wheelSpins")
      .where("userId", "==", uid)
      .where("branchId", "==", branchId)
      .where("timestamp", ">=", today)
      .get();

    if (spinsSnap.size >= liveConfig.dailyLimit) {
      throw new HttpsError("resource-exhausted", "already_spun");
    }
  }

  const wonPrize = pickWeightedPrize(liveConfig.prizes);
  if (!wonPrize) throw new HttpsError("failed-precondition", "empty");

  let code = null;
  if (wonPrize.type !== "none" && wonPrize.couponCode && typeof wonPrize.couponCode === "string" && wonPrize.couponCode.trim() !== "") {
    code = wonPrize.couponCode.trim().toUpperCase();
  }

  let couponRef = null;
  if (code) {
    couponRef = db.collection(branchId).doc("discountCoupons").collection("data").doc(code);
  }

  if (couponRef) {
    await couponRef.set({
      code,
      type: wonPrize.type === "free_delivery" ? "free_delivery" : "percent",
      value: wonPrize.type === "free_delivery" ? 0 : clamp(Number(wonPrize.value || 0), 0, 100),
      minOrderAmount: Number(wonPrize.minOrderAmount || wonPrize.minOrder || 0) || 0,
      active: true,
      startDate: null,
      endDate: null,
      usageLimit: 1,
      usageCount: 0,
      source: "spinWheel",
      ownerUid: uid,
      spinPrizeId: String(wonPrize.id || ""),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });
  }

  await db.collection("wheelSpins").add({
    userId: uid,
    userName: req.auth.token?.name || req.auth.token?.email || uid,
    prize: wonPrize.label || "",
    couponCode: code,
    timestamp: FieldValue.serverTimestamp(),
    branchId,
  });

  return {
    prize: {
      id: wonPrize.id || null,
      label: wonPrize.label || "",
      type: wonPrize.type || "none",
      value: Number(wonPrize.value || 0),
    },
    couponCode: code,
  };
});

async function getEffectiveFreeDeliveryThreshold({ db, branchId }) {
  const [globalSnap, branchSnap] = await Promise.all([
    db.collection("configs").doc("delivery").get(),
    db.collection(branchId).doc("deliveryConfig").collection("data").doc("main").get(),
  ]);
  const globalValue = globalSnap.exists ? Number(globalSnap.data()?.freeDeliveryThreshold || 0) : 0;
  const branchValue = branchSnap.exists ? Number(branchSnap.data()?.freeDeliveryThreshold || 0) : 0;
  if (branchValue > 0) return branchValue;
  return globalValue;
}

exports.createOrder = onCall({ region: "europe-west1" }, async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Login required");

  const { branchId, deliveryZoneId, couponCode, customer, cart } = req.data || {};
  if (!branchId) throw new HttpsError("invalid-argument", "branchId is required");
  if (!Array.isArray(cart) || cart.length === 0) throw new HttpsError("invalid-argument", "cart is required");

  const safeCustomer = {
    name: String(customer?.name || "").trim().slice(0, 80),
    phone: String(customer?.phone || "").trim().slice(0, 30),
    address: String(customer?.address || "").trim().slice(0, 200),
    notes: String(customer?.notes || "").trim().slice(0, 300),
  };
  if (!safeCustomer.name || !safeCustomer.phone || !safeCustomer.address) {
    throw new HttpsError("invalid-argument", "name/phone/address are required");
  }

  const db = getFirestore();
  const now = new Date();

  // Delivery zone
  let selectedZone = null;
  if (deliveryZoneId) {
    const zoneSnap = await db.collection(branchId).doc("deliveryZones").collection("data").doc(String(deliveryZoneId)).get();
    if (zoneSnap.exists) {
      const z = zoneSnap.data() || {};
      if (z.active !== false) {
        selectedZone = { id: zoneSnap.id, name: String(z.name || ""), fee: Number(z.fee || 0) || 0 };
      }
    }
  }
  const originalDeliveryFee = Number(selectedZone?.fee || 0) || 0;

  // Coupon
  let coupon = null;
  const normalizedCoupon = String(couponCode || "").trim().toUpperCase();
  if (normalizedCoupon) {
    const cSnap = await db.collection(branchId).doc("discountCoupons").collection("data").doc(normalizedCoupon).get();
    if (cSnap.exists) {
      const c = cSnap.data() || {};
      coupon = { id: cSnap.id, ...c };
    }
  }

  // Build priced items (server-side)
  const itemsOut = [];
  let subtotal = 0;

  for (const raw of cart) {
    const qty = Math.max(1, Number(raw?.qty) || 1);
    const rawId = String(raw?.id || "");
    const selectedSizeKey = normalizeSizeKey(raw?.selectedSize);

    // Offer item
    if (rawId.startsWith("offerItem_")) {
      const parts = rawId.split("_"); // offerItem_{scope}_{id}
      const scope = parts[1] || "global";
      const offerItemId = parts.slice(2).join("_");
      const ref =
        scope === "branch"
          ? db.collection(branchId).doc("offerItems").collection("data").doc(offerItemId)
          : db.collection("offerItems").doc(offerItemId);
      const snap = await ref.get();
      if (!snap.exists) throw new HttpsError("failed-precondition", "Offer item not found");
      const data = snap.data() || {};
      if (!isOfferActiveNow(data, now)) throw new HttpsError("failed-precondition", "Offer item not active");
      const price = Number(data.offerPrice || 0) || 0;
      if (!(price > 0)) throw new HttpsError("failed-precondition", "Invalid offer item price");
      subtotal += price * qty;
      itemsOut.push({
        kind: "offerItem",
        offerItemId: snap.id,
        scope,
        name: String(data.title || "Offer").slice(0, 120),
        qty,
        price: price,
        image: String(data.image || ""),
      });
      continue;
    }

    // Offer doc (scheduled offer) purchasable if offerPrice > 0
    if (rawId.startsWith("offerDoc_")) {
      const parts = rawId.split("_"); // offerDoc_{scope}_{id}
      const scope = parts[1] || "global";
      const offerId = parts.slice(2).join("_");
      const ref =
        scope === "branch"
          ? db.collection(branchId).doc("offers").collection("data").doc(offerId)
          : db.collection("offers").doc(offerId);
      const snap = await ref.get();
      if (!snap.exists) throw new HttpsError("failed-precondition", "Offer not found");
      const data = snap.data() || {};
      if (!isOfferActiveNow(data, now)) throw new HttpsError("failed-precondition", "Offer not active");
      const price = Number(data.offerPrice || 0) || 0;
      if (!(price > 0)) throw new HttpsError("failed-precondition", "Offer is not purchasable");
      subtotal += price * qty;
      itemsOut.push({
        kind: "offer",
        offerId: snap.id,
        scope,
        name: String(data.title || "Offer").slice(0, 120),
        qty,
        price: price,
        image: String(data.image || ""),
      });
      continue;
    }

    // Product
    const productId = rawId;
    const pSnap = await db.collection(branchId).doc("products").collection("data").doc(productId).get();
    if (!pSnap.exists) throw new HttpsError("failed-precondition", "Product not found");
    const p = pSnap.data() || {};
    const base =
      selectedSizeKey === "double"
        ? Number(p.price_double || 0)
        : selectedSizeKey === "triple"
          ? Number(p.price_triple || 0)
          : Number(p.price_single || 0);
    const pricing = applyProductDiscount(base, p);
    const unit = Number(pricing.discounted || 0) || 0;
    subtotal += unit * qty;
    itemsOut.push({
      kind: "product",
      productId,
      name: String(p.name || "").slice(0, 120),
      qty,
      selectedSize: selectedSizeKey,
      basePrice: Number(base || 0) || 0,
      unitPrice: unit,
      image: String(p.image || ""),
      discountActive: !!p.discountActive,
      discountType: p.discountType || "none",
      discountValue: Number(p.discountValue || 0) || 0,
    });
  }

  // Coupon discount (server-side)
  let couponDiscount = 0;
  let appliedCouponCode = null;
  if (coupon && coupon.active !== false) {
    const startOk = !coupon.startDate || new Date(coupon.startDate) <= now;
    const endOk = !coupon.endDate || new Date(coupon.endDate) >= now;
    const usageOk = !coupon.usageLimit || Number(coupon.usageCount || 0) < Number(coupon.usageLimit || 0);
    const minOk = subtotal >= (Number(coupon.minOrder || 0) || 0);
    if (startOk && endOk && usageOk && minOk) {
      const value = Number(coupon.value || 0) || 0;
      couponDiscount =
        coupon.type === "percent" ? subtotal * (clamp(value, 0, 100) / 100) : Math.min(value, subtotal);
      appliedCouponCode = String(coupon.code || coupon.id || "").toUpperCase() || null;
    }
  }

  const freeDeliveryThreshold = await getEffectiveFreeDeliveryThreshold({ db, branchId });
  const freeDeliveryApplied = Number(freeDeliveryThreshold || 0) > 0 && subtotal >= Number(freeDeliveryThreshold || 0);
  const deliveryFee = freeDeliveryApplied ? 0 : originalDeliveryFee;

  const finalSubtotal = Math.max(0, subtotal - couponDiscount);
  const total = Math.max(0, finalSubtotal + deliveryFee);

  // Persist order with shared id
  const orderRef = db.collection(branchId).doc("orders").collection("data").doc();
  const orderId = orderRef.id;
  const payload = {
    orderId,
    branchId,
    branchName: String(req.data?.branchName || ""), // optional
    clientUid: req.auth.uid,
    name: safeCustomer.name,
    phone: safeCustomer.phone,
    address: safeCustomer.address,
    notes: safeCustomer.notes,
    paymentMethod: "cash",
    items: itemsOut,
    subtotal,
    couponCode: appliedCouponCode,
    couponDiscount,
    deliveryZoneId: selectedZone?.id || null,
    deliveryZoneName: selectedZone?.name || null,
    deliveryFee,
    originalDeliveryFee,
    freeDeliveryApplied,
    total,
    createdAt: FieldValue.serverTimestamp(),
    status: "pending",
  };

  await Promise.all([
    orderRef.set(payload),
    db.collection("all_orders").doc(orderId).set(payload),
  ]);

  if (appliedCouponCode) {
    try {
      await db.collection(branchId).doc("discountCoupons").collection("data").doc(appliedCouponCode)
        .set({ usageCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    } catch (e) {}
  }

  return { ok: true, orderId, total, deliveryFee, freeDeliveryApplied };
});

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
