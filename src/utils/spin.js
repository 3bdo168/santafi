import { doc } from "firebase/firestore";
import { db } from "../firebase";

export const spinConfigRef = doc(db, "spinConfig", "data");

export const spinUserRef = (userId) => doc(db, "spinUsers", userId);

export const todaySpinLogId = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const spinLogRef = (dateId = todaySpinLogId()) => doc(db, "spinLogs", dateId);

export const normalizeSpinConfig = (data = {}) => ({
  enabled: Boolean(data.enabled),
  dailyLimit: Math.max(0, Number(data.dailyLimit || 0)),
  prizes: Array.isArray(data.prizes) ? data.prizes : [],
});

export const pickWeightedPrize = (prizes = []) => {
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
