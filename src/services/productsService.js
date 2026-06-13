import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/** Firestore path: `{branchId}/products/data/{productId}` */
const productsCollection = (branchId) => collection(db, branchId, "products", "data");

/** Firestore path: `{branchId}/categories/data/{categoryId}` */
const categoriesCollection = (branchId) => collection(db, branchId, "categories", "data");

/**
 * Returns all active products for a branch.
 * @param {string} branchId - Branch document id (e.g. mansoura, zagazig).
 */
export const getBranchProducts = async (branchId) => {
  const snap = await getDocs(productsCollection(branchId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Returns all menu categories for a branch.
 * @param {string} branchId - Branch document id.
 */
export const getBranchCategories = async (branchId) => {
  const snap = await getDocs(categoriesCollection(branchId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Fetches products and categories in parallel for the menu page.
 * @param {string} branchId - Branch document id.
 * @returns {Promise<{ products: object[], categories: object[] }>}
 */
export const getBranchMenuData = async (branchId) => {
  const [products, categories] = await Promise.all([
    getBranchProducts(branchId),
    getBranchCategories(branchId),
  ]);
  return { products, categories };
};

/**
 * Loads a single product by id for the product details page.
 * @param {string} branchId
 * @param {string} productId
 */
export const getBranchProductById = async (branchId, productId) => {
  const productSnap = await getDoc(doc(db, branchId, "products", "data", productId));
  if (!productSnap.exists()) return null;
  return { id: productSnap.id, ...productSnap.data() };
};
