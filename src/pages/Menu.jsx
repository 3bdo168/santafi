// src/pages/Menu.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useClientBranch } from "../context/ClientBranchContext"; // ✅
import CategorySection from "../components/CategorySection";
import { useNavigate } from "react-router-dom";

const Menu = ({ addToCart }) => {
  const navigate = useNavigate();
  const { selectedBranch } = useClientBranch(); // ✅ جيب الفرع المختار

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    // ✅ لو مفيش فرع مختار، مترجعش - الـ guard تحت هيتعامل معاه
    if (!selectedBranch?.id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const branchId = selectedBranch.id;

        // ✅ بيقرأ من /{branchId}/products/data و /{branchId}/categories/data
        const [productsSnap, categoriesSnap] = await Promise.all([
          getDocs(collection(db, branchId, "products", "data")),
          getDocs(collection(db, branchId, "categories", "data")),
        ]);

        setProducts(productsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCategories(categoriesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching menu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBranch?.id]); // ✅ بيعيد الـ fetch لو اتغير الفرع

  const handleAddToCart = (item) => {
    addToCart(item);
    showToast(`${item.name} added to cart! 🛒`, "success");
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const allCategories = [
    { id: "all", name: "All Items", icon: "🔥", slug: "all" },
    ...categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon, slug: c.slug })),
  ];

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      activeCategory === "all" || p.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const getItemsBySlug = (slug) =>
    filteredProducts.filter((p) => p.category === slug);

  const uncategorized = filteredProducts.filter(
    (p) => !p.category || !categories.find((c) => c.slug === p.category)
  );

  // ── Guard: لو مفيش فرع مختار ────────────────────────────
  if (!selectedBranch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-dark-900 to-dark-800">
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <p className="text-xl text-gray-400 mb-6">لم يتم اختيار الفرع!</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl"
          >
            اختار الفرع
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative pt-20 pb-8 px-4 md:px-8 text-center"
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <img
            src="https://res.cloudinary.com/dkgiwnpfi/image/upload/v1774112719/Screenshot_2026-03-21_184621-removebg-preview_zzpxcw.png"
            alt="santafi"
            className="w-16 h-16 object-contain"
          />
          <h1 className="text-5xl md:text-7xl font-black gradient-text">
            Our Premium Menu
          </h1>
        </div>

        {/* ✅ بيظهر اسم الفرع تحت العنوان */}
        <p className="text-gray-500 text-sm mb-2">
          🏪 {selectedBranch.name}
        </p>

        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Discover our carefully crafted menu with the finest fast-food offerings
        </p>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 100 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto mt-8"
        />
      </motion.div>

      {/* Search + Filter */}
      <div className="px-4 md:px-8 pb-8 max-w-7xl mx-auto">

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative mb-6"
        >
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for anything..."
            className="w-full pl-12 pr-4 py-4 bg-dark-800/50 border border-orange-500/30 rounded-xl focus:outline-none focus:border-orange-500 text-white text-lg transition-all placeholder-gray-500"
          />
          {search && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xl transition-colors"
            >
              ✕
            </motion.button>
          )}
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        >
          {loading ? (
            <div className="text-gray-400 text-sm py-3">Loading categories...</div>
          ) : (
            allCategories.map((cat) => (
              <motion.button
                key={cat.slug}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat.slug)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat.slug
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-neon"
                    : "glass border border-orange-500/20 text-gray-300 hover:border-orange-500/50"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                {activeCategory === cat.slug && (
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                    {cat.slug === "all"
                      ? filteredProducts.length
                      : filteredProducts.filter((p) => p.category === cat.slug).length}
                  </span>
                )}
              </motion.button>
            ))
          )}
        </motion.div>

        {/* Search Results Info */}
        <AnimatePresence>
          {search && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-gray-400 mt-4 text-sm"
            >
              {filteredProducts.length > 0
                ? `Found ${filteredProducts.length} result${filteredProducts.length > 1 ? "s" : ""} for "${search}"`
                : `No results for "${search}"`}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Products */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-orange-400 text-2xl animate-pulse">Loading menu...</div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-32 text-gray-400"
        >
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl">No items found!</p>
          <p className="text-sm mt-2 text-gray-500">Try a different search or category</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setSearch(""); setActiveCategory("all"); }}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl"
          >
            Clear Filters
          </motion.button>
        </motion.div>
      ) : (
        <>
          {activeCategory === "all" ? (
            <>
              {categories.map((cat) => {
                const items = getItemsBySlug(cat.slug);
                if (items.length === 0) return null;
                return (
                  <CategorySection
                    key={cat.id}
                    category={{ id: cat.slug, name: cat.name, icon: cat.icon }}
                    items={items}
                    onAddToCart={handleAddToCart}
                  />
                );
              })}
              {uncategorized.length > 0 && (
                <CategorySection
                  category={{ id: "other", name: "Other Items", icon: "🍽️" }}
                  items={uncategorized}
                  onAddToCart={handleAddToCart}
                />
              )}
            </>
          ) : (
            <CategorySection
              category={allCategories.find((c) => c.slug === activeCategory)}
              items={filteredProducts}
              onAddToCart={handleAddToCart}
            />
          )}
        </>
      )}

      {/* Toast */}
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-neon-lg font-semibold">
            {toast.message}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Menu;