import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const ProductDetails = ({ addToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedSize, setSelectedSize] = useState("single");
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, "products", id));
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setProduct(data);
        fetchRelated(data.category, data.id);
      } else {
        navigate("/menu");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRelated = async (category, currentId) => {
    const snap = await getDocs(collection(db, "products"));
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const filtered = all
      .filter((p) => p.category === category && p.id !== currentId)
      .slice(0, 3);
    setRelated(filtered);
  };

  const getSelectedPrice = () => {
    if (!product) return 0;
    if (selectedSize === "single") return product.price_single;
    if (selectedSize === "double") return product.price_double;
    if (selectedSize === "triple") return product.price_triple;
    return product.price_single;
  };

  const handleAddToCart = () => {
    addToCart({ ...product, price_single: getSelectedPrice() });
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
    { key: "single", label: "Small", price: product.price_single },
    { key: "double", label: "Double", price: product.price_double },
    { key: "triple", label: "Triple", price: product.price_triple },
  ].filter((s) => s.price);

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
                        ${size.price?.toFixed(2)}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="glass p-5 rounded-xl border border-orange-500/20">
              <p className="text-gray-400 text-sm mb-1">Price</p>
              <p className="text-4xl font-black gradient-text">
                ${getSelectedPrice()?.toFixed(2)}
              </p>
            </div>

            {/* Add to Cart Button */}
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
            <h2 className="text-3xl font-black gradient-text mb-8">🔥 You Might Also Like</h2>
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
                  <p className="text-orange-400 font-black">${item.price_single?.toFixed(2)}</p>
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