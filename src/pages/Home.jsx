import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { containerVariants, itemVariants, floatingVariants } from "../animations/motionVariants";

const LOGO_URL = "https://res.cloudinary.com/dkgiwnpfi/image/upload/v1774112719/Screenshot_2026-03-21_184621-removebg-preview_zzpxcw.png";
const Home = () => {
  const navigate = useNavigate();
  const [newProducts, setNewProducts] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setNewProducts(all.filter((p) => p.isNew).slice(0, 4));
        setLatestProducts(all.slice(-4).reverse());
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen">

      {/* Hero Section */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background blobs */}
        <div className="absolute inset-0 -z-10">
          <motion.div
            animate={{ y: [0, 30, 0], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, #8B000066, transparent)" }}
          />
          <motion.div
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, delay: 2 }}
            className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, #FFD70044, transparent)" }}
          />
          <motion.div
            animate={{ x: [0, 20, 0], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, delay: 4 }}
            className="absolute top-1/2 left-1/2 w-80 h-80 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, #8B000033, transparent)" }}
          />
        </div>

        {/* Main Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center z-10"
        >
          {/* Logo */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center mb-8"
          >
            <motion.img
              src={LOGO_URL}
              alt="Santafi"
              className="w-40 h-40 object-contain drop-shadow-2xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Title */}
          <motion.div variants={itemVariants} className="mb-6">
            <motion.h1
              className="text-6xl md:text-8xl font-black mb-4"
              style={{
                background: "linear-gradient(135deg, #FFD700, #f0a500, #8B0000)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              SANTAFI
            </motion.h1>
            <p className="text-xl md:text-2xl font-semibold" style={{ color: "#FFD700" }}>
              Fried Chicken & Burger 🔥
            </p>
          </motion.div>

          {/* Subtitle */}
          <motion.div variants={itemVariants} className="mb-12">
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Discover the most delicious, crispy, and flavorful fast-food experience.
              Every bite is crafted with passion and precision.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link to="/menu">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255, 215, 0, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 font-bold rounded-xl text-lg text-black"
                style={{ background: "linear-gradient(135deg, #FFD700, #f0a500)" }}
              >
                View Menu →
              </motion.button>
            </Link>
            <Link to="/menu">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(139,0,0,0.2)" }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 font-bold rounded-xl text-lg transition-all"
                style={{ border: "2px solid #8B0000", color: "#FFD700" }}
              >
                Order Now 🛒
              </motion.button>
            </Link>
          </motion.div>

          {/* Floating Emojis */}
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="flex justify-center gap-8"
          >
            {["🍔", "🍗", "🍟"].map((emoji, i) => (
              <motion.div
                key={i}
                className="text-5xl"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
              >
                {emoji}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="py-20 px-4 md:px-8"
        style={{ background: "linear-gradient(to bottom, #0a0a0a, #1a0505)" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4" style={{ background: "linear-gradient(135deg, #FFD700, #8B0000)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Why Choose Santafi?
          </h2>
          <p className="text-center text-gray-400 mb-16">Premium quality, every single time</p>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="p-8 rounded-2xl text-center cursor-pointer group"
                style={{ background: "rgba(10,10,10,0.8)", border: "1px solid rgba(255,215,0,0.15)" }}
              >
                <div className="text-5xl mb-4 inline-block group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:transition-colors" style={{ color: "#FFD700" }}>{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* NEW Items Section */}
      {!loading && newProducts.length > 0 && (
        <motion.section
          className="py-20 px-4 md:px-8"
          style={{ background: "linear-gradient(to bottom, #1a0505, #0a0a0a)" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-black mb-2" style={{ background: "linear-gradient(135deg, #FFD700, #f0a500)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  ⭐ New Arrivals
                </h2>
                <p className="text-gray-400">Fresh additions to our menu</p>
              </div>
              <Link to="/menu">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 rounded-xl font-semibold text-sm"
                  style={{ border: "1px solid #FFD700", color: "#FFD700" }}
                >
                  View All →
                </motion.button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newProducts.map((product) => (
                <ProductCard key={product.id} product={product} navigate={navigate} />
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Latest Products Section */}
      {!loading && latestProducts.length > 0 && (
        <motion.section
          className="py-20 px-4 md:px-8"
          style={{ background: "linear-gradient(to bottom, #0a0a0a, #1a0505)" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-black mb-2" style={{ background: "linear-gradient(135deg, #8B0000, #FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  🔥 Latest Additions
                </h2>
                <p className="text-gray-400">The most recently added items</p>
              </div>
              <Link to="/menu">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 rounded-xl font-semibold text-sm"
                  style={{ border: "1px solid #8B0000", color: "#FFD700" }}
                >
                  View All →
                </motion.button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestProducts.map((product) => (
                <ProductCard key={product.id} product={product} navigate={navigate} />
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Stats Section */}
      <motion.section
        className="py-20 px-4 md:px-8"
        style={{ background: "linear-gradient(135deg, #1a0505, #0a0a0a, #1a0a00)" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className="p-8 rounded-2xl"
                style={{ background: "rgba(139,0,0,0.1)", border: "1px solid rgba(255,215,0,0.2)" }}
              >
                <div className="text-4xl mb-3">{stat.emoji}</div>
                <div className="text-4xl font-black mb-2" style={{ color: "#FFD700" }}>{stat.number}</div>
                <p className="text-gray-400 font-semibold">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-20 px-4 md:px-8"
        style={{ background: "linear-gradient(to bottom, #0a0a0a, #1a0505)" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-12 rounded-3xl"
            style={{ background: "rgba(10,10,10,0.9)", border: "1px solid rgba(255,215,0,0.2)" }}
          >
            <div className="text-6xl mb-6">🔥</div>
            <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ background: "linear-gradient(135deg, #FFD700, #8B0000)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Ready to Order?
            </h2>
            <p className="text-gray-400 mb-8 text-lg">
              Choose your favorites and get them delivered hot to your door
            </p>
            <Link to="/menu">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255,215,0,0.4)" }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 font-black text-lg rounded-2xl text-black"
                style={{ background: "linear-gradient(135deg, #FFD700, #f0a500)" }}
              >
                Order Now 🛒
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

const ProductCard = ({ product, navigate }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    whileHover={{ y: -8 }}
    viewport={{ once: true }}
    onClick={() => navigate(`/product/${product.id}`)}
    className="cursor-pointer rounded-2xl overflow-hidden group"
    style={{ background: "rgba(10,10,10,0.8)", border: "1px solid rgba(255,215,0,0.1)" }}
  >
    <div className="h-44 overflow-hidden">
      {product.image && product.image.startsWith("http") ? (
        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: "rgba(139,0,0,0.1)" }}>
          {product.image || "🍔"}
        </div>
      )}
    </div>
    <div className="p-4">
      {product.isNew && (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.3)" }}>
          ⭐ NEW
        </span>
      )}
      <h3 className="font-bold text-white mb-1 line-clamp-1 group-hover:text-yellow-400 transition-colors">{product.name}</h3>
      <p className="text-gray-500 text-xs mb-3 line-clamp-2">{product.description}</p>
      <p className="font-black" style={{ color: "#FFD700" }}>${product.price_single?.toFixed(2)}</p>
    </div>
  </motion.div>
);

const features = [
  { icon: "⚡", title: "Fast Delivery", description: "Get your meal delivered hot and fresh in minutes" },
  { icon: "👑", title: "Premium Quality", description: "Only the finest ingredients for the best taste" },
  { icon: "💳", title: "Easy Payment", description: "Secure and convenient payment options" },
];

const stats = [
  { emoji: "😊", number: "50K+", label: "Happy Customers" },
  { emoji: "🍔", number: "100+", label: "Menu Items" },
  { emoji: "⭐", number: "4.9", label: "Average Rating" },
];

export default Home;