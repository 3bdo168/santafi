// functions/index.js
// ==========================================
// تثبيت:
//   cd functions
//   npm install firebase-admin firebase-functions
//   firebase deploy --only functions
// ==========================================

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, WriteBatch } = require("firebase-admin/firestore");

initializeApp();

const BRANCHES = ["mansoura", "mit_ghamr", "zagazig"];

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
        if (order.status !== "pending") {
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