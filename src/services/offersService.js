import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const isOfferActiveNow = (offer, now = new Date()) => {
  if (!offer) return false;
  if (offer.isActive === false) return false;

  const start = offer.startsAt?.toDate?.() || (offer.startsAt ? new Date(offer.startsAt) : null);
  const end = offer.endsAt?.toDate?.() || (offer.endsAt ? new Date(offer.endsAt) : null);

  if (start && start.getTime() > now.getTime()) return false;
  if (end && end.getTime() < now.getTime()) return false;
  return true;
};

export const getGlobalOffers = async () => {
  const snap = await getDocs(collection(db, "offers"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getBranchOffers = async (branchId) => {
  const snap = await getDocs(collection(db, branchId, "offers", "data"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getActiveOffersForBranch = async (branchId) => {
  const now = new Date();

  // Fetch both, filter client-side to avoid composite index requirements
  const [globalOffers, branchOffers] = await Promise.all([
    getGlobalOffers(),
    branchId ? getBranchOffers(branchId) : Promise.resolve([]),
  ]);

  const activeGlobal = globalOffers.filter((o) => isOfferActiveNow(o, now));
  const activeBranch = branchOffers.filter((o) => isOfferActiveNow(o, now));

  // branch offers override global if both exist
  return { activeGlobal, activeBranch };
};

