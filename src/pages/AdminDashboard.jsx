// src/pages/AdminDashboard.jsx
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import {
  collection, addDoc, getDocs, getDoc, deleteDoc, doc, updateDoc,
  onSnapshot, query, orderBy, writeBatch, serverTimestamp, setDoc, deleteField,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useBranch } from "../context/BranchContext";
import ProductsTab from "../components/admin/ProductsTab";
import CategoriesTab from "../components/admin/CategoriesTab";
import ImageCropperModal from "../components/admin/ImageCropperModal";
import OrdersTab from "../components/admin/OrdersTab";
import ArchiveTab from "../components/admin/ArchiveTab";
import CouponsTab from "../components/admin/CouponsTab";
import DeliveryZonesTab from "../components/admin/DeliveryZonesTab";
import RecommendationsTab from "../components/admin/RecommendationsTab";
import ModifiersTab from "../components/admin/ModifiersTab";
import OffersTab from "../components/admin/OffersTab";
import OrderPrintView from "../components/OrderPrintView";
import SpinSettingsTab from "../components/admin/SpinSettingsTab";
import { validateProductDiscount } from "../utils/pricing";

const CLOUDINARY_CLOUD = "dkgiwnpfi";
const CLOUDINARY_PRESET = "santafi_products";
const EMOJI_LIST = [
  "", "🍔","🍗","🍟","🌮","🌯","🍕","🥗","🍣","🥩","🍖",
  "🌶️","🧆","🥙","🍱","🧁","🍰","🥤","☕","🧃","🍜",
  "🥓","🌭","🥪","🥨","🥐","🥯","🥞","🧇","🧀","🍲",
  "🍛","🍚","🍙","🍘","🍢","🍡","🍧","🍨","🍦","🥧",
  "🍫","🍬","🍭","🍮","🍯","🍷","🍸","🍹","🍺","🍻",
  "🥂","🥃","🧊","🍽️","🍴","🥄","🍉","🍓","🔥","⭐",
];
const BRANCH_NAMES = { mansoura: "المنصورة", mit_ghamr: "ميت غمر", zagazig: "الزقازيق" };

const normalizeDeliveryZones = (data = {}) => {
  const rawZones = data.zones || data.data || data;
  const entries = Array.isArray(rawZones)
    ? rawZones.map((zone, index) => [zone.id || String(index), zone])
    : Object.entries(rawZones);

  return entries
    .filter(([, zone]) => zone && typeof zone === "object" && ("name" in zone || "fee" in zone))
    .map(([id, zone]) => ({ id, ...zone }));
};

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
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-dark-900 to-dark-800">
        <div className="text-orange-400 text-2xl">Loading...</div>
      </div>
    );
  if (!branchId)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-dark-900 to-dark-800">
        <div className="text-red-400 text-2xl">غير مصرح</div>
      </div>
    );
  return <DashboardContent branchId={branchId} />;
};

const DashboardContent = ({ branchId }) => {
  const ordersRef    = useMemo(() => collection(db, branchId, "orders", "data"), [branchId]);
  const productsRef  = useMemo(() => collection(db, branchId, "products", "data"), [branchId]);
  const categoriesRef= useMemo(() => collection(db, branchId, "categories", "data"), [branchId]);
  const archiveRef   = useMemo(() => collection(db, branchId, "archived_orders", "data"), [branchId]);
  const couponsRef   = useMemo(() => collection(db, branchId, "discountCoupons", "data"), [branchId]);
  const zonesDocRef  = useMemo(() => doc(db, branchId, "deliveryZones"), [branchId]);
  const recsRef      = useMemo(() => collection(db, branchId, "recommendations", "data"), [branchId]);

  const navigate = useNavigate();

  const [activeTab, setActiveTab]           = useState("products");
  const [products, setProducts]             = useState([]);
  const [orders, setOrders]                 = useState([]);
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [categories, setCategories]         = useState([]);
  const [coupons, setCoupons]               = useState([]);
  const [zones, setZones]                   = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading]               = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [notification, setNotification]     = useState(null);
  const [cropperSrc, setCropperSrc]         = useState(null);
  const [showCropper, setShowCropper]       = useState(false);
  const [printOrder, setPrintOrder]         = useState(null);

  const prevOrdersCount = useRef(null);
  const isFirstLoad     = useRef(true);

  const [sensitiveModal, setSensitiveModal] = useState({ isOpen: false, label: "", resolve: null, input: "" });

  const confirmSensitiveAction = (actionLabel) => {
    return new Promise((resolve) => {
      setSensitiveModal({ isOpen: true, label: actionLabel, resolve, input: "" });
    });
  };

  const [form, setForm] = useState({
    name: "", description: "", category: "", price_single: "", price_double: "",
    price_triple: "", image: "", isNew: false, discountType: "none", discountValue: "", discountActive: false,
  });
  const [catForm, setCatForm]   = useState({ name: "", icon: "🍔" });
  const [catLoading, setCatLoading] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: "", type: "percent", value: "", minOrder: "", active: true,
    startDate: "", endDate: "", usageLimit: "",
  });
  const [zoneForm, setZoneForm] = useState({ name: "", fee: "", active: true });

  const fetchProducts       = useCallback(async () => { try { const snap = await getDocs(productsRef);   setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch (err) { console.error("❌ fetchProducts:", err.message); } }, [productsRef]);
  const fetchCategories     = useCallback(async () => { try { const snap = await getDocs(categoriesRef); setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch (err) { console.error("❌ fetchCategories:", err.message); } }, [categoriesRef]);
  const fetchCoupons        = useCallback(async () => { try { const snap = await getDocs(couponsRef);    setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch (err) { console.error("❌ fetchCoupons:", err.message); } }, [couponsRef]);
  const fetchZones          = useCallback(async () => { try { const snap = await getDoc(zonesDocRef);    setZones(normalizeDeliveryZones(snap.exists() ? snap.data() : {})); } catch (err) { console.error("❌ fetchZones:", err.message); } }, [zonesDocRef]);
  const fetchRecommendations= useCallback(async () => { try { const snap = await getDocs(recsRef);       setRecommendations(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch (err) { console.error("❌ fetchRecommendations:", err.message); } }, [recsRef]);

  useEffect(() => {
    if (!branchId) return;
    let unsubOrders = null;
    let unsubArchive = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) { navigate("/admin"); return; }
      fetchProducts(); fetchCategories(); fetchCoupons(); fetchZones(); fetchRecommendations();
      const q = query(ordersRef, orderBy("createdAt", "desc"));
      unsubOrders = onSnapshot(q, (snap) => {
        const allOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (!isFirstLoad.current && prevOrdersCount.current !== null) {
          const newPending = allOrders.filter((o) => o.status === "pending");
          if (newPending.length > prevOrdersCount.current) {
            playNotificationSound();
            setNotification(newPending[0]);
            setTimeout(() => setNotification(null), 5000);
          }
        }
        prevOrdersCount.current = allOrders.filter((o) => o.status === "pending").length;
        isFirstLoad.current = false;
        setOrders(allOrders);
      }, (err) => console.error("❌ onSnapshot ORDERS:", err.message));
      unsubArchive = onSnapshot(archiveRef, (snap) => {
        setArchivedOrders(snap.docs.map((d) => ({ ...d.data(), docId: d.id })));
      }, (err) => console.error("❌ onSnapshot ARCHIVE:", err.message));
    });
    return () => { unsubAuth(); if (unsubOrders) unsubOrders(); if (unsubArchive) unsubArchive(); };
  }, [branchId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Product Handlers ──
  const handleAddCategory = async () => {
    if (!catForm.name) return alert("اسم الكاتيجوري مطلوب!");
    setCatLoading(true);
    try {
      await addDoc(categoriesRef, { name: catForm.name, icon: catForm.icon, slug: catForm.name.toLowerCase().replace(/\s+/g, "_") });
      setCatForm({ name: "", icon: "🍔" });
      fetchCategories();
    } finally { setCatLoading(false); }
  };
  const handleDeleteCategory = async (id) => {
    if (!window.confirm("هتحذف الكاتيجوري دي؟")) return;
    if (!(await confirmSensitiveAction("حذف كاتيجوري"))) return;
    await deleteDoc(doc(db, branchId, "categories", "data", id));
    fetchCategories();
  };
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = ""; // Reset so the same file triggers change again
    const reader = new FileReader();
    reader.onload = () => {
      setCropperSrc(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCroppedUpload = async (croppedBlob) => {
    setShowCropper(false);
    setCropperSrc(null);
    setImageUploading(true);
    const data = new FormData();
    data.append("file", croppedBlob, "cropped_product.jpg");
    data.append("upload_preset", CLOUDINARY_PRESET);
    try {
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: data });
      const json = await res.json();
      setForm((prev) => ({ ...prev, image: json.secure_url }));
    } catch { alert("فشل رفع الصورة!"); } finally { setImageUploading(false); }
  };
  const handleSubmit = async () => {
    if (!form.name || !form.price_single) return alert("الاسم والسعر مطلوبين!");
    const discountCheck = validateProductDiscount(form.price_single, form.discountType, form.discountValue);
    if (!discountCheck.ok) return alert(discountCheck.message);
    setLoading(true);
    const data = { ...form, price_single: parseFloat(form.price_single), price_double: parseFloat(form.price_double) || null, price_triple: parseFloat(form.price_triple) || null, discountValue: form.discountType === "none" ? 0 : Number(form.discountValue) || 0 };
    try {
      if (editId) { await updateDoc(doc(db, branchId, "products", "data", editId), data); setEditId(null); }
      else { await addDoc(productsRef, data); }
      setForm({ name: "", description: "", category: "", price_single: "", price_double: "", price_triple: "", image: "", isNew: false, discountType: "none", discountValue: "", discountActive: false });
      fetchProducts();
    } finally { setLoading(false); }
  };
  const handleEdit = (product) => {
    setEditId(product.id);
    setForm({ name: product.name, description: product.description || "", category: product.category || "", price_single: product.price_single || "", price_double: product.price_double || "", price_triple: product.price_triple || "", image: product.image || "", isNew: product.isNew || false, discountType: product.discountType || "none", discountValue: product.discountValue || "", discountActive: product.discountActive || false });
    setActiveTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleDelete = async (id) => {
    if (!window.confirm("هتحذف المنتج ده؟")) return;
    if (!(await confirmSensitiveAction("حذف منتج"))) return;
    await deleteDoc(doc(db, branchId, "products", "data", id));
    fetchProducts();
  };

  // ── Order Handlers ──
  const handleDeleteOrder = async (id) => {
    if (!window.confirm("هتحذف الأوردر ده نهائياً؟")) return;
    if (!(await confirmSensitiveAction("حذف أوردر"))) return;
    await deleteDoc(doc(db, branchId, "orders", "data", id));
  };

  const handleDeleteAllDone = async () => {
    const targets = orders.filter((o) =>
      o.status === "delivered" || o.status === "done" || o.status === "cancelled" || o.status === "rejected"
    );
    if (targets.length === 0) return;
    if (!window.confirm(`هتحذف ${targets.length} أوردر منتهي نهائياً؟`)) return;
    if (!(await confirmSensitiveAction("حذف كل المنتهية"))) return;
    const batch = writeBatch(db);
    targets.forEach((o) => batch.delete(doc(db, branchId, "orders", "data", o.id)));
    await batch.commit();
  };

  const handleDeleteArchivedOrder = async (docId) => {
    if (!window.confirm("هتحذف الأوردر ده من الأرشيف نهائياً؟")) return;
    if (!(await confirmSensitiveAction("حذف من الأرشيف"))) return;
    await deleteDoc(doc(db, branchId, "archived_orders", "data", docId));
  };

  const handleMoveToCompleted = async (order) => {
    if (!window.confirm("هتنقل الأوردر ده للأوردرات؟")) return;
    const batch = writeBatch(db);
    const newOrderDoc = doc(db, branchId, "orders", "data", order.docId);
    batch.set(newOrderDoc, { ...order, movedFromArchive: true, movedAt: serverTimestamp() });
    batch.delete(doc(db, branchId, "archived_orders", "data", order.docId));
    await batch.commit();
  };

  const handleAddCoupon = async () => {
    if (!couponForm.code || (couponForm.type !== "free_delivery" && !couponForm.value)) return alert("الكود والقيمة مطلوبين");
    const payload = { code: couponForm.code.trim().toUpperCase(), type: couponForm.type, value: couponForm.type === "free_delivery" ? 0 : Number(couponForm.value) || 0, minOrder: Number(couponForm.minOrder) || 0, active: couponForm.active, startDate: couponForm.startDate || null, endDate: couponForm.endDate || null, usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : null, updatedAt: serverTimestamp() };
    await setDoc(doc(db, branchId, "discountCoupons", "data", payload.code), payload, { merge: true });
    setCouponForm({ code: "", type: "percent", value: "", minOrder: "", active: true, startDate: "", endDate: "", usageLimit: "" });
    await fetchCoupons();
  };
  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm("حذف الكوبون؟")) return;
    if (!(await confirmSensitiveAction("حذف كوبون"))) return;
    await deleteDoc(doc(db, branchId, "discountCoupons", "data", couponId));
    fetchCoupons();
  };
  const handleAddZone = async () => {
    if (!zoneForm.name || zoneForm.fee === "") return alert("اسم المنطقة والسعر مطلوبين");
    const zoneId = doc(collection(db, "_ids")).id;
    await setDoc(zonesDocRef, {
      [zoneId]: {
        name: zoneForm.name,
        fee: Number(zoneForm.fee) || 0,
        active: zoneForm.active,
        updatedAt: serverTimestamp(),
      },
    }, { merge: true });
    setZoneForm({ name: "", fee: "", active: true });
    fetchZones();
  };
  const handleDeleteZone = async (zoneId) => {
    if (!window.confirm("حذف منطقة التوصيل؟")) return;
    if (!(await confirmSensitiveAction("حذف منطقة توصيل"))) return;
    await updateDoc(zonesDocRef, { [zoneId]: deleteField() });
    fetchZones();
  };
  const handleUpdateStatus = async (id, status) => {
    // حدّث في collection الفرع
    await updateDoc(doc(db, branchId, "orders", "data", id), { status });

    // حدّث في all_orders بنفس الـ ID عشان الـ Profile يشوف التغيير
    try {
      await updateDoc(doc(db, "all_orders", id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("all_orders update failed:", err.message);
    }
  };

  // ✅ الحل: بيحفظ في الأرشيف بنفس الـ ID عشان يقدر يعمل update بعدين
  const handleArchiveOrder = async (order) => {
    if (order.status === "pending_payment") {
      alert("الأوردر ده لسه في انتظار الدفع. مش هيتأرشف.");
      return;
    }
    const batch = writeBatch(db);
    batch.set(doc(db, branchId, "archived_orders", "data", order.id), {
      ...order,
      archivedAt: serverTimestamp(),
      archivedBy: "manual",
    });
    batch.delete(doc(db, branchId, "orders", "data", order.id));
    await batch.commit();
    // ملاحظة: all_orders بيفضل موجود بنفس الـ ID عشان الـ status يتحدث لو اتغير من الأرشيف
  };

  // ✅ الحل: بيحدّث في الأرشيف + all_orders
  const handleArchiveStatusUpdate = async (docId, newStatus) => {
    try {
      // حدّث في الأرشيف
      await updateDoc(doc(db, branchId, "archived_orders", "data", docId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // حدّث في all_orders بنفس الـ ID عشان الـ Profile يشوف التغيير
      await updateDoc(doc(db, "all_orders", docId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      alert("حصل خطأ: " + err.message);
    }
  };

  const handleLogout = async () => { await signOut(auth); navigate("/admin"); };

  const handlePrintOrder = (order, mode) => {
    setPrintOrder({ order, mode: mode === "thermal" ? "thermal" : "a4" });
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  };

  const pendingCount   = orders.filter((o) => o.status === "pending").length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 to-dark-800">
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -80, x: "-50%" }} animate={{ opacity: 1, y: 20, x: "-50%" }} exit={{ opacity: 0, y: -80, x: "-50%" }} className="fixed top-0 left-1/2 z-50 w-full max-w-sm">
            <div className="mx-4 bg-dark-900 border-2 border-orange-500 rounded-2xl p-5 shadow-2xl shadow-orange-500/30">
              <div className="flex items-start gap-3">
                <motion.div animate={{ rotate: [0, -15, 15, -15, 15, 0] }} transition={{ duration: 0.6, repeat: 2 }} className="text-3xl">🔔</motion.div>
                <div className="flex-1">
                  <p className="font-black text-orange-400 text-lg">أوردر جديد!</p>
                  <p className="text-white font-semibold">{notification.name}</p>
                  <p className="text-gray-400 text-sm">📞 {notification.phone}</p>
                  <p className="text-orange-400 font-bold">{notification.total?.toFixed(2)} ج</p>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setNotification(null)} className="text-gray-500 hover:text-white text-xl">✕</motion.button>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setActiveTab("orders"); setNotification(null); }} className="w-full mt-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl text-sm">عرض الأوردر →</motion.button>
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
            <h1 className="text-xl font-black gradient-text">santafe Admin</h1>
            <p className="text-xs text-gray-400">فرع {BRANCH_NAMES[branchId]}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {preparingCount > 0 && (
            <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/40 px-3 py-1.5 rounded-full cursor-pointer" onClick={() => setActiveTab("orders")}>
              <span className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-yellow-400 text-sm font-bold">{preparingCount} قيد التحضير</span>
            </div>
          )}
          {pendingCount > 0 && (
  const preparingCount = orders.filter((o) => o.status === "preparing").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 to-dark-800">
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -80, x: "-50%" }} animate={{ opacity: 1, y: 20, x: "-50%" }} exit={{ opacity: 0, y: -80, x: "-50%" }} className="fixed top-0 left-1/2 z-50 w-full max-w-sm">
            <div className="mx-4 bg-dark-900 border-2 border-orange-500 rounded-2xl p-5 shadow-2xl shadow-orange-500/30">
              <div className="flex items-start gap-3">
                <motion.div animate={{ rotate: [0, -15, 15, -15, 15, 0] }} transition={{ duration: 0.6, repeat: 2 }} className="text-3xl">🔔</motion.div>
                <div className="flex-1">
                  <p className="font-black text-orange-400 text-lg">أوردر جديد!</p>
                  <p className="text-white font-semibold">{notification.name}</p>
                  <p className="text-gray-400 text-sm">📞 {notification.phone}</p>
                  <p className="text-orange-400 font-bold">{notification.total?.toFixed(2)} ج</p>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setNotification(null)} className="text-gray-500 hover:text-white text-xl">✕</motion.button>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setActiveTab("orders"); setNotification(null); }} className="w-full mt-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl text-sm">عرض الأوردر →</motion.button>
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
            <h1 className="text-xl font-black gradient-text">santafe Admin</h1>
            <p className="text-xs text-gray-400">فرع {BRANCH_NAMES[branchId]}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {preparingCount > 0 && (
            <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/40 px-3 py-1.5 rounded-full cursor-pointer" onClick={() => setActiveTab("orders")}>
              <span className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-yellow-400 text-sm font-bold">{preparingCount} قيد التحضير</span>
            </div>
          )}
          {pendingCount > 0 && (
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 px-3 py-1.5 rounded-full cursor-pointer" onClick={() => setActiveTab("orders")}>
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-orange-400 text-sm font-bold">{pendingCount} انتظار</span>
            </motion.div>
          )}
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={async () => {
              try {
                if (!window.confirm("Seed test data (explore-test-product-123 + test order)?")) return;
                const { doc, setDoc, serverTimestamp, collection } = await import("firebase/firestore");
                
                // 1. Seed Product
                await setDoc(doc(db, branchId, "products", "data", "explore-test-product-123"), {
                  name: "explore-test-product-123",
                  price_single: 150,
                  price_double: 250,
                  price_triple: 350,
                  category: "burgers",
                  description: "Test product for E2E",
                  isActive: true
                }, { merge: true });
                
                // 2. Seed Order
                const orderId = "test-active-order-123";
                const orderData = {
                  name: "Test User",
                  phone: "01000000000",
                  total: 150,
                  subtotal: 150,
                  status: "pending",
                  branchId,
                  clientUid: auth.currentUser.uid,
                  items: [{ name: "explore-test-product-123", qty: 1, price_single: 150 }],
                  createdAt: serverTimestamp()
                };
                await setDoc(doc(db, branchId, "orders", "data", orderId), orderData, { merge: true });
                await setDoc(doc(db, "all_orders", orderId), orderData, { merge: true });
                
                alert("Test data seeded successfully!");
              } catch (e) {
                console.error(e);
                alert("Failed to seed: " + e.message);
              }
            }} 
            className="px-4 py-2 border border-blue-500/40 text-blue-400 rounded-lg hover:bg-blue-500/10 transition-all text-sm font-semibold"
          >
            Seed Data
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout} className="px-4 py-2 border border-red-500/40 text-red-400 rounded-lg hover:bg-red-500/10 transition-all text-sm font-semibold">خروج</motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 px-6 pt-6 overflow-x-auto">
        {["products","categories","modifiers","offers","recommendations","coupons","delivery","spin","orders","archive"].map((tab) => (
          <motion.button key={tab} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-xl font-bold capitalize transition-all whitespace-nowrap ${activeTab === tab ? "bg-gradient-to-r from-orange-500 to-red-500 text-white" : "glass border border-orange-500/20 text-gray-300 hover:border-orange-500/50"}`}
          >
            {tab === "products" ? "🍔 المنتجات"
              : tab === "categories" ? "🗂️ الكاتيجوريز"
              : tab === "modifiers" ? "🧩 الإضافات"
              : tab === "offers" ? "⏱️ العروض"
              : tab === "coupons" ? "🎟️ الكوبونات"
              : tab === "recommendations" ? "🌟 الترشيحات"
              : tab === "delivery" ? "🚚 التوصيل"
              : tab === "spin" ? "🎁 عجلة الحظ"
              : tab === "archive" ? (
                <span className="flex items-center gap-2">📁 الأرشيف{archivedOrders.length > 0 && <span className="bg-gray-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{archivedOrders.length}</span>}</span>
              ) : (
                <span className="flex items-center gap-2">📦 الأوردرات{pendingCount + preparingCount > 0 && <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{pendingCount + preparingCount}</span>}</span>
              )}
          </motion.button>
        ))}
      </div>

      <div className="px-6 py-8 max-w-6xl mx-auto">
        {activeTab === "products" && (
          <ProductsTab editId={editId} form={form} setForm={setForm} categories={categories} handleImageUpload={handleImageUpload} imageUploading={imageUploading} loading={loading} handleSubmit={handleSubmit} setEditId={setEditId} products={products} handleEdit={handleEdit} handleDelete={handleDelete} />
        )}
        {activeTab === "categories" && (
          <CategoriesTab catForm={catForm} setCatForm={setCatForm} EMOJI_LIST={EMOJI_LIST} handleAddCategory={handleAddCategory} catLoading={catLoading} categories={categories} handleDeleteCategory={handleDeleteCategory} />
        )}
        {activeTab === "modifiers" && (
          <ModifiersTab branchId={branchId} products={products} />
        )}
        {activeTab === "offers" && (
          <OffersTab branchId={branchId} />
        )}
        {activeTab === "coupons" && (
          <CouponsTab couponForm={couponForm} setCouponForm={setCouponForm} coupons={coupons} onAdd={handleAddCoupon} onDelete={handleDeleteCoupon} />
        )}
        {activeTab === "delivery" && (
          <DeliveryZonesTab zoneForm={zoneForm} setZoneForm={setZoneForm} zones={zones} onAdd={handleAddZone} onDelete={handleDeleteZone} />
        )}
        {activeTab === "spin" && (
          <SpinSettingsTab branchId={branchId} />
        )}
        {activeTab === "orders" && (
          <OrdersTab
            orders={orders}
            handleUpdateStatus={handleUpdateStatus}
            handleArchiveOrder={handleArchiveOrder}
            handleDeleteOrder={handleDeleteOrder}
            handleDeleteAllDone={handleDeleteAllDone}
            handlePrintOrder={handlePrintOrder}
          />
        )}
        {activeTab === "recommendations" && (
          <RecommendationsTab
            products={products} recommendations={recommendations}
            onAdd={async (product) => { try { await addDoc(recsRef, { productId: product.id, productName: product.name, image: product.image || "", originalPrice: product.price_single || 0, discountType: "none", discountValue: 0, discountActive: false, isActive: true, message: "", createdAt: serverTimestamp() }); fetchRecommendations(); } catch (err) { alert("فشل إضافة الترشيح: " + err.message); } }}
            onRemove={async (recId) => { if (!window.confirm("هتحذف الترشيح ده؟")) return; await deleteDoc(doc(db, branchId, "recommendations", "data", recId)); fetchRecommendations(); }}
            onUpdate={async (recId, updates) => { await updateDoc(doc(db, branchId, "recommendations", "data", recId), updates); fetchRecommendations(); }}
            loading={loading}
          />
        )}
        {activeTab === "archive" && (
          <ArchiveTab
            archivedOrders={archivedOrders}
            handleArchiveStatusUpdate={handleArchiveStatusUpdate}
            handleDeleteArchivedOrder={handleDeleteArchivedOrder}
            handleMoveToCompleted={handleMoveToCompleted}
          />
        )}
      </div>

      <ImageCropperModal
        isOpen={showCropper}
        src={cropperSrc}
        onCancel={() => {
          setShowCropper(false);
          setCropperSrc(null);
        }}
        onSave={handleCroppedUpload}
      />
      <OrderPrintView order={printOrder?.order} mode={printOrder?.mode} />

      <AnimatePresence>
        {sensitiveModal.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-dark-900 border border-orange-500/30 p-6 rounded-2xl w-full max-w-sm">
              <h3 className="text-xl font-bold text-red-400 mb-4">تأكيد أمان</h3>
              <p className="text-gray-300 mb-4">لتنفيذ ({sensitiveModal.label}) اكتب <strong className="text-white bg-red-500/20 px-2 py-1 rounded">ADMIN</strong> في المربع:</p>
              <input
                type="text"
                autoFocus
                value={sensitiveModal.input}
                onChange={(e) => setSensitiveModal(s => ({ ...s, input: e.target.value }))}
                className="w-full px-4 py-3 bg-dark-800 border border-orange-500/30 rounded-xl text-white mb-6"
                placeholder="ADMIN"
              />
              <div className="flex gap-3">
                <button onClick={() => { sensitiveModal.resolve(false); setSensitiveModal({ isOpen: false, label: "", resolve: null, input: "" }); }} className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600">إلغاء</button>
                <button onClick={() => { sensitiveModal.resolve(sensitiveModal.input === "ADMIN"); setSensitiveModal({ isOpen: false, label: "", resolve: null, input: "" }); }} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500">تأكيد</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
