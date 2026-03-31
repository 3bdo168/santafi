import { useEffect, useState } from "react";
import { getBranchProducts } from "../services/productsService";

const DEFAULT_BRANCH_ID = "mansoura";

export const useBranchProducts = (branchId, options = {}) => {
  const { useFallbackBranch = true } = options;
  const effectiveBranchId = branchId || (useFallbackBranch ? DEFAULT_BRANCH_ID : null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(Boolean(effectiveBranchId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!effectiveBranchId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getBranchProducts(effectiveBranchId);
        if (mounted) {
          setProducts(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          setProducts([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [effectiveBranchId]);

  return { products, loading, error, effectiveBranchId };
};
