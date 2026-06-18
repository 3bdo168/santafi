import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { applyProductDiscount } from "../utils/pricing";

const RecommendationsPopup = ({ branchId, cart, onAddToCart }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());

  useEffect(() => {
    if (!branchId || dismissed) return;
    const fetchRecs = async () => {
      try {
        const snap = await getDocs(
          collection(db, branchId, "recommendations", "data")
        );
        const recs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((r) => r.isActive !== false);

        // فلتر المنتجات اللي مش في الـ cart
        const cartIds = new Set(cart.map((i) => i.id));
        const filtered = recs.filter((r) => !cartIds.has(r.productId));

        if (filtered.length > 0) {
          setRecommendations(filtered);
          // no artificial delay needed
          setVisible(true);
        }
      } catch (err) {
        console.error("Failed to load recommendations:", err);
      }
    };
    fetchRecs();
  }, [branchId, dismissed]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = (rec) => {
    const priceInfo = applyProductDiscount(rec.originalPrice, {
      discountActive: rec.discountActive,
      discountType: rec.discountType,
      discountValue: rec.discountValue,
    });

    onAddToCart({
      id: rec.productId,
      name: rec.productName,
      image: rec.image,
      price_single: priceInfo.discounted,
    });

    setAddedIds((prev) => new Set([...prev, rec.id]));
  };

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => setDismissed(true), 300);
  };

  if (dismissed || recommendations.length === 0) return null;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-hidden flex flex-col md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:rounded-2xl"
          >
            <div className="bg-gradient-to-b from-dark-800 to-dark-900 rounded-t-3xl md:rounded-2xl border border-orange-500/30 shadow-2xl shadow-orange-500/10 overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="relative overflow-hidden px-6 pt-6 pb-4 flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10" />
                <div className="relative">
                  {/* Handle bar for mobile */}
                  <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4 md:hidden" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.span
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                        className="text-3xl"
                      >
                        🌟
                      </motion.span>
                      <div>
                        <h2 className="text-xl font-black text-white">
                          ممكن يعجبك كمان!
                        </h2>
                        <p className="text-gray-400 text-xs">
                          منتجات مرشحة ليك خصيصاً
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleDismiss}
                      className="w-8 h-8 rounded-full bg-dark-700 border border-gray-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    >
                      ✕
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="px-4 pb-4 overflow-y-auto flex-1 space-y-3">
                {recommendations.map((rec) => {
                  const isAdded = addedIds.has(rec.id);
                  const priceInfo = applyProductDiscount(rec.originalPrice, {
                    discountActive: rec.discountActive,
                    discountType: rec.discountType,
                    discountValue: rec.discountValue,
                  });
                  const hasDiscount = priceInfo.discountAmount > 0;

                  return (
                    <motion.div
                      key={rec.id}
                      layout
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isAdded
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-dark-800/80 border-orange-500/20 hover:border-orange-500/40"
                      }`}
                    >
                      {/* Image */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-dark-700 relative">
                        {rec.image?.startsWith("http") ? (
                          <img
                            src={rec.image}
                            alt={rec.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="flex items-center justify-center w-full h-full text-3xl">
                            {rec.image || "🍔"}
                          </span>
                        )}
                        {hasDiscount && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                            {rec.discountType === "percent"
                              ? `-${rec.discountValue}%`
                              : `-${rec.discountValue}ج`}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">
                          {rec.productName}
                        </p>
                        {rec.message && (
                          <p className="text-gray-400 text-xs truncate">
                            {rec.message}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {hasDiscount ? (
                            <>
                              <span className="text-orange-400 font-black text-sm">
                                {priceInfo.discounted.toFixed(2)} ج
                              </span>
                              <span className="text-gray-500 text-xs line-through">
                                {priceInfo.original.toFixed(2)} ج
                              </span>
                            </>
                          ) : (
                            <span className="text-orange-400 font-black text-sm">
                              {rec.originalPrice?.toFixed(2)} ج
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add button */}
                      <motion.button
                        whileHover={{ scale: isAdded ? 1 : 1.05 }}
                        whileTap={{ scale: isAdded ? 1 : 0.95 }}
                        onClick={() => !isAdded && handleAdd(rec)}
                        disabled={isAdded}
                        className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                          isAdded
                            ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default"
                            : "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20"
                        }`}
                      >
                        {isAdded ? "✓ اتضاف" : "+ أضف"}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 pb-5 pt-2 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDismiss}
                  className="w-full py-3.5 border-2 border-orange-500/30 text-orange-400 font-bold rounded-xl text-sm hover:border-orange-500/60 transition-all"
                >
                  متابعة الدفع ←
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RecommendationsPopup;
