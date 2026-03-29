import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useClientAuth } from "../context/ClientAuthContext";
import { CLIENT } from "../client.config";

const LOGO_URL = `https://res.cloudinary.com/${CLIENT.cloudinaryCloud}/image/upload/v1774112719/Screenshot_2026-03-21_184621-removebg-preview_zzpxcw.png`;

const Login = () => {
  const navigate = useNavigate();
  const { loginWithEmail, loginWithGoogle, registerWithEmail } = useClientAuth();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (!form.name.trim()) return setError("من فضلك ادخل اسمك");
      if (form.password !== form.confirm) return setError("الباسورد مش متطابق!");
      if (form.password.length < 6) return setError("الباسورد لازم يكون 6 حروف على الأقل");
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await loginWithEmail(form.email, form.password);
      } else {
        await registerWithEmail(form.name, form.email, form.password);
      }
      navigate("/home");
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate("/home");
    } catch (err) {
      setError("حصل مشكلة في Google Sign-In، حاول تاني");
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code) => {
    switch (code) {
      case "auth/user-not-found": return "الإيميل ده مش موجود";
      case "auth/wrong-password": return "الباسورد غلط";
      case "auth/email-already-in-use": return "الإيميل ده مسجل قبل كده";
      case "auth/invalid-email": return "الإيميل مش صحيح";
      case "auth/invalid-credential": return "الإيميل أو الباسورد غلط";
      default: return "حصل خطأ، حاول تاني";
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      {/* Background Blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <motion.div
          animate={{ y: [0, 30, 0], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-10 left-10 w-72 h-72 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #8B000055, transparent)" }}
        />
        <motion.div
          animate={{ y: [0, -30, 0], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #FFD70033, transparent)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div
          className="rounded-3xl p-8 md:p-10"
          style={{
            background: "rgba(15,15,15,0.95)",
            border: "1px solid rgba(255,215,0,0.15)",
            boxShadow: "0 0 60px rgba(139,0,0,0.2)",
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.img
              src={LOGO_URL}
              alt="santafi"
              className="w-20 h-20 object-contain mb-3 drop-shadow-2xl"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <h1
              className="text-3xl font-black"
              style={{
                background: "linear-gradient(135deg, #FFD700, #f0a500, #8B0000)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {CLIENT.name}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
             {mode === "login" ? "اهلاً بيك تاني! 👋" : `انضم لعيلة ${CLIENT.name} 🔥`}
            </p>
          </div>

          {/* Mode Toggle */}
          <div
            className="flex rounded-xl p-1 mb-8"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all duration-300"
                style={
                  mode === m
                    ? {
                        background: "linear-gradient(135deg, #FFD700, #f0a500)",
                        color: "#0a0a0a",
                      }
                    : { color: "#9ca3af" }
                }
              >
                {m === "login" ? "تسجيل دخول" : "حساب جديد"}
              </button>
            ))}
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Name - Register only */}
              {mode === "register" && (
                <div>
                  <label className="text-gray-400 text-xs font-semibold mb-1.5 block">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="اسمك إيه؟"
                    required
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,215,0,0.2)",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,215,0,0.2)")}
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="text-gray-400 text-xs font-semibold mb-1.5 block">
                  الإيميل
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,215,0,0.2)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,215,0,0.2)")}
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-gray-400 text-xs font-semibold mb-1.5 block">
                  الباسورد
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,215,0,0.2)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,215,0,0.2)")}
                />
              </div>

              {/* Confirm Password - Register only */}
              {mode === "register" && (
                <div>
                  <label className="text-gray-400 text-xs font-semibold mb-1.5 block">
                    تأكيد الباسورد
                  </label>
                  <input
                    type="password"
                    name="confirm"
                    value={form.confirm}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,215,0,0.2)",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,215,0,0.2)")}
                  />
                </div>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-center py-2.5 px-4 rounded-xl font-semibold"
                    style={{
                      background: "rgba(139,0,0,0.2)",
                      border: "1px solid rgba(139,0,0,0.4)",
                      color: "#ff6b6b",
                    }}
                  >
                    ⚠️ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(255,215,0,0.3)" }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-black text-sm text-black transition-all"
                style={{ background: "linear-gradient(135deg, #FFD700, #f0a500)" }}
              >
                {loading ? "⏳ جاري التحميل..." : mode === "login" ? "دخول 🚀" : "إنشاء حساب 🔥"}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span className="text-gray-500 text-xs font-semibold">أو</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Google Button */}
          <motion.button
            whileHover={{ scale: 1.02, borderColor: "#FFD700" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-3 transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {/* Google Icon */}
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            متابعة بـ Google
          </motion.button>

          {/* Guest Link */}
          <div className="text-center mt-6">
            <Link
              to="/home"
              className="text-gray-500 text-xs hover:text-gray-300 transition-colors underline underline-offset-2"
            >
              متابعة كـ Guest بدون حساب
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;