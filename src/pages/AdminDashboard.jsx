// src/pages/AdminDashboard.jsx
import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  updateDoc, onSnapshot, query, orderBy, writeBatch, serverTimestamp
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useBranch } from "../context/BranchContext";

import { CLIENT } from "../client.config";
const CLOUDINARY_CLOUD = CLIENT.cloudinaryCloud;
const CLOUDINARY_PRESET = CLIENT.cloudinaryPreset;
const BRANCH_NAMES = Object.fro

const EMOJI_LIST = ["🍔","🍗","🍟","🌮","🌯","🍕","🥗","🍣","🥩","🍖","🌶️","🧆","🥙","🍱","🧁","🍰","🥤","☕","🧃","🍜"];

const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.15, 0.3].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.2);
    });
  } catch (e) {}
};

const AdminDashboard = () => {
  const { branchId, loading } = useBranch();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-dark-900 to-dark-800">
      <div className="text-orange-400 text-2xl">Loading...</div>
    </div>
  );

  if (!branchId) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-dark-900 to-dark-800">
      <div className="text-red-400 text-2xl">غير مصرح</div>
    </div>
  );

  return <DashboardContent branchId={branchId} />;
};

const DashboardContent = ({ branchId }) => {
  const ordersRef     = useMemo(() => collection(db, branchId, "orders", "data"), [branchId]);
  const productsRef   = useMemo(() => collection(db, branchId, "products", "data"), [branchId]);
  const categoriesRef = useMemo(() => collection(db, branchId, "categories", "data"), [branchId]);
  const archiveRef    = useMemo(() => collection(db, branchId, "archived_orders", "data"), [branchId]);

  const navigate = useNavigate();

  const [activeTab, setActiveTab]           = useState("products");
  const [products, setProducts]             = useState([]);
  const [orders, setOrders]                 = useState([]);
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [categories, setCategories]         = useState([]);
  const [loading, setLoading]               = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [notification, setNotification]     = useState(null);

  const prevOrdersCount = useRef(null);
  const isFirstLoad     = useRef(true);

  const [form, setForm] = useState({
    name: "", description: "", category: "",
    price_single: "", price_double: "", price_triple: "",
    image: "", isNew: false,
  });
  const [catForm, setCatForm]       = useState({ name: "", icon: "🍔" });
  const [catLoading, setCatLoading] = useState(false);
  const [editId, setEditId]         = useState(null);

  // ── Fetch Products ──
  const fetchProducts = async () => {
    const snap = await getDocs(productsRef);
    setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  // ── Fetch Categories ──
  const fetchCategories = async () => {
    const snap = await getDocs(categoriesRef);
    setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  // ── Main useEffect ──
  useEffect(() => {
    if (!branchId) return;
    fetchProducts();
    fetchCategories();

    const q = query(ordersRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const allOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (!isFirstLoad.current && prevOrdersCount.current !== null) {
        const newPending = allOrders.filter((o) => o.status === "pending");
        if (newPending.length > prevOrdersCount.current) {
          const latestOrder = newPending[0];
          playNotificationSound();
          setNotification(latestOrder);
          setTimeout(() => setNotification(null), 5000);
        }
      }

      prevOrdersCount.current = allOrders.filter((o) => o.status === "pending").length;
      isFirstLoad.current = false;
      setOrders(allOrders);
    });

    const unsubArchive = onSnapshot(archiveRef, (snap) => {
      setArchivedOrders(
        snap.docs.map((d) => ({ ...d.data(), docId: d.id }))
      );
    });

    return () => { unsub(); unsubArchive(); };
  }, [branchId]);

  // ── Handlers ──
  const handleAddCategory = async () => {
    if (!catForm.name) return alert("اسم الكاتيجوري مطلوب!");
    setCatLoading(true);
    try {
      await addDoc(categoriesRef, {
        name: catForm.name,
        icon: catForm.icon,
        slug: catForm.name.toLowerCase().replace(/\s+/g, "_"),
      });
      setCatForm({ name: "", icon: "🍔" });
      fetchCategories();
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("هتحذف الكاتيجوري دي؟")) return;
    await deleteDoc(doc(db, branchId, "categories", "data", id));
    fetchCategories();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", CLOUDINARY_PRESET);
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
        { method: "POST", body: data }
      );
      const json = await res.json();
      setForm((prev) => ({ ...prev, image: json.secure_url }));
    } catch {
      alert("فشل رفع الصورة!");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price_single) return alert("الاسم والسعر مطلوبين!");
    setLoading(true);
    const data = {
      ...form,
      price_single: parseFloat(form.price_single),
      price_double: parseFloat(form.price_double) || null,
      price_triple: parseFloat(form.price_triple) || null,
    };
    try {
      if (editId) {
        await updateDoc(doc(db, branchId, "products", "data", editId), data);
        setEditId(null);
      } else {
        await addDoc(productsRef, data);
      }
      setForm({ name: "", description: "", category: "", price_single: "", price_double: "", price_triple: "", image: "", isNew: false });
      fetchProducts();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditId(product.id);
    setForm({
      name: product.name,
      description: product.description || "",
      category: product.category || "",
      price_single: product.price_single || "",
      price_double: product.price_double || "",
      price_triple: product.price_triple || "",
      image: product.image || "",
      isNew: product.isNew || false,
    });
    setActiveTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هتحذف المنتج ده؟")) return;
    await deleteDoc(doc(db, branchId, "products", "data", id));
    fetchProducts();
  };

  // ✅ 3 حالات بدل 2: pending → preparing → done
  const handleUpdateStatus = async (id, status) => {
    await updateDoc(doc(db, branchId, "orders", "data", id), { status });
  };

const handleArchiveOrder = async (order) => {
  const batch = writeBatch(db);
  // ✅ استخدم نفس الـ id بدل ما تعمل واحد جديد
  const newArchiveDoc = doc(db, branchId, "archived_orders", "data", order.id);
  batch.set(newArchiveDoc, { ...order, archivedAt: serverTimestamp(), archivedBy: "manual" });
  batch.delete(doc(db, branchId, "orders", "data", order.id));
  await batch.commit();
};

  // ✅ تحديث status الأوردر في الأرشيف (delivered / rejected)
const handleArchiveStatusUpdate = async (docId, newStatus) => {
  try {
    const docRef = doc(db, branchId, "archived_orders", "data", docId);
    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    alert("حصل خطأ: " + err.message);
  }
};

const handleLogout = async () => {
  await signOut(auth);
  navigate("/admin");
};
 

  const pendingCount   = orders.filter((o) => o.status === "pending").length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;

  // ── OrderCard ──────────────────────────────────────────────
  // showActions = true        → أزرار الأوردرات العادية
  // showActions = "archive"   → أزرار تم التوصيل / تم الرفض
  // showActions = false       → بلا أزرار
  const OrderCard = ({ order, showActions = true }) => (
    
    <motion.div
      key={order.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass p-6 rounded-2xl border transition-all ${
        order.status === "delivered"  ? "border-green-500/30 opacity-80"
        : order.status === "rejected"  ? "border-red-500/30 opacity-80"
        : order.status === "done"      ? "border-green-500/30 opacity-70"
        : order.status === "cancelled" ? "border-red-500/30 opacity-70"
        : order.status === "preparing" ? "border-yellow-500/40"
        : "border-orange-500/20"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-bold text-white text-lg">{order.name}</p>
          <p className="text-gray-400 text-sm">📞 {order.phone}</p>
          <p className="text-gray-400 text-sm">📍 {order.address}</p>
          {order.notes && <p className="text-gray-500 text-xs mt-1">📝 {order.notes}</p>}
          {order.createdAt && (
            <p className="text-gray-600 text-xs mt-1">
              🕒 {order.createdAt?.toDate?.()?.toLocaleString("en-EG", {
                year: "numeric", month: "short", day: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-orange-400 font-black text-xl">{order.total?.toFixed(2)} ج</p>
          <p className="text-gray-500 text-xs mt-1">{order.paymentMethod}</p>
          {/* ✅ Badge للحالات */}
          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block font-semibold ${
            order.status === "delivered"  ? "bg-green-500/20 text-green-400"
            : order.status === "rejected"  ? "bg-red-500/20 text-red-400"
            : order.status === "done"      ? "bg-green-500/20 text-green-400"
            : order.status === "cancelled" ? "bg-red-500/20 text-red-400"
            : order.status === "preparing" ? "bg-yellow-500/20 text-yellow-400"
            : "bg-orange-500/20 text-orange-400"
          }`}>
            {order.status === "delivered"  ? "✅ تم التوصيل"
            : order.status === "rejected"  ? "❌ تم الرفض"
            : order.status === "done"       ? "✅ تم"
            : order.status === "cancelled"  ? "❌ ملغي"
            : order.status === "preparing"  ? "🔥 قيد التحضير"
            : "⏳ انتظار"}
          </span>
        </div>
      </div>

      <div className="border-t border-orange-500/10 pt-3 space-y-1 mb-4">
        {order.items?.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-gray-300">{item.name} x{item.qty}</span>
            <span className="text-orange-400">{(item.price_single * item.qty).toFixed(2)} ج</span>
          </div>
        ))}
      </div>

      {/* ✅ أزرار الأرشيف: تم التوصيل / تم الرفض */}
      {showActions === "archive" && order.status !== "delivered" && order.status !== "rejected" && (
        <div className="flex gap-2 flex-wrap">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleArchiveStatusUpdate(order.id, "delivered")}
            className="flex-1 py-2 bg-green-500/20 border border-green-500/40 text-green-400 rounded-lg hover:bg-green-500/30 transition-all text-sm font-semibold"
          >
            ✅ تم التوصيل
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleArchiveStatusUpdate(order.id, "rejected")}
            className="flex-1 py-2 bg-red-500/20 border border-red-500/40 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm font-semibold"
          >
            ❌ تم الرفض
          </motion.button>
        </div>
      )}

      {/* ✅ أزرار الأوردرات العادية */}
      {showActions === true && order.status !== "done" && order.status !== "cancelled" && (
        <div className="flex gap-2 flex-wrap">

          {order.status === "pending" && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleUpdateStatus(order.id, "preparing")}
              className="flex-1 py-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-all text-sm font-semibold"
            >
              🔥 قيد التحضير
            </motion.button>
          )}

          {order.status === "preparing" && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleUpdateStatus(order.id, "done")}
              className="flex-1 py-2 bg-green-500/20 border border-green-500/40 text-green-400 rounded-lg hover:bg-green-500/30 transition-all text-sm font-semibold"
            >
              ✅ تم التوصيل
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleUpdateStatus(order.id, "cancelled")}
            className="flex-1 py-2 bg-red-500/20 border border-red-500/40 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm font-semibold"
          >
            ❌ إلغاء
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleArchiveOrder(order)}
            className="py-2 px-3 bg-gray-500/20 border border-gray-500/40 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-all text-sm font-semibold"
            title="أرشفة يدوية"
          >
            📁
          </motion.button>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 to-dark-800">

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -80, x: "-50%" }}
            animate={{ opacity: 1, y: 20, x: "-50%" }}
            exit={{ opacity: 0, y: -80, x: "-50%" }}
            className="fixed top-0 left-1/2 z-50 w-full max-w-sm"
          >
            <div className="mx-4 bg-dark-900 border-2 border-orange-500 rounded-2xl p-5 shadow-2xl shadow-orange-500/30">
              <div className="flex items-start gap-3">
                <motion.div animate={{ rotate: [0,-15,15,-15,15,0] }} transition={{ duration: 0.6, repeat: 2 }} className="text-3xl">🔔</motion.div>
                <div className="flex-1">
                  <p className="font-black text-orange-400 text-lg">أوردر جديد!</p>
                  <p className="text-white font-semibold">{notification.name}</p>
                  <p className="text-gray-400 text-sm">📞 {notification.phone}</p>
                  <p className="text-orange-400 font-bold">{notification.total?.toFixed(2)} ج</p>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setNotification(null)} className="text-gray-500 hover:text-white text-xl">✕</motion.button>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setActiveTab("orders"); setNotification(null); }}
                className="w-full mt-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl text-sm"
              >عرض الأوردر →</motion.button>
              <motion.div initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 5, ease: "linear" }} className="h-1 bg-orange-500 rounded-full mt-3" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-orange-500/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div>
<h1 className="text-xl font-black gradient-text">{CLIENT.name} Admin</h1>
            <p className="text-xs text-gray-400">فرع {BRANCH_NAMES[branchId]}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {preparingCount > 0 && (
            <div
              className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/40 px-3 py-1.5 rounded-full cursor-pointer"
              onClick={() => setActiveTab("orders")}
            >
              <span className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-yellow-400 text-sm font-bold">{preparingCount} قيد التحضير</span>
            </div>
          )}
          {pendingCount > 0 && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 px-3 py-1.5 rounded-full cursor-pointer"
              onClick={() => setActiveTab("orders")}
            >
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-orange-400 text-sm font-bold">{pendingCount} انتظار</span>
            </motion.div>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="px-4 py-2 border border-red-500/40 text-red-400 rounded-lg hover:bg-red-500/10 transition-all text-sm font-semibold"
          >خروج</motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 px-6 pt-6 overflow-x-auto">
        {["products", "categories", "orders", "archive"].map((tab) => (
          <motion.button
            key={tab}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-xl font-bold capitalize transition-all whitespace-nowrap ${
              activeTab === tab
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                : "glass border border-orange-500/20 text-gray-300 hover:border-orange-500/50"
            }`}
          >
            {tab === "products"   ? "🍔 المنتجات"
            : tab === "categories" ? "🗂️ الكاتيجوريز"
            : tab === "archive"   ? (
              <span className="flex items-center gap-2">
                📁 الأرشيف
                {archivedOrders.length > 0 && (
                  <span className="bg-gray-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {archivedOrders.length}
                  </span>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                📦 الأوردرات
                {(pendingCount + preparingCount) > 0 && (
                  <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {pendingCount + preparingCount}
                  </span>
                )}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      <div className="px-6 py-8 max-w-6xl mx-auto">

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-8">
            <div className="glass p-8 rounded-2xl border border-orange-500/20">
              <h2 className="text-2xl font-bold gradient-text mb-6">{editId ? "✏️ تعديل منتج" : "➕ إضافة منتج"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input placeholder="اسم المنتج *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white" />
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white">
                  <option value="">اختر كاتيجوري</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.slug}>{cat.icon} {cat.name}</option>)}
                </select>
                <input placeholder="السعر المفرد *" type="number" value={form.price_single} onChange={(e) => setForm({ ...form, price_single: e.target.value })} className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white" />
                <input placeholder="السعر الدبل" type="number" value={form.price_double} onChange={(e) => setForm({ ...form, price_double: e.target.value })} className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white" />
                <input placeholder="السعر التريبل" type="number" value={form.price_triple} onChange={(e) => setForm({ ...form, price_triple: e.target.value })} className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white" />
                <textarea placeholder="الوصف" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white resize-none" rows={2} />
              </div>
              <div className="mt-5">
                <label className="block text-sm font-semibold text-gray-300 mb-2">صورة المنتج</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="text-gray-300 text-sm" />
                {imageUploading && <p className="text-orange-400 text-sm mt-2">جاري رفع الصورة...</p>}
                {form.image && <img src={form.image} alt="preview" className="mt-3 w-24 h-24 object-cover rounded-xl border border-orange-500/30" />}
              </div>
              <div className="flex items-center gap-3 mt-5">
                <input type="checkbox" id="isNew" checked={form.isNew} onChange={(e) => setForm({ ...form, isNew: e.target.checked })} className="w-4 h-4 accent-orange-500" />
                <label htmlFor="isNew" className="text-gray-300 font-semibold">تحديد كـ جديد</label>
              </div>
              <div className="flex gap-3 mt-6">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl disabled:opacity-50">
                  {loading ? "جاري الحفظ..." : editId ? "تحديث المنتج" : "إضافة منتج"}
                </motion.button>
                {editId && (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setEditId(null); setForm({ name: "", description: "", category: "", price_single: "", price_double: "", price_triple: "", image: "", isNew: false }); }}
                    className="px-8 py-3 border border-gray-500/40 text-gray-400 rounded-xl hover:border-gray-400 transition-all"
                  >إلغاء</motion.button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product) => (
                <motion.div key={product.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 rounded-2xl border border-orange-500/20">
                  {product.image && product.image.startsWith("http") ? (
                    <img src={product.image} alt={product.name} className="w-full h-40 object-cover rounded-xl mb-4" />
                  ) : (
                    <div className="w-full h-40 bg-dark-800 rounded-xl mb-4 flex items-center justify-center text-4xl">{product.image || "🍔"}</div>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-white">{product.name}</h3>
                    {product.isNew && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">جديد</span>}
                  </div>
                  <p className="text-gray-500 text-xs mb-1">{categories.find(c => c.slug === product.category)?.icon} {categories.find(c => c.slug === product.category)?.name || product.category}</p>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                  <p className="text-orange-400 font-bold mb-4">{product.price_single?.toFixed(2)} ج</p>
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleEdit(product)} className="flex-1 py-2 border border-orange-500/40 text-orange-400 rounded-lg hover:bg-orange-500/10 transition-all text-sm font-semibold">✏️ تعديل</motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleDelete(product.id)} className="flex-1 py-2 border border-red-500/40 text-red-400 rounded-lg hover:bg-red-500/10 transition-all text-sm font-semibold">🗑️ حذف</motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="space-y-8">
            <div className="glass p-8 rounded-2xl border border-orange-500/20">
              <h2 className="text-2xl font-bold gradient-text mb-6">➕ إضافة كاتيجوري</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input placeholder="اسم الكاتيجوري" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-300">اختر أيقونة:</p>
                  <div className="flex flex-wrap gap-2">
                    {EMOJI_LIST.map((emoji) => (
                      <motion.button key={emoji} whileTap={{ scale: 0.9 }} onClick={() => setCatForm({ ...catForm, icon: emoji })}
                        className={`w-10 h-10 rounded-lg text-xl transition-all ${catForm.icon === emoji ? "bg-orange-500 border-2 border-orange-300" : "bg-dark-800/50 border border-orange-500/20 hover:border-orange-500/50"}`}
                      >{emoji}</motion.button>
                    ))}
                  </div>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAddCategory} disabled={catLoading} className="mt-6 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl disabled:opacity-50">
                {catLoading ? "جاري الحفظ..." : "إضافة كاتيجوري"}
              </motion.button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.length === 0 ? (
                <div className="col-span-3 text-center text-gray-400 py-12"><div className="text-5xl mb-4">🗂️</div><p>لا يوجد كاتيجوريز</p></div>
              ) : categories.map((cat) => (
                <motion.div key={cat.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 rounded-2xl border border-orange-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{cat.icon}</span>
                    <div><p className="font-bold text-white">{cat.name}</p><p className="text-gray-500 text-xs">{cat.slug}</p></div>
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleDeleteCategory(cat.id)} className="py-2 px-3 border border-red-500/40 text-red-400 rounded-lg hover:bg-red-500/10 transition-all text-sm">🗑️</motion.button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center text-gray-400 py-20">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-xl">لا يوجد أوردرات نشطة</p>
              </div>
            ) : orders.map((order) => <OrderCard key={order.id} order={order} />)}
          </div>
        )}

        {/* Archive Tab */}
        {activeTab === "archive" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold gradient-text">📁 الأوردرات المؤرشفة</h2>
              <span className="text-gray-400 text-sm">{archivedOrders.length} أوردر</span>
            </div>
            {archivedOrders.length === 0 ? (
              <div className="text-center text-gray-400 py-20">
                <div className="text-6xl mb-4">📁</div>
                <p className="text-xl">لا يوجد أوردرات مؤرشفة</p>
              </div>
            ) : archivedOrders.map((order) => (
              <OrderCard
                key={order.docId}
                order={{ ...order, id: order.docId }}  // ✅ بنوحد الـ id مع docId
                showActions="archive"
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;