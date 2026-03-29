// src/pages/AdminLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AdminLogin = () => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // login بالـ auth الواحد
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);

      // جيب بياناته من Firestore
      const userDoc = await getDoc(doc(db, "admins", userCred.user.uid));

      if (!userDoc.exists()) {
        setError("مش مصرح لك بالدخول");
        await auth.signOut();
        setLoading(false);
        return;
      }

      const data = userDoc.data();
      const { role, branchId } = data;

      // خزن في localStorage
      localStorage.setItem("role", role);
      localStorage.setItem("branchId", branchId || "");

      // وجّهه على حسب الـ role
      if (role === "owner") {
        navigate("/owner");
      } else if (role === "admin" && branchId) {
        navigate(`/admin/dashboard/${branchId}`);
      } else {
        setError("بيانات الحساب ناقصة، كلم الأدمن");
        await auth.signOut();
      }

    } catch (err) {
      setError("الإيميل أو الباسورد غلط");
    } finally {
      setLoading(false);
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
          <p className="text-gray-400 mt-2">santafi Dashboard</p>
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
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl disabled:opacity-60"
          >
            {loading ? "جاري الدخول..." : "Login →"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;