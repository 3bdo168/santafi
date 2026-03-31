// src/pages/AdminDashboard.jsx
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  updateDoc, onSnapshot, query, orderBy, writeBatch, serverTimestamp, setDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useBranch } from "../context/BranchContext";
import ProductsTab from "../components/admin/ProductsTab";
import CategoriesTab from "../components/admin/CategoriesTab";
import OrdersTab from "../components/admin/OrdersTab";
import ArchiveTab from "../components/admin/ArchiveTab";
import CouponsTab from "../components/admin/CouponsTab";
import DeliveryZonesTab from "../components/admin/DeliveryZonesTab";
import { validateProductDiscount } from "../utils/pricing";

const CLOUDINARY_CLOUD = "dkgiwnpfi";
const CLOUDINARY_PRESET = "santafe_products";
const EMOJI_LIST = ["🍔","🍗","🍟","🌮","🌯","🍕","🥗","🍣","🥩","🍖","🌶️","🧆","🥙","🍱","🧁","🍰","🥤","☕","🧃","🍜"];

const BRANCH_NAMES = {
  mansoura: "المنصورة",
  mit_ghamr: "ميت غمر",
  zagazig: "الزقازيق",
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
  const couponsRef    = useMemo(() => collection(db, branchId, "discountCoupons", "data"), [branchId]);
  const zonesRef      = useMemo(() => collection(db, branchId, "deliveryZones", "data"), [branchId]);

  const navigate = useNavigate();

  const [activeTab, setActiveTab]           = useState("products");
  const [products, setProducts]             = useState([]);
  const [orders, setOrders]                 = useState([]);
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [categories, setCategories]         = useState([]);
  const [coupons, setCoupons]               = useState([]);
  const [zones, setZones]                   = useState([]);
  const [loading, setLoading]               = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [notification, setNotification]     = useState(null);

  const prevOrdersCount = useRef(null);
  const isFirstLoad     = useRef(true);
  const confirmSensitiveAction = (actionLabel) => {
    const value = window.prompt(`تأكيد أمان: اكتب ADMIN لتنفيذ (${actionLabel})`);
    return value === "ADMIN";
  };

  const [form, setForm] = useState({
    name: "", description: "", category: "",
    price_single: "", price_double: "", price_triple: "",
    image: "", isNew: false, discountType: "none", discountValue: "", discountActive: false,
  });
  const [catForm, setCatForm]       = useState({ name: "", icon: "🍔" });
  const [catLoading, setCatLoading] = useState(false);
  const [editId, setEditId]         = useState(null);
  const [couponForm, setCouponForm] = useState({ code: "", type: "percent", value: "", minOrder: "", active: true });
  const [zoneForm, setZoneForm]     = useState({ name: "", fee: "", active: true });

  // ── Fetch Products ──
  const fetchProducts = useCallback(async () => {
    const snap = await getDocs(productsRef);
    setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, [productsRef]);

  // ── Fetch Categories ──
  const fetchCategories = useCallback(async () => {
    const snap = await getDocs(categoriesRef);
    setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, [categoriesRef]);

  const fetchCoupons = useCallback(async () => {
    const snap = await getDocs(couponsRef);
    setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, [couponsRef]);

  const fetchZones = useCallback(async () => {
    const snap = await getDocs(zonesRef);
    setZones(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, [zonesRef]);

  // ── Main useEffect ──
  useEffect(() => {
    if (!branchId) return;
    fetchProducts();
    fetchCategories();
    fetchCoupons();
    fetchZones();

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
  }, [branchId, archiveRef, fetchCategories, fetchCoupons, fetchProducts, fetchZones, ordersRef]);

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
    if (!confirmSensitiveAction("حذف كاتيجوري")) return;
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
    const discountCheck = validateProductDiscount(form.price_single, form.discountType, form.discountValue);
    if (!discountCheck.ok) return alert(discountCheck.message);
    setLoading(true);
    const data = {
      ...form,
      price_single: parseFloat(form.price_single),
      price_double: parseFloat(form.price_double) || null,
      price_triple: parseFloat(form.price_triple) || null,
      discountValue: form.discountType === "none" ? 0 : Number(form.discountValue) || 0,
    };
    try {
      if (editId) {
        await updateDoc(doc(db, branchId, "products", "data", editId), data);
        setEditId(null);
      } else {
        await addDoc(productsRef, data);
      }
      setForm({ name: "", description: "", category: "", price_single: "", price_double: "", price_triple: "", image: "", isNew: false, discountType: "none", discountValue: "", discountActive: false });
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
      discountType: product.discountType || "none",
      discountValue: product.discountValue || "",
      discountActive: product.discountActive || false,
    });
    setActiveTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هتحذف المنتج ده؟")) return;
    if (!confirmSensitiveAction("حذف منتج")) return;
    await deleteDoc(doc(db, branchId, "products", "data", id));
    fetchProducts();
  };

  const handleAddCoupon = async () => {
    if (!couponForm.code || !couponForm.value) return alert("الكود والقيمة مطلوبين");
    const payload = {
      code: couponForm.code.trim().toUpperCase(),
      type: couponForm.type,
      value: Number(couponForm.value) || 0,
      minOrder: Number(couponForm.minOrder) || 0,
      active: couponForm.active,
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, branchId, "discountCoupons", "data", payload.code), payload, { merge: true });
    setCouponForm({ code: "", type: "percent", value: "", minOrder: "", active: true });
    fetchCoupons();
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm("حذف الكوبون؟")) return;
    if (!confirmSensitiveAction("حذف كوبون")) return;
    await deleteDoc(doc(db, branchId, "discountCoupons", "data", couponId));
    fetchCoupons();
  };

  const handleAddZone = async () => {
    if (!zoneForm.name || zoneForm.fee === "") return alert("اسم المنطقة والسعر مطلوبين");
    await addDoc(zonesRef, {
      name: zoneForm.name,
      fee: Number(zoneForm.fee) || 0,
      active: zoneForm.active,
      updatedAt: serverTimestamp(),
    });
    setZoneForm({ name: "", fee: "", active: true });
    fetchZones();
  };

  const handleDeleteZone = async (zoneId) => {
    if (!window.confirm("حذف منطقة التوصيل؟")) return;
    if (!confirmSensitiveAction("حذف منطقة توصيل")) return;
    await deleteDoc(doc(db, branchId, "deliveryZones", "data", zoneId));
    fetchZones();
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
            <h1 className="text-xl font-black gradient-text">santafe Admin</h1>
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
        {["products", "categories", "coupons", "delivery", "orders", "archive"].map((tab) => (
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
            : tab === "coupons" ? "🎟️ الكوبونات"
            : tab === "delivery" ? "🚚 التوصيل"
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

        {activeTab === "products" && (
          <ProductsTab
            editId={editId}
            form={form}
            setForm={setForm}
            categories={categories}
            handleImageUpload={handleImageUpload}
            imageUploading={imageUploading}
            loading={loading}
            handleSubmit={handleSubmit}
            setEditId={setEditId}
            products={products}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />
        )}

        {activeTab === "categories" && (
          <CategoriesTab
            catForm={catForm}
            setCatForm={setCatForm}
            EMOJI_LIST={EMOJI_LIST}
            handleAddCategory={handleAddCategory}
            catLoading={catLoading}
            categories={categories}
            handleDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === "coupons" && (
          <CouponsTab
            couponForm={couponForm}
            setCouponForm={setCouponForm}
            coupons={coupons}
            onAdd={handleAddCoupon}
            onDelete={handleDeleteCoupon}
          />
        )}

        {activeTab === "delivery" && (
          <DeliveryZonesTab
            zoneForm={zoneForm}
            setZoneForm={setZoneForm}
            zones={zones}
            onAdd={handleAddZone}
            onDelete={handleDeleteZone}
          />
        )}

        {activeTab === "orders" && (
          <OrdersTab
            orders={orders}
            handleUpdateStatus={handleUpdateStatus}
            handleArchiveOrder={handleArchiveOrder}
          />
        )}

        {activeTab === "archive" && (
          <ArchiveTab
            archivedOrders={archivedOrders}
            handleArchiveStatusUpdate={handleArchiveStatusUpdate}
          />
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;