import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}

type WheelPrize = {
  id?: string;
  label?: string;
  type?: string;
  value?: number;
  weight?: number;
  enabled?: boolean;
  minOrderAmount?: number;
};

const buildCouponCode = () => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `SPIN-${suffix}`;
};

const pickPrize = (prizes: WheelPrize[]) => {
  const enabledPrizes = prizes.filter((prize) => prize.enabled !== false && Number(prize.weight || 0) > 0);
  const totalWeight = enabledPrizes.reduce((sum, prize) => sum + Number(prize.weight || 0), 0);

  if (!enabledPrizes.length || totalWeight <= 0) {
    throw new HttpsError("failed-precondition", "لا توجد جوائز متاحة");
  }

  const random = Math.random() * totalWeight;
  let accumulated = 0;

  for (const prize of enabledPrizes) {
    accumulated += Number(prize.weight || 0);
    if (random <= accumulated) return prize;
  }

  return enabledPrizes[enabledPrizes.length - 1];
};

export const spinWheel = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login required");
  }

  const branchId = String(request.data?.branchId || "").trim();
  if (!branchId) {
    throw new HttpsError("invalid-argument", "branchId is required");
  }

  const db = getFirestore();
  const userId = request.auth.uid;
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = Timestamp.fromDate(today);

  const settingsSnap = await db.collection("wheelSettings").doc(branchId).get();
  if (!settingsSnap.exists) {
    throw new HttpsError("failed-precondition", "العجلة غير متاحة الآن");
  }

  const settings = settingsSnap.data() || {};
  const dailyLimit = Math.max(0, Number(settings.dailyLimit || 0));

  const todaySpinsSnap = await db.collection("wheelSpins")
    .where("userId", "==", userId)
    .where("branchId", "==", branchId)
    .where("timestamp", ">=", todayTimestamp)
    .get();

  if (dailyLimit > 0 && todaySpinsSnap.size >= dailyLimit) {
    throw new HttpsError("resource-exhausted", "استنفذت لفاتك النهارده");
  }

  const todayCouponsSnap = await db.collection("coupons")
    .where("userId", "==", userId)
    .where("source", "==", "wheel")
    .where("createdAt", ">=", todayTimestamp)
    .limit(1)
    .get();

  if (!todayCouponsSnap.empty) {
    throw new HttpsError("failed-precondition", "فازت بكوبون النهارده بالفعل");
  }

  const prizes = Array.isArray(settings.prizes) ? settings.prizes as WheelPrize[] : [];
  const prize = pickPrize(prizes);
  let couponCode: string | null = null;

  if (prize.type !== "none") {
    couponCode = buildCouponCode();
    await db.collection("coupons").add({
      code: couponCode,
      discount: Number(prize.value || 0),
      type: prize.type || "none",
      userId,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(now.getTime() + 48 * 60 * 60 * 1000)),
      used: false,
      source: "wheel",
      minOrderAmount: Number(prize.minOrderAmount || 0),
    });
  }

  await db.collection("wheelSpins").add({
    userId,
    userName: request.auth.token?.name || request.auth.token?.email || userId,
    prize: prize.label || "",
    couponCode,
    timestamp: FieldValue.serverTimestamp(),
    branchId,
  });

  return {
    prize: {
      id: prize.id || null,
      label: prize.label || "",
      type: prize.type || "none",
      value: Number(prize.value || 0),
      weight: Number(prize.weight || 0),
      minOrderAmount: Number(prize.minOrderAmount || 0),
    },
    couponCode,
  };
});
