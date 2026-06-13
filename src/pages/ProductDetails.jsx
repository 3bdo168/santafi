// src/pages/ProductDetails.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useClientBranch } from "../context/ClientBranchContext";
import { useCart } from "../context/CartContext";
import { getBranchProductById, getBranchProducts } from "../services/productsService";
import { getDiscountedProductPrice } from "../utils/pricing";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedBranch } = useClientBranch();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedSize, setSelectedSize] = useState("single");
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  // ✅ Modifiers state
  const [modifierGroups, setModifierGroups] = useState([]);
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [modifiersLoading, setModifiersLoading] = useState(false);

  const fetchRelated = useCallback(async (branchId, category, currentId) => {
    try {
      const all = await getBranchProducts(branchId);
      const filtered = all
        .filter((p) => p.category === category && p.id !== currentId)
        .slice(0, 3);
      setRelated(filtered);
    } catch (err) {
      console.error("Error fetching related:", err);
    }
  }, []);

  // ✅ Fetch modifier groups and their options
  const fetchModifiers = useCallback(async (groupIds) => {
    if (!groupIds || groupIds.length === 0) {
      setModifierGroups([]);
      return;
    }
    setModifiersLoading(true);
    try {
      const groups = [];
      for (const gId of groupIds) {
        const groupSnap = await getDoc(doc(db, "modifierGroups", gId));
        if (groupSnap.exists()) {
          const optionsSnap = await getDocs(collection(db, "modifierGroups", gId, "options"));
          const options = optionsSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((o) => o.isActive !== false);
          groups.push({ id: gId, ...groupSnap.data(), options });
        }
      }
      setModifierGroups(groups);
      // Initialize default selections for single-select groups
      const defaults = {};
      groups.forEach((g) => {
        if (g.selectionMode === "single" && Number(g.min) > 0 && g.options.length > 0) {
          defaults[g.id] = [g.options[0].id];
        } else {
          defaults[g.id] = [];
        }
      });
      setSelectedModifiers(defaults);
    } catch (err) {
      console.error("Error fetching modifiers:", err);
    } finally {
      setModifiersLoading(false);
    }
  }, []);

  const fetchProduct = useCallback(async () => {
    if (!selectedBranch?.id) return;
    setLoading(true);
    try {
      const branchId = selectedBranch.id;
      const data = await getBranchProductById(branchId, id);
      if (data) {
        setProduct(data);
        fetchRelated(branchId, data.category, data.id);
        // ✅ Load modifiers if product has them
        if (data.modifierGroupIds && data.modifierGroupIds.length > 0) {
          fetchModifiers(data.modifierGroupIds);
        } else {
          setModifierGroups([]);
          setSelectedModifiers({});
        }
      } else {
        navigate("/menu");
      }
    } catch (err) {
      console.error("Error fetching product:", err);
      navigate("/menu");
    } finally {
      setLoading(false);
    }
  }, [fetchRelated, fetchModifiers, id, navigate, selectedBranch?.id]);

  useEffect(() => {
    if (!selectedBranch?.id) {
      navigate("/");
      return;
    }
    fetchProduct();
  }, [fetchProduct, navigate, selectedBranch?.id]);

  // ✅ Handle modifier selection
  const handleModifierToggle = (groupId, optionId, selectionMode) => {
    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];
      if (selectionMode === "single") {
        return { ...prev, [groupId]: [optionId] };
      }
      // multi
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      // Check max
      const group = modifierGroups.find((g) => g.id === groupId);
      const max = Number(group?.max || 999);
      if (current.length >= max) return prev;
      return { ...prev, [groupId]: [...current, optionId] };
    });
  };

  // ✅ Calculate modifiers total price
  const getModifiersTotal = () => {
    let total = 0;
    modifierGroups.forEach((g) => {
      const selected = selectedModifiers[g.id] || [];
      g.options.forEach((opt) => {
        if (selected.includes(opt.id)) {
          total += Number(opt.priceDelta || 0);
        }
      });
    });
    return total;
  };

  // ✅ Get selected modifiers as array for cart
  const getSelectedModifiersArray = () => {
    const result = [];
    modifierGroups.forEach((g) => {
      const selected = selectedModifiers[g.id] || [];
      g.options.forEach((opt) => {
        if (selected.includes(opt.id)) {
          result.push({
            groupId: g.id,
            groupTitle: g.title,
            optionId: opt.id,
            optionName: opt.name,
            priceDelta: Number(opt.priceDelta || 0),
            image: opt.image || "",
          });
        }
      });
    });
    return result;
  };

  const getSelectedPrice = () => {
    if (!product) return 0;
    return getDiscountedProductPrice(product, selectedSize).discounted;
  };

  const getTotalPrice = () => {
    return (getSelectedPrice() || 0) + getModifiersTotal();
  };

  const handleAddToCart = () => {
    const modifiers = getSelectedModifiersArray();
    addToCart({
      ...product,
      price_single: Number(getTotalPrice()) || 0,
      selectedSize,
      selectedModifiers: modifiers,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-orange-400 text-2xl animate-pulse">Loading...</div>
    </div>
  );

  if (!product) return null;

  const sizes = [
    { key: "single", label: "Small", pricing: getDiscountedProductPrice(product, "single"), raw: product.price_single },
    { key: "double", label: "Double", pricing: getDiscountedProductPrice(product, "double"), raw: product.price_double },
    { key: "triple", label: "Triple", pricing: getDiscountedProductPrice(product, "triple"), raw: product.price_triple },
  ].filter((s) => s.raw);

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -5 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-orange-400 transition-colors mb-8 font-semibold"
        >
          ← Back to Menu
        </motion.button>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="w-full h-80 md:h-96 rounded-2xl overflow-hidden glass border border-orange-500/20">
              {product.image && product.image.startsWith("http") ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">
                  {product.image || "🍔"}
                </div>
              )}
            </div>
            {product.isNew && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full font-bold shadow-neon"
              >
                ⭐ NEW
              </motion.div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center space-y-6"
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-black gradient-text mb-3">
                {product.name}
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Size Selector */}
            {sizes.length > 1 && (
              <div>
                <p className="text-gray-400 font-semibold mb-3">Choose Size:</p>
                <div className="flex gap-3 flex-wrap">
                  {sizes.map((size) => (
                    <motion.button
                      key={size.key}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSize(size.key)}
                      className={`px-6 py-3 rounded-xl font-bold transition-all ${
                        selectedSize === size.key
                          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-neon"
                          : "glass border border-orange-500/30 text-gray-300 hover:border-orange-500/60"
                      }`}
                    >
                      {size.label}
                      <span className="block text-sm font-normal mt-0.5">
                        {size.pricing?.discounted?.toFixed(2)} ج
                        {size.pricing?.discountAmount > 0 && (
                          <span className="ml-2 line-through text-xs text-gray-500">
                            {size.pricing.original.toFixed(2)}
                          </span>
                        )}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* ✅ Modifiers / Add-ons Section */}
            {modifierGroups.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <p className="text-gray-400 font-semibold flex items-center gap-2">
                  🧩 الإضافات
                  {modifiersLoading && <span className="text-xs text-orange-400 animate-pulse">جاري التحميل...</span>}
                </p>
                {modifierGroups.map((group) => {
                  const selected = selectedModifiers[group.id] || [];
                  const isRequired = Number(group.min || 0) > 0;
                  return (
                    <div key={group.id} className="glass p-4 rounded-xl border border-orange-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-white font-bold text-sm">
                          {group.title}
                          {isRequired && <span className="text-red-400 text-xs mr-2"> (مطلوب)</span>}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {group.selectionMode === "single" ? "اختار واحد" : `اختار حتى ${group.max || "∞"}`}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {group.options.map((opt) => {
                          const isSelected = selected.includes(opt.id);
                          return (
                            <motion.button
                              key={opt.id}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleModifierToggle(group.id, opt.id, group.selectionMode)}
                              className={`relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                isSelected
                                  ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500 text-white"
                                  : "bg-dark-800/60 border border-orange-500/15 text-gray-400 hover:border-orange-500/40 hover:text-gray-200"
                              }`}
                            >
                              {/* Check indicator */}
                              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                isSelected
                                  ? "border-orange-500 bg-orange-500"
                                  : "border-gray-600"
                              }`}>
                                {isSelected && (
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </span>
                              {/* Option image */}
                              {opt.image && opt.image.startsWith("http") && (
                                <img src={opt.image} alt={opt.name} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                              )}
                              <span className="truncate">{opt.name}</span>
                              {Number(opt.priceDelta || 0) > 0 && (
                                <span className="text-orange-400 text-xs font-bold ml-auto flex-shrink-0">
                                  +{Number(opt.priceDelta).toFixed(0)}ج
                                </span>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* Price */}
            <div className="glass p-5 rounded-xl border border-orange-500/20">
              <p className="text-gray-400 text-sm mb-1">السعر الإجمالي</p>
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-black gradient-text">{getTotalPrice()?.toFixed(2)} ج</p>
                {getModifiersTotal() > 0 && (
                  <p className="text-gray-500 text-xs">
                    ({getSelectedPrice()?.toFixed(2)} + {getModifiersTotal().toFixed(2)} إضافات)
                  </p>
                )}
              </div>
            </div>

            {/* Add to Cart */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(249, 115, 22, 0.7)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              className={`w-full py-5 font-black text-xl rounded-xl transition-all ${
                added
                  ? "bg-green-500 text-white"
                  : "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-neon"
              }`}
            >
              {added ? "✅ Added to Cart!" : "🛒 Add to Cart"}
            </motion.button>
          </motion.div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-black gradient-text mb-8">
              🔥 You Might Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -8 }}
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="glass p-5 rounded-2xl border border-orange-500/20 cursor-pointer hover:border-orange-500/50 transition-all"
                >
                  <div className="w-full h-40 rounded-xl overflow-hidden mb-4">
                    {item.image && item.image.startsWith("http") ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-dark-800 flex items-center justify-center text-5xl">
                        {item.image || "🍔"}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-white mb-1">{item.name}</h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>
                  <p className="text-orange-400 font-black">{item.price_single?.toFixed(2)} ج</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default ProductDetails;