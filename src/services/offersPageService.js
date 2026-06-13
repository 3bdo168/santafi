import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const isActiveNow = (docData, now = new Date()) => {
  if (!docData) return false;
  if (docData.isActive === false) return false;
  const start = docData.startsAt?.toDate?.() || (docData.startsAt ? new Date(docData.startsAt) : null);
  const end = docData.endsAt?.toDate?.() || (docData.endsAt ? new Date(docData.endsAt) : null);
  if (start && start.getTime() > now.getTime()) return false;
  if (end && end.getTime() < now.getTime()) return false;
  return true;
};

export const getOffersPageConfig = async (branchId) => {
  const [globalSnap, branchSnap] = await Promise.all([
    getDoc(doc(db, "configs", "offersPage")),
    branchId ? getDoc(doc(db, branchId, "offersPageConfig", "data", "main")) : Promise.resolve(null),
  ]);

  const globalCfg = globalSnap.exists() ? globalSnap.data() : null;
  const branchCfg = branchSnap?.exists?.() ? branchSnap.data() : null;

  const enabled =
    typeof branchCfg?.enabled === "boolean"
      ? branchCfg.enabled
      : (typeof globalCfg?.enabled === "boolean" ? globalCfg.enabled : false);

  return { enabled, globalCfg, branchCfg };
};

export const getOfferItems = async ({ branchId, scope }) => {
  const now = new Date();
  if (scope === "global") {
    const snap = await getDocs(collection(db, "offerItems"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => isActiveNow(x, now));
  }
  const snap = await getDocs(collection(db, branchId, "offerItems", "data"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => isActiveNow(x, now));
};

export const getActiveOfferItemsForBranch = async (branchId) => {
  const [globalItems, branchItems] = await Promise.all([
    getOfferItems({ branchId, scope: "global" }),
    branchId ? getOfferItems({ branchId, scope: "branch" }) : Promise.resolve([]),
  ]);
  return { globalItems, branchItems };
};

