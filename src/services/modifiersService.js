import { collection, getDoc, getDocs, doc } from "firebase/firestore";
import { db } from "../firebase";

export const getModifierGroups = async () => {
  const snap = await getDocs(collection(db, "modifierGroups"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getModifierGroupOptions = async (groupId) => {
  const snap = await getDocs(collection(db, "modifierGroups", groupId, "options"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getModifierGroupsWithOptions = async (groupIds = []) => {
  const uniqueIds = Array.from(new Set((groupIds || []).filter(Boolean)));
  const groupsSnap = await Promise.all(uniqueIds.map((id) => getDoc(doc(db, "modifierGroups", id))));
  const groups = groupsSnap
    .filter((s) => s.exists())
    .map((s) => ({ id: s.id, ...s.data() }));

  const optionsByGroup = {};
  await Promise.all(
    groups.map(async (g) => {
      optionsByGroup[g.id] = await getModifierGroupOptions(g.id);
    })
  );
  return { groups, optionsByGroup };
};

