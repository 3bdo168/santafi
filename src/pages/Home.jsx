// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useClientBranch } from "../context/ClientBranchContext";
import { useLanguage } from "../context/LanguageContext";
import { containerVariants, itemVariants, floatingVariants } from "../animations/motionVariants";
import { useBranchProducts } from "../hooks/useBranchProducts";
import { db } from "../firebase";

const LOGO_URL = "https://res.cloudinary.com/dkgiwnpfi/image/upload/v1774112719/Screenshot_2026-03-21_184621-removebg-preview_zzpxcw.png";

const Home = () => {
  const navigate = useNavigate();
  const { selectedBranch } = useClientBranch();
  const { t } = useLanguage();
  const { products: branchProducts, loading } = useBranchProducts(selectedBranch?.id, {
    useFallbackBranch: true,
  });
  const [newProducts, setNewProducts] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [subscriberStatus, setSubscriberStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    setNewProducts(branchProducts.filter((p) => p.isNew).slice(0, 4));
    setLatestProducts(branchProducts.slice(-4).reverse());
  }, [branchProducts]);

  const handleSubscribe = async (event) => {
    event.preventDefault();
    const email = subscriberEmail.trim().toLowerCase();
    if (!email) return;

    setSubscriberStatus({ type: "loading", message: "جاري الاشتراك..." });
    try {
      await addDoc(collection(db, "subscribers"), {
        email,
        source: "homepage",
        createdAt: serverTimestamp(),
      });
      setSubscriberEmail("");
      setSubscriberStatus({ type: "success", message: "تم الاشتراك بنجاح، انتظر عروض سانتافى الحصرية!" });
    } catch (error) {
      console.error("Subscriber signup failed:", error);
      setSubscriberStatus({ type: "error", message: "حدث خطأ أثناء الاشتراك، حاول مرة أخرى." });
    }
  };

  return (
    <div className="min-h-screen">

      {/* ─── Hero Section ─── */}
      <motion.section
        id="hero"
        aria-label="قسم الترحيب بسانتافى"
        className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
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

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center z-10"
        >
          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <motion.img
              src={LOGO_URL}
              alt="شعار مطعم سانتافى"
              className="w-40 h-40 object-contain drop-shadow-2xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

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
              {t.hero.title}
            </motion.h1>
            <p className="text-xl md:text-2xl font-semibold" style={{ color: "#FFD700" }}>
              {t.hero.subtitle} 🔥
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-12">
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {t.hero.description}
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link to="/menu" aria-label="استعرض قائمة طعام سانتافى">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255, 215, 0, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 font-bold rounded-xl text-lg text-black"
                style={{ background: "linear-gradient(135deg, #FFD700, #f0a500)" }}
              >
                {t.hero.menuBtn} ←
              </motion.button>
            </Link>
            <Link to="/menu" aria-label="اطلب الآن من سانتافى">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(139,0,0,0.2)" }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 font-bold rounded-xl text-lg transition-all"
                style={{ border: "2px solid #8B0000", color: "#FFD700" }}
              >
                {t.hero.orderBtn} 🛒
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="flex justify-center gap-8"
          >
            {["🍔", "🍗", "🍟"].map((emoji, i) => (
              <motion.div
                key={i}
                className="text-5xl"
                aria-hidden="true"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
              >
                {emoji}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ─── Features Section ─── */}
      <motion.section
        id="why-santafe"
        aria-labelledby="features-heading"
        className="py-20 px-4 md:px-8"
        style={{ background: "linear-gradient(to bottom, #0a0a0a, #1a0505)" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <h2
            id="features-heading"
            className="text-4xl md:text-5xl font-bold text-center mb-4"
            style={{ background: "linear-gradient(135deg, #FFD700, #8B0000)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
          >
            ليه سانتافى؟
          </h2>
          <p className="text-center text-gray-400 mb-16">جودة ممتازة في كل وجبة</p>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {features.map((feature, i) => (
              <motion.article
                key={i}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="p-8 rounded-2xl text-center cursor-pointer group"
                style={{ background: "rgba(10,10,10,0.8)", border: "1px solid rgba(255,215,0,0.15)" }}
              >
                <div className="text-5xl mb-4 inline-block group-hover:scale-110 transition-transform" aria-hidden="true">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "#FFD700" }}>{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── New Arrivals ─── */}
      {!loading && newProducts.length > 0 && (
        <motion.section
          id="new-arrivals"
          aria-labelledby="new-arrivals-heading"
          className="py-20 px-4 md:px-8"
          style={{ background: "linear-gradient(to bottom, #1a0505, #0a0a0a)" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2
                  id="new-arrivals-heading"
                  className="text-4xl font-black mb-2"
                  style={{ background: "linear-gradient(135deg, #FFD700, #f0a500)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                >
                  ⭐ وصل جديد
                </h2>
                <p className="text-gray-400">أحدث الإضافات على قائمتنا</p>
              </div>
              <Link to="/menu" aria-label="استعرض كل المنتجات الجديدة">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 rounded-xl font-semibold text-sm"
                  style={{ border: "1px solid #FFD700", color: "#FFD700" }}>
                  شوف الكل ←
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

      {/* ─── Latest Additions ─── */}
      {!loading && latestProducts.length > 0 && (
        <motion.section
          id="latest"
          aria-labelledby="latest-heading"
          className="py-20 px-4 md:px-8"
          style={{ background: "linear-gradient(to bottom, #0a0a0a, #1a0505)" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2
                  id="latest-heading"
                  className="text-4xl font-black mb-2"
                  style={{ background: "linear-gradient(135deg, #8B0000, #FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                >
                  آخر الإضافات
                </h2>
                <p className="text-gray-400">أحدث ما أضفناه على القائمة</p>
              </div>
              <Link to="/menu" aria-label="استعرض كل منتجات سانتافى">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 rounded-xl font-semibold text-sm"
                  style={{ border: "1px solid #8B0000", color: "#FFD700" }}>
                  شوف الكل ←
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

      {/* ─── Stats ─── */}
      <motion.section
        id="stats"
        aria-label="إحصائيات سانتافى"
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
              <motion.div key={i} variants={itemVariants} whileHover={{ scale: 1.05 }}
                className="p-8 rounded-2xl"
                style={{ background: "rgba(139,0,0,0.1)", border: "1px solid rgba(255,215,0,0.2)" }}>
                <div className="text-4xl mb-3" aria-hidden="true">{stat.emoji}</div>
                <div className="text-4xl font-black mb-2" style={{ color: "#FFD700" }}>{stat.number}</div>
                <p className="text-gray-400 font-semibold">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── CTA ─── */}
      <motion.section
        id="order-now"
        aria-label="اطلب الآن"
        className="py-20 px-4 md:px-8"
        style={{ background: "linear-gradient(to bottom, #0a0a0a, #1a0505)" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <motion.div whileHover={{ scale: 1.02 }} className="p-12 rounded-3xl"
            style={{ background: "rgba(10,10,10,0.9)", border: "1px solid rgba(255,215,0,0.2)" }}>
            <div className="text-6xl mb-6" aria-hidden="true">🔥</div>
            <h2 className="text-3xl md:text-4xl font-black mb-4"
              style={{ background: "linear-gradient(135deg, #FFD700, #8B0000)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              جاهز تطلب؟
            </h2>
            <p className="text-gray-400 mb-8 text-lg">
              اختار أكلتك المفضلة واستناها ساخنة عند بابك
            </p>
            <Link to="/menu" aria-label="اطلب من قائمة سانتافى الآن">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255,215,0,0.4)" }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 font-black text-lg rounded-2xl text-black"
                style={{ background: "linear-gradient(135deg, #FFD700, #f0a500)" }}
              >
                اطلب دلوقتي 🛒
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        id="email-offers"
        aria-labelledby="email-offers-heading"
        className="py-16 px-4 md:px-8"
        style={{ background: "linear-gradient(to bottom, #1a0505, #0a0a0a)" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 id="email-offers-heading" className="text-3xl md:text-4xl font-black mb-4" style={{ color: "#FFD700" }}>
            اشترك في عروضنا الحصرية
          </h2>
          <form onSubmit={handleSubscribe} className="flex flex-col gap-3 sm:flex-row" dir="rtl">
            <input
              type="email"
              value={subscriberEmail}
              onChange={(event) => setSubscriberEmail(event.target.value)}
              required
              placeholder="اكتب بريدك الإلكتروني"
              className="min-h-12 flex-1 rounded-lg border border-yellow-400/30 bg-black/40 px-4 text-white outline-none transition placeholder:text-gray-500 focus:border-yellow-300"
            />
            <button
              type="submit"
              disabled={subscriberStatus.type === "loading"}
              className="min-h-12 rounded-lg bg-yellow-400 px-8 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              اشتراك
            </button>
          </form>
          {subscriberStatus.message && (
            <p
              className={`mt-4 text-sm font-bold ${subscriberStatus.type === "error" ? "text-red-300" : "text-green-300"
                }`}
            >
              {subscriberStatus.message}
            </p>
          )}
        </div>
      </motion.section>

      {/* ─── Footer with internal links ─── */}
      <footer
        id="footer"
        className="py-12 px-4 md:px-8 border-t border-white/5"
        style={{ background: "#080808" }}
        aria-label="روابط سانتافى"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h2 className="text-xl font-black mb-3" style={{ color: "#FFD700" }}>سانتافى 🔥</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                أفضل فرايد تشيكن وبرجر في المنصورة وميت غمر والزقازيق. جودة ممتازة وتوصيل سريع.
              </p>
            </div>

            {/* Navigation links */}
            <nav aria-label="روابط التنقل الرئيسية">
              <h3 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">روابط سريعة</h3>
              <ul className="space-y-2">
                <li><Link to="/home" className="text-gray-500 text-sm hover:text-yellow-400 transition-colors">🏠 الرئيسية</Link></li>
                <li><Link to="/menu" className="text-gray-500 text-sm hover:text-yellow-400 transition-colors">🍔 قائمة الطعام</Link></li>
                <li><Link to="/about" className="text-gray-500 text-sm hover:text-yellow-400 transition-colors">ℹ️ من نحن</Link></li>
                <li><Link to="/contact" className="text-gray-500 text-sm hover:text-yellow-400 transition-colors">📞 تواصل معنا</Link></li>
                <li><Link to="/privacy-policy" className="text-gray-500 text-sm hover:text-yellow-400 transition-colors">سياسة الخصوصية</Link></li>
              </ul>
            </nav>

            {/* Branches */}
            <div>
              <h3 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">فروعنا</h3>
              <ul className="space-y-2">
                <li className="text-gray-500 text-sm">📍 المنصورة</li>
                <li className="text-gray-500 text-sm">📍 ميت غمر</li>
                <li className="text-gray-500 text-sm">📍 الزقازيق</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 text-center">
            <p className="text-gray-600 text-xs">
              © {new Date().getFullYear()} سانتافى. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};

const ProductCard = ({ product, navigate }) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    whileHover={{ y: -8 }}
    viewport={{ once: true }}
    onClick={() => navigate(`/product/${product.id}`)}
    className="cursor-pointer rounded-2xl overflow-hidden group"
    style={{ background: "rgba(10,10,10,0.8)", border: "1px solid rgba(255,215,0,0.1)" }}
    aria-label={`منتج: ${product.name}`}
  >
    <div className="h-44 overflow-hidden">
      {product.image && product.image.startsWith("http") ? (
        <img
          src={product.image}
          alt={`صورة ${product.name} من سانتافى`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: "rgba(139,0,0,0.1)" }} aria-hidden="true">
          {product.image || "🍔"}
        </div>
      )}
    </div>
    <div className="p-4">
      {product.isNew && (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block"
          style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.3)" }}>
          ⭐ جديد
        </span>
      )}
      <h3 className="font-bold text-white mb-1 line-clamp-1 group-hover:text-yellow-400 transition-colors">{product.name}</h3>
      <p className="text-gray-500 text-xs mb-3 line-clamp-2">{product.description}</p>
      <p className="font-black" style={{ color: "#FFD700" }}>{product.price_single?.toFixed(2)} ج</p>
    </div>
  </motion.article>
);

const features = [
  { icon: "⚡", title: "توصيل سريع", description: "وجبتك تصلك ساخنة وطازجة في أقل من 30 دقيقة" },
  { icon: "👑", title: "جودة ممتازة", description: "بنستخدم بس أجود المكونات الطازجة لأحسن طعم" },
  { icon: "💳", title: "دفع سهل", description: "كاش أو فودافون كاش أو إنستاباي - على راحتك" },
];

const stats = [
  { emoji: "😊", number: "50K+", label: "عميل سعيد" },
  { emoji: "🍔", number: "100+", label: "صنف في القائمة" },
  { emoji: "⭐", number: "4.9", label: "متوسط التقييم" },
];

export default Home;
