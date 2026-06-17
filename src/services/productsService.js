import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/** Firestore path: `{branchId}/products/data/{productId}` */
const productsCollection = (branchId) => collection(db, branchId, "products", "data");

/** Firestore path: `{branchId}/categories/data/{categoryId}` */
const categoriesCollection = (branchId) => collection(db, branchId, "categories", "data");

const normalizeBranchId = (branchId) => (
  typeof branchId === "string" ? branchId.trim() : ""
);

/**
 * Returns all active products for a branch.
 * @param {string} branchId - Branch document id (e.g. mansoura, zagazig).
 */
export const getBranchProducts = async (branchId) => {
  const safeBranchId = normalizeBranchId(branchId);
  if (!safeBranchId) return [];
  const snap = await getDocs(productsCollection(safeBranchId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Returns all menu categories for a branch.
 * @param {string} branchId - Branch document id.
 */
export const getBranchCategories = async (branchId) => {
  const safeBranchId = normalizeBranchId(branchId);
  if (!safeBranchId) return [];
  const snap = await getDocs(categoriesCollection(safeBranchId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Fetches products and categories in parallel for the menu page.
 * @param {string} branchId - Branch document id.
 * @returns {Promise<{ products: object[], categories: object[] }>}
 */
export const getBranchMenuData = async (branchId) => {
  const safeBranchId = normalizeBranchId(branchId);
  if (!safeBranchId) return { products: [], categories: [] };

  const [productsResult, categoriesResult] = await Promise.allSettled([
    getBranchProducts(safeBranchId),
    getBranchCategories(safeBranchId),
  ]);

  if (productsResult.status === "rejected") {
    throw productsResult.reason;
  }

  const products = productsResult.value || [];
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value || [] : [];
  return { products, categories };
};

/**
 * Loads a single product by id for the product details page.
 * @param {string} branchId
 * @param {string} productId
 */
export const getBranchProductById = async (branchId, productId) => {
  const safeBranchId = normalizeBranchId(branchId);
  if (!safeBranchId || !productId) return null;
  const productSnap = await getDoc(doc(db, safeBranchId, "products", "data", productId));
  if (!productSnap.exists()) return null;
  return { id: productSnap.id, ...productSnap.data() };
};
