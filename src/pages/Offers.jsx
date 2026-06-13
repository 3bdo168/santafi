import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useClientBranch } from "../context/ClientBranchContext";
import { useCart } from "../context/CartContext";
import { getActiveOffersForBranch } from "../services/offersService";
import { getBranchProducts } from "../services/productsService";
import { getDiscountedProductPrice } from "../utils/pricing";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const Offers = () => {
  const { selectedBranch } = useClientBranch();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const branchId = selectedBranch?.id || null;

  const [offers, setOffers] = useState([]);
  const [offerItems, setOfferItems] = useState([]);
  const [discountedProducts, setDiscountedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      if (!branchId) return;
      setLoading(true);

      // 1️⃣ جلب العروض (banners)
      try {
        const offersResult = await getActiveOffersForBranch(branchId);
        const allOffers = [
          ...(offersResult.activeBranch || []),
          ...(offersResult.activeGlobal || []),
        ];
        setOffers(allOffers);
      } catch (err) {
        console.error("Error fetching offers:", err);
      }

      // 2️⃣ جلب وجبات العروض اللي الأدمن عملها
      try {
        const snap = await getDocs(collection(db, branchId, "offerItems", "data"));
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // فلتر الوجبات المفعّلة بس
        const activeItems = items.filter((it) => it.isActive !== false);
        setOfferItems(activeItems);
        console.log("✅ Offer items loaded:", activeItems.length, activeItems);
      } catch (err) {
        console.error("Error fetching offer items:", err);
      }

      // Also try global offer items
      try {
        const globalSnap = await getDocs(collection(db, "offerItems"));
        const globalItems = globalSnap.docs
          .map((d) => ({ id: d.id, ...d.data(), _isGlobal: true }))
          .filter((it) => it.isActive !== false);
        if (globalItems.length > 0) {
          setOfferItems((prev) => [...prev, ...globalItems]);
        }
      } catch (err) {
        console.error("Error fetching global offer items:", err);
      }

      // 3️⃣ جلب المنتجات العادية اللي عليها خصم
      try {
        const allProducts = await getBranchProducts(branchId);
        const withDiscount = allProducts.filter(
          (p) => p.discountActive && p.discountType && p.discountType !== "none" && Number(p.discountValue) > 0
        );
        setDiscountedProducts(withDiscount);
        console.log("✅ Discounted products loaded:", withDiscount.length);
      } catch (err) {
        console.error("Error fetching discounted products:", err);
      }

      setLoading(false);
    };
    fetchAll();
  }, [branchId]);

  const handleAddOfferItem = (item) => {
    addToCart({
      id: `offer_${item.id}`,
      name: item.title,
      image: item.image || "",
      price_single: Number(item.offerPrice) || 0,
      description: item.description || item.message || "",
      isOffer: true,
    });
    markAdded(item.id);
  };

  const handleAddOffer = (offer) => {
    addToCart({
      id: `offer_${offer.id}`,
      name: offer.title,
      image: offer.image || "",
      price_single: Number(offer.offerPrice) || 0,
      description: offer.message || "",
      isOffer: true,
    });
    markAdded(offer.id);
  };

  const handleAddDiscountedProduct = (product) => {
    const pricing = getDiscountedProductPrice(product, "single");
    addToCart({
      ...product,
      price_single: pricing.discounted,
    });
    markAdded(product.id);
  };

  const markAdded = (id) => {
    setAddedIds((prev) => [...prev, id]);
    setTimeout(() => {
      setAddedIds((prev) => prev.filter((x) => x !== id));
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full"
        />
      </div>
    );
  }

  const hasContent = offers.length > 0 || offerItems.length > 0 || discountedProducts.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black mb-3 flex items-center justify-center gap-3">
            <span style={{ WebkitTextFillColor: "initial", color: "initial" }}>🔥</span> <span className="gradient-text">العروض الحصرية</span>
          </h1>
          <p className="text-gray-400 text-lg">
            اغتنم الفرصة قبل ما تخلص!
          </p>
        </motion.div>

        {!hasContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-7xl mb-6">🎉</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">
              مفيش عروض حالياً
            </h2>
            <p className="text-gray-500">
              تابعنا عشان تعرف أول ما ينزل عرض جديد!
            </p>
          </motion.div>
        )}

        {/* ========== 1) Banner Offers (عروض مميزة) ========== */}
        {offers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-orange-400 mb-6 flex items-center gap-2">
              <span style={{ WebkitTextFillColor: "initial", color: "initial" }}>📢</span> عروض مميزة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence>
                {offers.map((offer, idx) => {
                  const isAdded = addedIds.includes(offer.id);
                  const hasPurchasablePrice = Number(offer.offerPrice || 0) > 0;
                  const discount =
                    Number(offer.originalPrice || 0) > 0 && hasPurchasablePrice
                      ? Math.round(((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100)
                      : 0;

                  return (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1, duration: 0.4 }}
                      whileHover={{ y: -4, boxShadow: "0 0 40px rgba(249, 115, 22, 0.15)" }}
                      className="glass rounded-2xl border border-orange-500/20 overflow-hidden group"
                    >
                      {offer.image && offer.image.startsWith("http") && (
                        <div className="w-full h-48 overflow-hidden relative">
                          <img
                            src={offer.image}
                            alt={offer.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          {discount > 0 && (
                            <div className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg">
                              -{discount}%
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-black text-white mb-2">{offer.title}</h3>
                        {offer.message && (
                          <p className="text-gray-400 text-sm mb-3 leading-relaxed">{offer.message}</p>
                        )}
                        <div className="flex items-center gap-3 mb-3">
                          {Number(offer.originalPrice || 0) > 0 && (
                            <span className="text-gray-500 line-through text-sm">
                              {Number(offer.originalPrice).toFixed(0)} ج
                            </span>
                          )}
                          {hasPurchasablePrice && (
                            <span className="text-orange-400 font-black text-xl">
                              {Number(offer.offerPrice).toFixed(0)} ج
                            </span>
                          )}
                        </div>
                        {offer.endsAt && (
                          <p className="text-gray-500 text-xs mb-4 flex items-center gap-1">
                            <span style={{ WebkitTextFillColor: "initial", color: "initial" }}>⏰</span> ينتهي: {new Date(offer.endsAt?.toDate?.() || offer.endsAt).toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        )}
                        {/* ✅ Add to Cart Button */}
                        {hasPurchasablePrice && (
                          <motion.button
                            whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(249, 115, 22, 0.4)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAddOffer(offer)}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                              isAdded
                                ? "bg-green-500 text-white"
                                : "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-neon"
                            }`}
                          >
                            {isAdded ? (
                              <span className="flex items-center justify-center gap-2">
                                <span style={{ WebkitTextFillColor: "initial", color: "initial" }}>✅</span> تمت الإضافة!
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                <span style={{ WebkitTextFillColor: "initial", color: "initial" }}>🛒</span> أضف للسلة
                              </span>
                            )}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ========== 2) وجبات العروض (Admin-created offer items) ========== */}
        {offerItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-orange-400 mb-6 flex items-center gap-2">
              <span style={{ WebkitTextFillColor: "initial", color: "initial" }}>🍔</span> وجبات العروض
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {offerItems.map((item, idx) => {
                  const isAdded = addedIds.includes(item.id);
                  const discount =
                    Number(item.originalPrice || 0) > 0 && Number(item.offerPrice || 0) > 0
                      ? Math.round(((item.originalPrice - item.offerPrice) / item.originalPrice) * 100)
                      : 0;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.4 }}
                      whileHover={{ y: -6 }}
                      className="glass rounded-2xl border border-orange-500/20 overflow-hidden group relative"
                    >
                      {discount > 0 && (
                        <div className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg">
                          -{discount}%
                        </div>
                      )}

                      {item.image && item.image.startsWith("http") ? (
                        <div className="w-full h-44 overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-44 bg-dark-800 flex items-center justify-center text-6xl">
                          🍔
                        </div>
                      )}

                      <div className="p-5">
                        <h3 className="text-lg font-black text-white mb-1 truncate">{item.title}</h3>
                        {item.description && (
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>
                        )}

                        <div className="flex items-center gap-2 mb-4">
                          {Number(item.originalPrice || 0) > 0 && (
                            <span className="text-gray-500 line-through text-sm">
                              {Number(item.originalPrice).toFixed(0)} ج
                            </span>
                          )}
                          <span className="text-orange-400 font-black text-xl">
                            {Number(item.offerPrice || 0).toFixed(0)} ج
                          </span>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(249, 115, 22, 0.4)" }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAddOfferItem(item)}
                          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                            isAdded
                              ? "bg-green-500 text-white"
                              : "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-neon"
                          }`}
                        >
                          {isAdded ? (
                            <span className="flex items-center justify-center gap-2">
                              <span style={{ WebkitTextFillColor: "initial", color: "initial" }}>✅</span> تمت الإضافة!
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <span style={{ WebkitTextFillColor: "initial", color: "initial" }}>🛒</span> أضف للسلة
                            </span>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ========== 3) منتجات عليها خصم (Discounted menu products) ========== */}
        {discountedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-orange-400 mb-6 flex items-center gap-2">
              <span style={{ WebkitTextFillColor: "initial", color: "initial" }}>💰</span> منتجات عليها خصم
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {discountedProducts.map((product, idx) => {
                const pricing = getDiscountedProductPrice(product, "single");
                const isAdded = addedIds.includes(product.id);
                const discountPercent =
                  pricing.original > 0
                    ? Math.round((pricing.discountAmount / pricing.original) * 100)
                    : 0;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.4 }}
                    whileHover={{ y: -6 }}
                    className="glass rounded-2xl border border-orange-500/20 overflow-hidden group relative cursor-pointer"
                  >
                    {/* Discount Badge */}
                    {discountPercent > 0 && (
                      <div className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg">
                        -{discountPercent}%
                      </div>
                    )}

                    {/* Image */}
                    <div
                      className="w-full h-44 overflow-hidden"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {product.image && product.image.startsWith("http") ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-dark-800 flex items-center justify-center text-6xl">
                          {product.image || "🍔"}
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h3
                        className="text-lg font-black text-white mb-1 truncate cursor-pointer hover:text-orange-400 transition-colors"
                        onClick={() => navigate(`/product/${product.id}`)}
                      >
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                      )}

                      {/* Pricing */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-gray-500 line-through text-sm">
                          {pricing.original.toFixed(0)} ج
                        </span>
                        <span className="text-orange-400 font-black text-xl">
                          {pricing.discounted.toFixed(0)} ج
                        </span>
                        {product.discountType === "fixed" && (
                          <span className="text-xs text-green-400 font-bold">
                            وفّر {pricing.discountAmount.toFixed(0)} ج
                          </span>
                        )}
                      </div>

                      {/* Add to Cart */}
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(249, 115, 22, 0.4)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAddDiscountedProduct(product)}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                          isAdded
                            ? "bg-green-500 text-white"
                            : "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-neon"
                        }`}
                      >
                        {isAdded ? (
                          <span className="flex items-center justify-center gap-2">
                            <span style={{ WebkitTextFillColor: "initial", color: "initial" }}>✅</span> تمت الإضافة!
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <span style={{ WebkitTextFillColor: "initial", color: "initial" }}>🛒</span> أضف للسلة
                          </span>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Offers;
