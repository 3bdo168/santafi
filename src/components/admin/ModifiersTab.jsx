import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

const CLOUDINARY_CLOUD = "dkgiwnpfi";
const CLOUDINARY_PRESET = "santafi_products";

const ModifiersTab = ({ branchId, products }) => {
  const groupsRef = useMemo(() => collection(db, "modifierGroups"), []);

  const [groups, setGroups] = useState([]);
  const [optionsByGroup, setOptionsByGroup] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [savingGroupId, setSavingGroupId] = useState("");

  const [groupForm, setGroupForm] = useState({
    title: "",
    selectionMode: "single",
    min: 0,
    max: 1,
  });

  const [optionForm, setOptionForm] = useState({
    groupId: "",
    name: "",
    priceDelta: 0,
    isActive: true,
    image: "",
  });

  const [productLink, setProductLink] = useState({
    productId: "",
    groupIds: [],
  });

  // Lazy load groups/options on demand (keeps AdminDashboard lighter)
  const loadGroups = async () => {
    if (groups.length > 0) return;
    setLoading(true);
    setError("");
    try {
      const { getDocs } = await import("firebase/firestore");
      const snap = await getDocs(groupsRef);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setGroups(data);

      // Load options per group
      const map = {};
      await Promise.all(
        data.map(async (g) => {
          const optSnap = await getDocs(collection(db, "modifierGroups", g.id, "options"));
          map[g.id] = optSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        })
      );
      setOptionsByGroup(map);
    } catch (e) {
      setError("صلاحيات غير كافية. غالبًا قواعد Firestore مش متعملها Deploy على السيرفر.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupForm.title.trim()) return alert("اكتب اسم المجموعة");
    setLoading(true);
    try {
      const payload = {
        title: groupForm.title.trim(),
        selectionMode: groupForm.selectionMode,
        min: Number(groupForm.min) || 0,
        max: Number(groupForm.max) || 1,
        updatedAt: serverTimestamp(),
      };
      const ref = await addDoc(groupsRef, payload);
      setGroups((prev) => [...prev, { id: ref.id, ...payload }]);
      setGroupForm({ title: "", selectionMode: "single", min: 0, max: 1 });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("حذف المجموعة؟")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "modifierGroups", groupId));
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      setOptionsByGroup((prev) => {
        const n = { ...prev };
        delete n[groupId];
        return n;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOptionImageUpload = async (e) => {
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
        setOptionForm((p) => ({ ...p, image: json.secure_url }));
      } else {
        alert("فشل رفع الصورة");
      }
    } catch {
      alert("فشل رفع الصورة");
    } finally {
      setImageUploading(false);
    }
  };

  const handleAddOption = async () => {
    if (!optionForm.groupId) return alert("اختار مجموعة");
    if (!optionForm.name.trim()) return alert("اكتب اسم الخيار");
    setLoading(true);
    try {
      const payload = {
        name: optionForm.name.trim(),
        priceDelta: Number(optionForm.priceDelta) || 0,
        isActive: optionForm.isActive !== false,
        image: optionForm.image || "",
        updatedAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, "modifierGroups", optionForm.groupId, "options"), payload);
      setOptionsByGroup((prev) => ({
        ...prev,
        [optionForm.groupId]: [...(prev[optionForm.groupId] || []), { id: ref.id, ...payload }],
      }));
      setOptionForm({ groupId: optionForm.groupId, name: "", priceDelta: 0, isActive: true, image: "" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOption = async (groupId, optionId) => {
    if (!window.confirm("حذف الخيار؟")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "modifierGroups", groupId, "options", optionId));
      setOptionsByGroup((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] || []).filter((o) => o.id !== optionId),
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGroupsToProduct = async () => {
    if (!productLink.productId) return alert("اختار منتج");
    setLoading(true);
    try {
      await updateDoc(doc(db, branchId, "products", "data", productLink.productId), {
        modifierGroupIds: productLink.groupIds,
        modifiersUpdatedAt: serverTimestamp(),
      });
      alert("✅ تم ربط الإضافات بالمنتج");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8" onMouseEnter={loadGroups}>
      {error && (
        <div className="glass p-5 rounded-2xl border border-red-500/30 bg-red-500/5">
          <p className="text-red-400 font-bold">{error}</p>
          <p className="text-gray-400 text-sm mt-2">
            شغّل: <span className="text-gray-200 font-mono">firebase deploy --only firestore:rules</span>
          </p>
        </div>
      )}
      <div className="glass p-8 rounded-2xl border border-orange-500/20">
        <h2 className="text-2xl font-bold gradient-text mb-6">🧩 الإضافات (صوص/Extras)</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            value={groupForm.title}
            onChange={(e) => setGroupForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="اسم المجموعة (مثال: Sauces)"
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white md:col-span-2"
          />
          <select
            value={groupForm.selectionMode}
            onChange={(e) => setGroupForm((p) => ({ ...p, selectionMode: e.target.value }))}
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
          >
            <option value="single">اختيار واحد</option>
            <option value="multi">اختيارات متعددة</option>
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              value={groupForm.min}
              onChange={(e) => setGroupForm((p) => ({ ...p, min: e.target.value }))}
              placeholder="min"
              className="w-full px-3 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
            />
            <input
              type="number"
              value={groupForm.max}
              onChange={(e) => setGroupForm((p) => ({ ...p, max: e.target.value }))}
              placeholder="max"
              className="w-full px-3 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
            />
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          onClick={handleCreateGroup}
          className="mt-5 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-bold text-white disabled:opacity-50"
        >
          إضافة مجموعة
        </motion.button>
      </div>

      <div className="glass p-8 rounded-2xl border border-orange-500/20">
        <h3 className="text-xl font-bold text-orange-400 mb-4">➕ إضافة خيار</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={optionForm.groupId}
            onChange={(e) => setOptionForm((p) => ({ ...p, groupId: e.target.value }))}
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
          >
            <option value="">اختار مجموعة</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
          <input
            value={optionForm.name}
            onChange={(e) => setOptionForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="اسم الخيار (مثال: BBQ)"
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
          />
          <input
            type="number"
            value={optionForm.priceDelta}
            onChange={(e) => setOptionForm((p) => ({ ...p, priceDelta: e.target.value }))}
            placeholder="فرق السعر (ج)"
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            onClick={handleAddOption}
            className="px-6 py-3 border border-orange-500/40 text-orange-300 rounded-xl font-bold disabled:opacity-50"
          >
            إضافة
          </motion.button>
        </div>
        <div className="mt-4">
          <label className="text-xs text-gray-400 block mb-1">صورة الخيار (اختياري)</label>
          <input type="file" accept="image/*" onChange={handleOptionImageUpload} className="text-gray-300 text-sm" disabled={imageUploading} />
          {imageUploading && <p className="text-orange-400 text-sm mt-2">جاري رفع الصورة...</p>}
          {optionForm.image && (
            <img src={optionForm.image} alt="option" className="mt-3 w-32 h-20 object-cover rounded-xl border border-orange-500/20" />
          )}
        </div>
      </div>

      <div className="glass p-8 rounded-2xl border border-orange-500/20">
        <h3 className="text-xl font-bold text-orange-400 mb-4">🔗 ربط مجموعات بمنتج</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={productLink.productId}
            onChange={(e) => setProductLink((p) => ({ ...p, productId: e.target.value }))}
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
          >
            <option value="">اختار منتج</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            multiple
            value={productLink.groupIds}
            onChange={(e) =>
              setProductLink((p) => ({
                ...p,
                groupIds: Array.from(e.target.selectedOptions).map((o) => o.value),
              }))
            }
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white md:col-span-2 min-h-[120px]"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          onClick={handleLinkGroupsToProduct}
          className="mt-5 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-bold text-white disabled:opacity-50"
        >
          حفظ الربط
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((g) => (
          <div key={g.id} className="glass p-5 rounded-2xl border border-orange-500/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-white font-black">{g.title}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {g.selectionMode} • min {Number(g.min || 0)} • max {Number(g.max || 0)}
                </p>
              </div>
              <button
                onClick={() => handleDeleteGroup(g.id)}
                className="px-3 py-2 text-sm border border-red-500/40 text-red-400 rounded-lg"
              >
                🗑️ حذف
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                value={g.selectionMode || "single"}
                onChange={(e) =>
                  setGroups((prev) =>
                    prev.map((x) =>
                      x.id === g.id ? { ...x, selectionMode: e.target.value } : x
                    )
                  )
                }
                className="px-3 py-2 bg-dark-800/50 border border-orange-500/20 rounded-lg text-white text-sm"
              >
                <option value="single">اختيار واحد</option>
                <option value="multi">متعدد</option>
              </select>
              <input
                type="number"
                value={Number(g.min || 0)}
                onChange={(e) =>
                  setGroups((prev) =>
                    prev.map((x) =>
                      x.id === g.id ? { ...x, min: Number(e.target.value) || 0 } : x
                    )
                  )
                }
                className="px-3 py-2 bg-dark-800/50 border border-orange-500/20 rounded-lg text-white text-sm"
                placeholder="min"
              />
              <input
                type="number"
                value={Number(g.max || 0)}
                onChange={(e) =>
                  setGroups((prev) =>
                    prev.map((x) =>
                      x.id === g.id ? { ...x, max: Number(e.target.value) || 0 } : x
                    )
                  )
                }
                className="px-3 py-2 bg-dark-800/50 border border-orange-500/20 rounded-lg text-white text-sm"
                placeholder="max"
              />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-gray-500 text-xs">
                لو عايز الإضافات اختيارية: خلي <span className="text-gray-200 font-mono">min = 0</span>
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                disabled={loading || savingGroupId === g.id}
                onClick={async () => {
                  setSavingGroupId(g.id);
                  try {
                    await updateDoc(doc(db, "modifierGroups", g.id), {
                      selectionMode: g.selectionMode || "single",
                      min: Number(g.min || 0),
                      max: Number(g.max || 0),
                      updatedAt: serverTimestamp(),
                    });
                  } finally {
                    setSavingGroupId("");
                  }
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold border border-orange-500/40 text-orange-300 hover:bg-orange-500/10 disabled:opacity-50"
              >
                {savingGroupId === g.id ? "⏳..." : "حفظ الإعدادات"}
              </motion.button>
            </div>

            <div className="mt-4 space-y-2">
              {(optionsByGroup[g.id] || []).length === 0 ? (
                <p className="text-gray-500 text-sm">لا يوجد خيارات</p>
              ) : (
                (optionsByGroup[g.id] || []).map((o) => (
                  <div key={o.id} className="flex items-center justify-between bg-dark-800/50 border border-orange-500/10 rounded-xl px-3 py-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        {o.image?.startsWith("http") && (
                          <img src={o.image} alt={o.name} className="w-10 h-10 rounded-lg object-cover border border-orange-500/10" />
                        )}
                        <div className="min-w-0">
                          <p className="text-gray-200 font-semibold truncate">{o.name}</p>
                          <p className="text-gray-500 text-xs">
                            +{Number(o.priceDelta || 0).toFixed(2)} ج {o.isActive === false ? "• معطل" : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteOption(g.id, o.id)}
                      className="px-3 py-2 text-xs border border-red-500/40 text-red-400 rounded-lg"
                    >
                      حذف
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModifiersTab;

