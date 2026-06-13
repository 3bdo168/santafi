import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export const getFreeDeliveryThresholdConfig = async ({ branchId }) => {
  const [globalSnap, branchSnap] = await Promise.all([
    getDoc(doc(db, "configs", "delivery")),
    branchId ? getDoc(doc(db, branchId, "deliveryConfig", "data", "main")) : Promise.resolve(null),
  ]);

  const globalValue = globalSnap.exists() ? Number(globalSnap.data()?.freeDeliveryThreshold || 0) : 0;
  const branchValue = branchSnap?.exists?.() ? Number(branchSnap.data()?.freeDeliveryThreshold || 0) : null;

  const effective =
    typeof branchValue === "number" && !Number.isNaN(branchValue) && branchValue > 0
      ? branchValue
      : globalValue;

  return { globalValue, branchValue, effective: Math.max(0, Number(effective) || 0) };
};

export const setFreeDeliveryThreshold = async ({ branchId, scope, value }) => {
  const num = Math.max(0, Number(value) || 0);
  if (scope === "global") {
    await setDoc(
      doc(db, "configs", "delivery"),
      { freeDeliveryThreshold: num, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return num;
  }
  if (!branchId) throw new Error("missing branchId");
  await setDoc(doc(db, branchId, "deliveryConfig", "data", "main"), { freeDeliveryThreshold: num, updatedAt: serverTimestamp() }, { merge: true });
  return num;
};

