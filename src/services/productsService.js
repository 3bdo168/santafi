import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export const getBranchProducts = async (branchId) => {
  const snap = await getDocs(collection(db, branchId, "products", "data"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getBranchCategories = async (branchId) => {
  const snap = await getDocs(collection(db, branchId, "categories", "data"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getBranchMenuData = async (branchId) => {
  const [products, categories] = await Promise.all([
    getBranchProducts(branchId),
    getBranchCategories(branchId),
  ]);
  return { products, categories };
};

export const getBranchProductById = async (branchId, productId) => {
  const productSnap = await getDoc(doc(db, branchId, "products", "data", productId));
  if (!productSnap.exists()) return null;
  return { id: productSnap.id, ...productSnap.data() };
};
