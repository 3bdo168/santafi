import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const RecommendationsTab = ({
  products,
  recommendations,
  onAdd,
  onRemove,
  onUpdate,
  loading,
}) => {
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) &&
      !recommendations.find((r) => r.productId === p.id)
  );

  return (
    <div className="space-y-8">
      {/* ── إضافة ترشيح ── */}
      <div className="glass p-8 rounded-2xl border border-orange-500/20">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🌟</span>
          <div>
            <h2 className="text-2xl font-bold gradient-text">إضافة ترشيح</h2>
            <p className="text-gray-400 text-sm">
              اختر منتج من القائمة عشان يظهر للعملاء كـ ترشيح في صفحة الدفع
            </p>
          </div>
        </div>

        <input
          placeholder="🔍 ابحث عن منتج..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-xl focus:outline-none focus:border-orange-500 text-white mb-4"
        />

        {search && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-gray-500 col-span-full text-center py-4">
                مفيش نتايج
              </p>
            ) : (
              filtered.map((product) => (
                <motion.div
                  key={product.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAdd(product)}
                  className="flex items-center gap-3 p-3 bg-dark-800/50 border border-orange-500/20 rounded-xl cursor-pointer hover:border-orange-500/50 transition-all"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-dark-700">
                    {product.image?.startsWith("http") ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full text-2xl">
                        {product.image || "🍔"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">
                      {product.name}
                    </p>
                    <p className="text-orange-400 text-xs font-semibold">
                      {product.price_single?.toFixed(2)} ج
                    </p>
                  </div>
                  <span className="text-green-400 text-xl flex-shrink-0">+</span>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── الترشيحات الحالية ── */}
      <div className="glass p-8 rounded-2xl border border-orange-500/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-orange-400">
            📋 الترشيحات الحالية ({recommendations.length})
          </h2>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl block mb-4">🌟</span>
            <p className="text-gray-500 text-lg">
              مفيش ترشيحات لسه — ابحث وأضف منتجات!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  onRemove={onRemove}
                  onUpdate={onUpdate}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

const RecommendationCard = ({ rec, onRemove, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [localDiscount, setLocalDiscount] = useState({
    discountType: rec.discountType || "none",
    discountValue: rec.discountValue || "",
    discountActive: rec.discountActive || false,
    message: rec.message || "",
  });

  const handleSave = () => {
    onUpdate(rec.id, localDiscount);
    setEditing(false);
  };

  const discountLabel =
    rec.discountActive && rec.discountType !== "none" && Number(rec.discountValue) > 0
      ? rec.discountType === "percent"
        ? `خصم ${rec.discountValue}%`
        : `خصم ${rec.discountValue} ج`
      : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="bg-dark-800/60 border border-orange-500/20 rounded-2xl p-5 hover:border-orange-500/40 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-dark-700">
          {rec.image?.startsWith("http") ? (
            <img
              src={rec.image}
              alt={rec.productName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-3xl">
              {rec.image || "🍔"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-bold truncate">{rec.productName}</h3>
            {rec.isActive !== false && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
                نشط
              </span>
            )}
            {rec.isActive === false && (
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
                معطل
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-orange-400 font-bold text-sm">
              {rec.originalPrice?.toFixed(2)} ج
            </span>
            {discountLabel && (
              <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                🏷️ {discountLabel}
              </span>
            )}
          </div>
          {rec.message && (
            <p className="text-gray-400 text-xs mt-1">💬 {rec.message}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() =>
              onUpdate(rec.id, { isActive: rec.isActive === false ? true : false })
            }
            className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
              rec.isActive !== false
                ? "border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
                : "border-green-500/40 text-green-400 hover:bg-green-500/10"
            }`}
          >
            {rec.isActive !== false ? "⏸️ تعطيل" : "▶️ تفعيل"}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setEditing(!editing)}
            className="px-3 py-2 rounded-lg text-xs font-bold border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 transition-all"
          >
            ⚙️ خصم
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onRemove(rec.id)}
            className="px-3 py-2 rounded-lg text-xs font-bold border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all"
          >
            🗑️
          </motion.button>
        </div>
      </div>

      {/* ── خيارات الخصم ── */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-orange-500/20 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  نوع الخصم
                </label>
                <select
                  value={localDiscount.discountType}
                  onChange={(e) =>
                    setLocalDiscount((p) => ({
                      ...p,
                      discountType: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-dark-900 border border-orange-500/30 rounded-lg text-white text-sm"
                >
                  <option value="none">بدون خصم</option>
                  <option value="percent">نسبة %</option>
                  <option value="fixed">مبلغ ثابت</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  قيمة الخصم
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={localDiscount.discountValue}
                  onChange={(e) =>
                    setLocalDiscount((p) => ({
                      ...p,
                      discountValue: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-dark-900 border border-orange-500/30 rounded-lg text-white text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">
                  رسالة الترشيح (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: جرب ده مع الوجبة! 🔥"
                  value={localDiscount.message}
                  onChange={(e) =>
                    setLocalDiscount((p) => ({
                      ...p,
                      message: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-dark-900 border border-orange-500/30 rounded-lg text-white text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`discount-active-${rec.id}`}
                  checked={localDiscount.discountActive}
                  onChange={(e) =>
                    setLocalDiscount((p) => ({
                      ...p,
                      discountActive: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 accent-orange-500"
                />
                <label
                  htmlFor={`discount-active-${rec.id}`}
                  className="text-gray-300 text-sm font-semibold"
                >
                  تفعيل الخصم
                </label>
              </div>
              <div className="flex justify-end">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-lg"
                >
                  💾 حفظ
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RecommendationsTab;
