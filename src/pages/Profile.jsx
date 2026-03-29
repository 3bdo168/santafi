// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useClientAuth } from "../context/ClientAuthContext";

const statusColors = {
  pending:   { bg: "rgba(255,193,7,0.15)",  border: "rgba(255,193,7,0.4)",  text: "#FFC107", label: "⏳ قيد الانتظار" },
  confirmed: { bg: "rgba(33,150,243,0.15)", border: "rgba(33,150,243,0.4)", text: "#2196F3", label: "✅ تم التأكيد" },
  delivered: { bg: "rgba(76,175,80,0.15)",  border: "rgba(76,175,80,0.4)",  text: "#4CAF50", label: "🎉 تم التوصيل" },
  cancelled: { bg: "rgba(244,67,54,0.15)",  border: "rgba(244,67,54,0.4)",  text: "#F44336", label: "❌ ملغي" },
};

const Profile = () => {
  const navigate = useNavigate();
  const { clientUser, logout } = useClientAuth();

  const [activeTab, setActiveTab] = useState("profile");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: "", phone: "", address: "",
  });

  // ✅ لو مش logged in، ودّيه للـ login
  useEffect(() => {
    if (!clientUser) navigate("/login");
  }, [clientUser, navigate]);

  // ✅ املي الـ form ببيانات العميل
  useEffect(() => {
    if (clientUser) {
      setFormData({
        name: clientUser.name || clientUser.displayName || "",
        phone: clientUser.phone || "",
        address: clientUser.address || "",
      });
    }
  }, [clientUser]);

  // ✅ جيب أوردرات العميل من all_orders
  useEffect(() => {
    if (activeTab === "orders" && clientUser) {
      fetchOrders();
    }
  }, [activeTab, clientUser]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const q = query(
        collection(db, "all_orders"),
        where("clientUid", "==", clientUser.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "clients", clientUser.uid), {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      });
      setSaved(true);
      setEditMode(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/home");
  };

  if (!clientUser) return null;

  return (
    <div className="min-h-screen py-12 px-4 md:px-8" style={{ background: "#0a0a0a" }}>

      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <motion.div
          animate={{ y: [0, 30, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #8B000044, transparent)" }}
        />
        <motion.div
          animate={{ y: [0, -30, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #FFD70022, transparent)" }}
        />
      </div>

      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-10"
        >
          {/* Avatar */}
          <div>
            {clientUser.photoURL ? (
              <img src={clientUser.photoURL} alt="avatar"
                className="w-16 h-16 rounded-2xl object-cover"
                style={{ border: "2px solid rgba(255,215,0,0.3)" }}
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-black"
                style={{ background: "linear-gradient(135deg, #FFD700, #f0a500)" }}>
                {(clientUser.name || clientUser.displayName || "U")[0].toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-black text-white">
              {clientUser.name || clientUser.displayName || "مرحباً!"}
            </h1>
            <p className="text-gray-400 text-sm">{clientUser.email}</p>
          </div>

          {/* Logout */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{ background: "rgba(139,0,0,0.2)", border: "1px solid rgba(139,0,0,0.4)", color: "#ff6b6b" }}
          >
            🚪 خروج
          </motion.button>
        </motion.div>

        {/* Tabs */}
        <div className="flex rounded-xl p-1 mb-8" style={{ background: "rgba(255,255,255,0.05)" }}>
          {[
            { id: "profile", label: "👤 بياناتي" },
            { id: "orders",  label: "📦 أوردراتي" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-3 rounded-lg font-bold text-sm transition-all duration-300"
              style={
                activeTab === tab.id
                  ? { background: "linear-gradient(135deg, #FFD700, #f0a500)", color: "#0a0a0a" }
                  : { color: "#9ca3af" }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Tab: Profile ── */}
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl p-8"
              style={{ background: "rgba(15,15,15,0.95)", border: "1px solid rgba(255,215,0,0.12)" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">بياناتي الشخصية</h2>
                {!editMode ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 rounded-xl text-sm font-bold"
                    style={{ border: "1px solid rgba(255,215,0,0.3)", color: "#FFD700", background: "rgba(255,215,0,0.07)" }}
                  >
                    ✏️ تعديل
                  </motion.button>
                ) : (
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400"
                      style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                    >إلغاء</motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl text-sm font-bold text-black"
                      style={{ background: "linear-gradient(135deg, #FFD700, #f0a500)" }}
                    >
                      {saving ? "⏳..." : "💾 حفظ"}
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Success Message */}
              <AnimatePresence>
                {saved && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold text-center"
                    style={{ background: "rgba(76,175,80,0.15)", border: "1px solid rgba(76,175,80,0.3)", color: "#4CAF50" }}
                  >
                    ✅ تم حفظ البيانات بنجاح!
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="text-gray-400 text-xs font-semibold mb-1.5 block">الاسم الكامل</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,215,0,0.3)" }}
                    />
                  ) : (
                    <p className="px-4 py-3 rounded-xl text-white text-sm"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {formData.name || <span className="text-gray-500">لم يتم الإضافة</span>}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="text-gray-400 text-xs font-semibold mb-1.5 block">رقم التليفون</label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,215,0,0.3)" }}
                    />
                  ) : (
                    <p className="px-4 py-3 rounded-xl text-white text-sm"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {formData.phone || <span className="text-gray-500">لم يتم الإضافة</span>}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="text-gray-400 text-xs font-semibold mb-1.5 block">العنوان</label>
                  {editMode ? (
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,215,0,0.3)" }}
                    />
                  ) : (
                    <p className="px-4 py-3 rounded-xl text-white text-sm"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {formData.address || <span className="text-gray-500">لم يتم الإضافة</span>}
                    </p>
                  )}
                </div>

                {/* Email - Read Only */}
                <div>
                  <label className="text-gray-400 text-xs font-semibold mb-1.5 block">الإيميل</label>
                  <p className="px-4 py-3 rounded-xl text-gray-400 text-sm"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {clientUser.email}
                    <span className="mr-2 text-xs text-gray-600">(لا يمكن التعديل)</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Tab: Orders ── */}
          {activeTab === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {ordersLoading ? (
                <div className="text-center py-20 text-gray-400 animate-pulse text-xl">
                  جاري تحميل الأوردرات...
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20 rounded-2xl"
                  style={{ background: "rgba(15,15,15,0.95)", border: "1px solid rgba(255,215,0,0.1)" }}>
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-gray-400 text-lg mb-6">مفيش أوردرات لحد دلوقتي!</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/menu")}
                    className="px-8 py-3 font-bold rounded-xl text-black"
                    style={{ background: "linear-gradient(135deg, #FFD700, #f0a500)" }}
                  >اطلب دلوقتي 🍔</motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const status = statusColors[order.status] || statusColors.pending;
                    const date = order.createdAt?.toDate?.()?.toLocaleDateString("ar-EG", {
                      day: "numeric", month: "long", year: "numeric",
                    }) || "—";

                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl p-6"
                        style={{ background: "rgba(15,15,15,0.95)", border: "1px solid rgba(255,215,0,0.1)" }}
                      >
                        {/* Order Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-white font-bold text-sm">🏪 {order.branchName}</p>
                            <p className="text-gray-500 text-xs mt-0.5">{date}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-black" style={{ color: "#FFD700" }}>
                              {order.total?.toFixed(2)} ج
                            </span>
                            <span className="text-xs font-bold px-3 py-1 rounded-full"
                              style={{ background: status.bg, border: `1px solid ${status.border}`, color: status.text }}>
                              {status.label}
                            </span>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-2">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-xs">x{item.qty}</span>
                                <span className="text-gray-300">{item.name}</span>
                              </div>
                              <span className="text-gray-400">{(item.price_single * item.qty).toFixed(2)} ج</span>
                            </div>
                          ))}
                        </div>

                        {/* Payment Method */}
                        <div className="mt-3 pt-3 flex items-center justify-between"
                          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <span className="text-gray-500 text-xs">
                            {order.paymentMethod === "cod" ? "💵 كاش عند الاستلام"
                              : order.paymentMethod === "vodafone" ? "📱 Vodafone Cash"
                              : order.paymentMethod === "instapay" ? "⚡ InstaPay"
                              : order.paymentMethod}
                          </span>
                          <span className="text-gray-500 text-xs">#{order.id.slice(-6).toUpperCase()}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default Profile;