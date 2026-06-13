import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebase";

const CLOUDINARY_CLOUD = "dkgiwnpfi";
const CLOUDINARY_PRESET = "santafi_products";

const OffersTab = ({ branchId }) => {
  const branchOffersRef = useMemo(() => collection(db, branchId, "offers", "data"), [branchId]);
  const globalOffersRef = useMemo(() => collection(db, "offers"), []);
  const branchOfferItemsRef = useMemo(() => collection(db, branchId, "offerItems", "data"), [branchId]);
  const globalOfferItemsRef = useMemo(() => collection(db, "offerItems"), []);
  const branchOffersPageConfigRef = useMemo(() => doc(db, branchId, "offersPageConfig", "data", "main"), [branchId]);
  const globalOffersPageConfigRef = useMemo(() => doc(db, "configs", "offersPage"), []);

  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [itemImageUploading, setItemImageUploading] = useState(false);
  const [branchOffers, setBranchOffers] = useState([]);
  const [globalOffers, setGlobalOffers] = useState([]);
  const [branchItems, setBranchItems] = useState([]);
  const [globalItems, setGlobalItems] = useState([]);
  const [error, setError] = useState("");
  const [offersPageEnabled, setOffersPageEnabled] = useState(false);
  const [offersPageScope, setOffersPageScope] = useState("branch"); // branch | global

  const [scope, setScope] = useState("branch"); // branch | global
  const [form, setForm] = useState({
    title: "",
    message: "",
    image: "",
    originalPrice: "",
    offerPrice: "",
    startsAt: "",
    endsAt: "",
    isActive: true,
  });

  const [itemScope, setItemScope] = useState("branch"); // branch | global
  const [itemForm, setItemForm] = useState({
    title: "",
    description: "",
    image: "",
    originalPrice: "",
    offerPrice: "",
    startsAt: "",
    endsAt: "",
    isActive: true,
  });

  const loadOffers = async () => {
    if (
      branchOffers.length > 0 ||
      globalOffers.length > 0 ||
      branchItems.length > 0 ||
      globalItems.length > 0
    )
      return;
    setLoading(true);
    setError("");
    try {
      const [bSnap, gSnap, bItemsSnap, gItemsSnap, bCfgSnap, gCfgSnap] = await Promise.all([
        getDocs(branchOffersRef),
        getDocs(globalOffersRef),
        getDocs(branchOfferItemsRef),
        getDocs(globalOfferItemsRef),
        getDoc(branchOffersPageConfigRef),
        getDoc(globalOffersPageConfigRef),
      ]);
      setBranchOffers(bSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setGlobalOffers(gSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setBranchItems(bItemsSnap.docs.map((d) => ({ id: d.id, ...d.data(), scope: "branch" })));
      setGlobalItems(gItemsSnap.docs.map((d) => ({ id: d.id, ...d.data(), scope: "global" })));
      const enabled =
        typeof (bCfgSnap.exists() ? bCfgSnap.data()?.enabled : undefined) === "boolean"
          ? bCfgSnap.data().enabled
          : (gCfgSnap.exists() ? !!gCfgSnap.data()?.enabled : false);
      setOffersPageEnabled(enabled);
    } catch (e) {
      setError("صلاحيات غير كافية. غالبًا قواعد Firestore مش متعملها Deploy على السيرفر.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", CLOUDINARY_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (json?.secure_url) {
        setForm((p) => ({ ...p, image: json.secure_url }));
      } else {
        alert("فشل رفع الصورة");
      }
    } catch {
      alert("فشل رفع الصورة");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return alert("اكتب عنوان العرض");
    const payload = {
      title: form.title.trim(),
      message: form.message.trim(),
      image: form.image || "",
      originalPrice: Number(form.originalPrice) || 0,
      offerPrice: Number(form.offerPrice) || 0,
      scope,
      branchId: scope === "branch" ? branchId : null,
      startsAt: form.startsAt ? new Date(form.startsAt) : null,
      endsAt: form.endsAt ? new Date(form.endsAt) : null,
      isActive: form.isActive !== false,
      updatedAt: serverTimestamp(),
    };

    setLoading(true);
    try {
      const ref = await addDoc(scope === "branch" ? branchOffersRef : globalOffersRef, payload);
      const next = { id: ref.id, ...payload };
      if (scope === "branch") setBranchOffers((p) => [next, ...p]);
      else setGlobalOffers((p) => [next, ...p]);
      setForm({ title: "", message: "", image: "", originalPrice: "", offerPrice: "", startsAt: "", endsAt: "", isActive: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOffersPageConfig = async () => {
    setLoading(true);
    try {
      const updates = { enabled: offersPageEnabled, updatedAt: serverTimestamp() };
      if (offersPageScope === "global") {
        await setDoc(globalOffersPageConfigRef, updates, { merge: true });
      } else {
        await setDoc(branchOffersPageConfigRef, updates, { merge: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleItemImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setItemImageUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", CLOUDINARY_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (json?.secure_url) {
        setItemForm((p) => ({ ...p, image: json.secure_url }));
      } else {
        alert("فشل رفع الصورة");
      }
    } catch {
      alert("فشل رفع الصورة");
    } finally {
      setItemImageUploading(false);
    }
  };

  const handleSaveItem = async () => {
    if (!itemForm.title.trim()) return alert("اكتب اسم الوجبة");
    if (!itemForm.offerPrice) return alert("اكتب سعر العرض");
    const payload = {
      title: itemForm.title.trim(),
      description: itemForm.description.trim(),
      image: itemForm.image || "",
      originalPrice: Number(itemForm.originalPrice) || 0,
      offerPrice: Number(itemForm.offerPrice) || 0,
      startsAt: itemForm.startsAt ? new Date(itemForm.startsAt) : null,
      endsAt: itemForm.endsAt ? new Date(itemForm.endsAt) : null,
      isActive: itemForm.isActive !== false,
      updatedAt: serverTimestamp(),
    };

    setLoading(true);
    try {
      const ref = await addDoc(itemScope === "branch" ? branchOfferItemsRef : globalOfferItemsRef, payload);
      const next = { id: ref.id, ...payload, scope: itemScope };
      if (itemScope === "branch") setBranchItems((p) => [next, ...p]);
      else setGlobalItems((p) => [next, ...p]);
      setItemForm({
        title: "",
        description: "",
        image: "",
        originalPrice: "",
        offerPrice: "",
        startsAt: "",
        endsAt: "",
        isActive: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm("حذف وجبة العرض؟")) return;
    setLoading(true);
    try {
      if (item.scope === "global") {
        await deleteDoc(doc(db, "offerItems", item.id));
        setGlobalItems((p) => p.filter((x) => x.id !== item.id));
      } else {
        await deleteDoc(doc(db, branchId, "offerItems", "data", item.id));
        setBranchItems((p) => p.filter((x) => x.id !== item.id));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (offer) => {
    if (!window.confirm("حذف العرض؟")) return;
    setLoading(true);
    try {
      if (offer.scope === "global") {
        await deleteDoc(doc(db, "offers", offer.id));
        setGlobalOffers((p) => p.filter((x) => x.id !== offer.id));
      } else {
        await deleteDoc(doc(db, branchId, "offers", "data", offer.id));
        setBranchOffers((p) => p.filter((x) => x.id !== offer.id));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (offer) => {
    setLoading(true);
    try {
      const nextActive = offer.isActive === false ? true : false;
      const updates = { isActive: nextActive, updatedAt: serverTimestamp() };
      if (offer.scope === "global") {
        await setDoc(doc(db, "offers", offer.id), updates, { merge: true });
        setGlobalOffers((p) => p.map((x) => (x.id === offer.id ? { ...x, ...updates } : x)));
      } else {
        await setDoc(doc(db, branchId, "offers", "data", offer.id), updates, { merge: true });
        setBranchOffers((p) => p.map((x) => (x.id === offer.id ? { ...x, ...updates } : x)));
      }
    } finally {
      setLoading(false);
    }
  };

  const OfferCard = ({ offer }) => (
    <div className="glass p-5 rounded-2xl border border-orange-500/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white font-black truncate">{offer.title}</p>
          {offer.message && <p className="text-gray-400 text-sm mt-1">{offer.message}</p>}
          {Number(offer.offerPrice || 0) > 0 && (
            <p className="text-gray-500 text-xs mt-2">
              {Number(offer.originalPrice || 0) > 0 && (
                <span className="line-through mr-2">{Number(offer.originalPrice).toFixed(0)}ج</span>
              )}
              <span className="text-orange-400 font-black">{Number(offer.offerPrice).toFixed(0)}ج</span>
              <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full border border-green-500/30 text-green-400 bg-green-500/10">
                قابل للشراء
              </span>
            </p>
          )}
          {offer.image && offer.image.startsWith("http") && (
            <img
              src={offer.image}
              alt={offer.title}
              className="mt-3 w-full max-w-xs h-28 object-cover rounded-xl border border-orange-500/20"
            />
          )}
          <p className="text-gray-500 text-xs mt-2">
            {offer.startsAt ? `من ${new Date(offer.startsAt?.toDate?.() || offer.startsAt).toLocaleString("ar-EG")}` : "من الآن"}
            {offer.endsAt ? ` — حتى ${new Date(offer.endsAt?.toDate?.() || offer.endsAt).toLocaleString("ar-EG")}` : ""}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            النطاق: {offer.scope === "global" ? "عام" : "فرع"} {offer.scope === "branch" ? `(${branchId})` : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => handleToggle(offer)}
            className={`px-3 py-2 text-xs font-bold border rounded-lg ${
              offer.isActive === false
                ? "border-green-500/40 text-green-400"
                : "border-yellow-500/40 text-yellow-400"
            }`}
            disabled={loading}
          >
            {offer.isActive === false ? "تفعيل" : "تعطيل"}
          </button>
          <button
            onClick={() => handleDelete(offer)}
            className="px-3 py-2 text-xs font-bold border border-red-500/40 text-red-400 rounded-lg"
            disabled={loading}
          >
            حذف
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8" onMouseEnter={loadOffers}>
      {error && (
        <div className="glass p-5 rounded-2xl border border-red-500/30 bg-red-500/5">
          <p className="text-red-400 font-bold">{error}</p>
          <p className="text-gray-400 text-sm mt-2">
            شغّل: <span className="text-gray-200 font-mono">firebase deploy --only firestore:rules</span>
          </p>
        </div>
      )}
      <div className="glass p-8 rounded-2xl border border-orange-500/20">
        <h2 className="text-2xl font-bold gradient-text mb-6">⏱️ العروض بالجدولة</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
          >
            <option value="branch">عرض للفرع</option>
            <option value="global">عرض عام</option>
          </select>
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="عنوان العرض"
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white md:col-span-2"
          />
          <input
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
            placeholder="رسالة (اختياري)"
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white md:col-span-3"
          />
          <input
            type="number"
            value={form.originalPrice}
            onChange={(e) => setForm((p) => ({ ...p, originalPrice: e.target.value }))}
            placeholder="السعر الأصلي (اختياري لو للبيع)"
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
          />
          <input
            type="number"
            value={form.offerPrice}
            onChange={(e) => setForm((p) => ({ ...p, offerPrice: e.target.value }))}
            placeholder="سعر العرض (لو للبيع)"
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
          />
          <div className="md:col-span-3">
            <label className="text-xs text-gray-400 block mb-1">صورة العرض (اختياري)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-gray-300 text-sm"
              disabled={imageUploading}
            />
            {imageUploading && <p className="text-orange-400 text-sm mt-2">جاري رفع الصورة...</p>}
            {form.image && (
              <img
                src={form.image}
                alt="offer"
                className="mt-3 w-full max-w-sm h-32 object-cover rounded-xl border border-orange-500/20"
              />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">بداية العرض</label>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
              className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">نهاية العرض</label>
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm((p) => ({ ...p, endsAt: e.target.value }))}
              className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
            />
          </div>
          <div className="flex items-center gap-2 mt-6 md:mt-0">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              className="w-4 h-4 accent-orange-500"
            />
            <span className="text-gray-300 font-semibold">مفعل</span>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          onClick={handleSave}
          className="mt-6 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-bold text-white disabled:opacity-50"
        >
          حفظ العرض
        </motion.button>
      </div>

      <div className="glass p-8 rounded-2xl border border-orange-500/20">
        <h2 className="text-2xl font-bold gradient-text mb-6">🧭 صفحة العروض (Client)</h2>
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={offersPageScope}
            onChange={(e) => setOffersPageScope(e.target.value)}
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
          >
            <option value="branch">إعداد للفرع</option>
            <option value="global">إعداد عام</option>
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={offersPageEnabled}
              onChange={(e) => setOffersPageEnabled(e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            <span className="text-gray-300 font-semibold">إظهار تبويب/صفحة العروض</span>
          </label>
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            onClick={handleSaveOffersPageConfig}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-bold text-white disabled:opacity-50"
          >
            حفظ الإعداد
          </motion.button>
        </div>
      </div>

      <div className="glass p-8 rounded-2xl border border-orange-500/20">
        <h2 className="text-2xl font-bold gradient-text mb-6">🍔 وجبات العروض</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={itemScope}
            onChange={(e) => setItemScope(e.target.value)}
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
          >
            <option value="branch">وجبة للفرع</option>
            <option value="global">وجبة عامة</option>
          </select>
          <input
            value={itemForm.title}
            onChange={(e) => setItemForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="اسم الوجبة"
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white md:col-span-3"
          />
          <input
            value={itemForm.description}
            onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="وصف (اختياري)"
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white md:col-span-4"
          />
          <div className="md:col-span-4">
            <label className="text-xs text-gray-400 block mb-1">صورة الوجبة</label>
            <input type="file" accept="image/*" onChange={handleItemImageUpload} className="text-gray-300 text-sm" disabled={itemImageUploading} />
            {itemImageUploading && <p className="text-orange-400 text-sm mt-2">جاري رفع الصورة...</p>}
            {itemForm.image && <img src={itemForm.image} alt="item" className="mt-3 w-full max-w-sm h-32 object-cover rounded-xl border border-orange-500/20" />}
          </div>
          <input
            type="number"
            value={itemForm.originalPrice}
            onChange={(e) => setItemForm((p) => ({ ...p, originalPrice: e.target.value }))}
            placeholder="السعر الأصلي (اختياري)"
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
          />
          <input
            type="number"
            value={itemForm.offerPrice}
            onChange={(e) => setItemForm((p) => ({ ...p, offerPrice: e.target.value }))}
            placeholder="سعر العرض"
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">بداية (اختياري)</label>
            <input
              type="datetime-local"
              value={itemForm.startsAt}
              onChange={(e) => setItemForm((p) => ({ ...p, startsAt: e.target.value }))}
              className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">نهاية (اختياري)</label>
            <input
              type="datetime-local"
              value={itemForm.endsAt}
              onChange={(e) => setItemForm((p) => ({ ...p, endsAt: e.target.value }))}
              className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
            />
          </div>
          <label className="flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              checked={itemForm.isActive}
              onChange={(e) => setItemForm((p) => ({ ...p, isActive: e.target.checked }))}
              className="w-4 h-4 accent-orange-500"
            />
            <span className="text-gray-300 font-semibold">مفعل</span>
          </label>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          onClick={handleSaveItem}
          className="mt-6 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-bold text-white disabled:opacity-50"
        >
          حفظ الوجبة
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <p className="text-gray-300 font-bold">وجبات الفرع</p>
          {branchItems.length === 0 ? (
            <p className="text-gray-500">لا توجد وجبات عروض</p>
          ) : (
            branchItems.map((it) => (
              <div key={it.id} className="glass p-5 rounded-2xl border border-orange-500/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-black truncate">{it.title}</p>
                    {it.description && <p className="text-gray-400 text-sm mt-1">{it.description}</p>}
                    {it.image?.startsWith("http") && (
                      <img src={it.image} alt={it.title} className="mt-3 w-full max-w-xs h-28 object-cover rounded-xl border border-orange-500/20" />
                    )}
                    <p className="text-gray-500 text-xs mt-2">
                      {Number(it.originalPrice || 0) > 0 && (
                        <span className="line-through mr-2">{Number(it.originalPrice).toFixed(0)}ج</span>
                      )}
                      <span className="text-orange-400 font-black">{Number(it.offerPrice || 0).toFixed(0)}ج</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(it)}
                    className="px-3 py-2 text-xs font-bold border border-red-500/40 text-red-400 rounded-lg"
                    disabled={loading}
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="space-y-3">
          <p className="text-gray-300 font-bold">وجبات عامة</p>
          {globalItems.length === 0 ? (
            <p className="text-gray-500">لا توجد وجبات عروض</p>
          ) : (
            globalItems.map((it) => (
              <div key={it.id} className="glass p-5 rounded-2xl border border-orange-500/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-black truncate">{it.title}</p>
                    {it.description && <p className="text-gray-400 text-sm mt-1">{it.description}</p>}
                    {it.image?.startsWith("http") && (
                      <img src={it.image} alt={it.title} className="mt-3 w-full max-w-xs h-28 object-cover rounded-xl border border-orange-500/20" />
                    )}
                    <p className="text-gray-500 text-xs mt-2">
                      {Number(it.originalPrice || 0) > 0 && (
                        <span className="line-through mr-2">{Number(it.originalPrice).toFixed(0)}ج</span>
                      )}
                      <span className="text-orange-400 font-black">{Number(it.offerPrice || 0).toFixed(0)}ج</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(it)}
                    className="px-3 py-2 text-xs font-bold border border-red-500/40 text-red-400 rounded-lg"
                    disabled={loading}
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <p className="text-gray-300 font-bold">عروض الفرع</p>
          {branchOffers.length === 0 ? (
            <p className="text-gray-500">لا توجد عروض</p>
          ) : (
            branchOffers.map((o) => <OfferCard key={o.id} offer={{ ...o, scope: "branch" }} />)
          )}
        </div>
        <div className="space-y-3">
          <p className="text-gray-300 font-bold">عروض عامة</p>
          {globalOffers.length === 0 ? (
            <p className="text-gray-500">لا توجد عروض</p>
          ) : (
            globalOffers.map((o) => <OfferCard key={o.id} offer={{ ...o, scope: "global" }} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default OffersTab;

