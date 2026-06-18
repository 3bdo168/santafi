// src/pages/AdminLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, hasRealFirebaseConfig } from "../firebase";

const UID_ACCESS_MAP = {
  bTOLBRFh8qMbDieX7s3ICTS8iBQ2: { role: "admin", branchId: "mansoura" },
  fhrYP1RF1hhYdVEWbcThd7pE4Ci1: { role: "admin", branchId: "mit_ghamr" },
  xF7ZYwiFJhY3LED8PTvgEvz2Pnr1: { role: "admin", branchId: "zagazig" },
  YgIH9e2ZW9RsLdoyH6kMwm7krAB2: { role: "owner", branchId: "" },
};

const googleProvider = new GoogleAuthProvider();

const AdminLogin = () => {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  /* ── shared redirect logic ── */
  const redirectUser = async (user, setLoadingFn) => {
    const userDoc   = await getDoc(doc(db, "admins", user.uid));
    const uidAccess = UID_ACCESS_MAP[user.uid];

    if (!userDoc.exists() && !uidAccess) {
      await auth.signOut();
      setError("غير مصرح لك بالدخول");
      setLoadingFn(false);
      return;
    }

    const data = userDoc.exists() ? userDoc.data() : uidAccess;
    const { role, branchId } = data;

    localStorage.setItem("role", role);
    localStorage.setItem("branchId", branchId || "");

    if (role === "owner") {
      navigate("/owner");
    } else if (role === "admin" && branchId) {
      navigate(`/admin/dashboard/${branchId}`);
    } else {
      setError("بيانات الحساب ناقصة، كلم الأدمن");
      await auth.signOut();
      setLoadingFn(false);
    }
  };

  /* ── email / password login ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!hasRealFirebaseConfig) {
        setError("Firebase config ناقص في .env");
        return;
      }

      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await redirectUser(userCred.user, setLoading);
    } catch (err) {
      if (err?.code) {
        setError(`فشل تسجيل الدخول: ${err.code}`);
      } else {
        setError("الإيميل أو الباسورد غلط");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Google login ── */
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      if (!hasRealFirebaseConfig) {
        setError("Firebase config ناقص في .env");
        return;
      }

      const result = await signInWithPopup(auth, googleProvider);
      await redirectUser(result.user, setGoogleLoading);
    } catch (err) {
      if (err?.code === "auth/popup-closed-by-user") {
        // user cancelled — silently ignore
      } else {
        setError(`فشل تسجيل الدخول بجوجل: ${err?.code || err?.message}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-dark-900 to-dark-800">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-10 rounded-2xl border border-orange-500/20"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔥</div>
          <h1 className="text-3xl font-black gradient-text">Admin Login</h1>
          <p className="text-gray-400 mt-2">santafe Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">❌ {error}</p>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl disabled:opacity-60 transition-opacity"
          >
            {loading ? "جاري الدخول..." : "Login →"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-gray-500 text-sm">أو</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* Google Sign-In */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="w-full py-3.5 flex items-center justify-center gap-3 bg-white text-gray-800 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-60 transition-all"
        >
          {googleLoading ? (
            <span className="text-gray-600">جاري الدخول...</span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.4 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.4 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.3C9.6 35.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C41.4 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-3.9z"/>
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default AdminLogin;