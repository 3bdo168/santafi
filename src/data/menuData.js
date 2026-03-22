import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import CategorySection from "../components/CategorySection";

const categories = [
  { id: "chicken_sandwiches", name: "Chicken Sandwiches", icon: "🍗" },
  { id: "beef_sandwiches", name: "Beef Sandwiches", icon: "🍔" },
  { id: "side_items", name: "Side Items", icon: "🍟" },
];

const Menu = ({ addToCart }) => {
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = (item) => {
    addToCart(item);
    showToast(`${item.name} added to cart! 🛒`, "success");
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  // تقسيم المنتجات حسب الـ category
  const getItemsByCategory = (categoryId) =>
    products.filter((p) => p.category === categoryId);

  // لو مفيش category محدد، اعرض كل المنتجات في section واحدة
  const uncategorized = products.filter(
    (p) => !p.category || !categories.find((c) => c.id === p.category)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative pt-20 pb-16 px-4 md:px-8 text-center"
      >
        <h1 className="text-5xl md:text-7xl font-black mb-6 gradient-text">
          🔥 Our Premium Menu
        </h1>
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

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-orange-400 text-2xl animate-pulse">Loading menu...</div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-32 text-gray-400">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-xl">No products yet!</p>
        </div>
      ) : (
        <>
          {/* Categories من Firestore */}
          {categories.map((category) => {
            const items = getItemsByCategory(category.id);
            if (items.length === 0) return null;
            return (
              <CategorySection
                key={category.id}
                category={category}
                items={items}
                onAddToCart={handleAddToCart}
              />
            );
          })}

          {/* منتجات بدون category */}
          {uncategorized.length > 0 && (
            <CategorySection
              category={{ id: "other", name: "Other Items", icon: "🍽️" }}
              items={uncategorized}
              onAddToCart={handleAddToCart}
            />
          )}
        </>
      )}

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