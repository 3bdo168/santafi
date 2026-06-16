import { motion } from "framer-motion";

const CouponsTab = ({ couponForm, setCouponForm, coupons, onAdd, onDelete }) => {
  const now = new Date();

  const getCouponStatus = (coupon) => {
    if (!coupon.active) return { label: "معطل", color: "text-red-400" };

    // check date range
    if (coupon.startDate && new Date(coupon.startDate) > now)
      return { label: "لم يبدأ بعد", color: "text-yellow-400" };
    if (coupon.endDate && new Date(coupon.endDate) < now)
      return { label: "منتهي الصلاحية", color: "text-red-400" };

    // check usage limit
    if (coupon.usageLimit && Number(coupon.usageCount || 0) >= Number(coupon.usageLimit))
      return { label: "استُنفد", color: "text-red-400" };

    return { label: "فعال ✅", color: "text-green-400" };
  };

  return (
    <div className="space-y-8">
      <div className="glass p-8 rounded-2xl border border-orange-500/20">
        <h2 className="text-2xl font-bold gradient-text mb-6">🎟️ إدارة الكوبونات</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* الكود */}
          <input
            value={couponForm.code}
            onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
            placeholder="CODE10"
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
          />
          {/* النوع */}
          <select
            value={couponForm.type}
            onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
          >
            <option value="percent">نسبة %</option>
            <option value="fixed">مبلغ ثابت</option>
            <option value="free_delivery">توصيل مجاني</option>
          </select>
          {/* قيمة الخصم */}
          <input
            type="number"
            value={couponForm.value}
            disabled={couponForm.type === "free_delivery"}
            onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
            placeholder={couponForm.type === "free_delivery" ? "توصيل مجاني" : "قيمة الخصم"}
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white disabled:opacity-50"
          />
          {/* حد أدنى */}
          <input
            type="number"
            value={couponForm.minOrder}
            onChange={(e) => setCouponForm({ ...couponForm, minOrder: e.target.value })}
            placeholder="حد أدنى للأوردر"
            className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
          />

          {/* ✅ تاريخ البداية */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">تاريخ بداية الكوبون</label>
            <input
              type="datetime-local"
              value={couponForm.startDate || ""}
              onChange={(e) => setCouponForm({ ...couponForm, startDate: e.target.value })}
              className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
            />
          </div>

          {/* ✅ تاريخ النهاية */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">تاريخ انتهاء الكوبون</label>
            <input
              type="datetime-local"
              value={couponForm.endDate || ""}
              onChange={(e) => setCouponForm({ ...couponForm, endDate: e.target.value })}
              className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
            />
          </div>

          {/* ✅ عدد الاستخدامات */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">عدد الاستخدامات المسموح (اتركه فاضي = غير محدود)</label>
            <input
              type="number"
              value={couponForm.usageLimit || ""}
              onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
              placeholder="مثلاً: 50"
              className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <input
            type="checkbox"
            checked={couponForm.active}
            onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })}
            className="w-4 h-4 accent-orange-500"
          />
          <span className="text-gray-300">الكوبون مفعل</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onAdd}
          className="mt-6 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-bold text-white"
        >
          حفظ الكوبون
        </motion.button>
      </div>

      {/* ── قائمة الكوبونات ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => {
          const status = getCouponStatus(coupon);
          return (
            <div key={coupon.id} className="glass p-4 rounded-xl border border-orange-500/20">
              <p className="font-black text-yellow-400 text-lg">{coupon.code}</p>
              <p className="text-sm text-gray-300 mt-1">
                {coupon.type === "free_delivery"
                  ? "توصيل مجاني"
                  : coupon.type === "percent"
                    ? `خصم ${coupon.value}%`
                    : `خصم ${coupon.value} ج`}
              </p>
              {coupon.source === "spinWheel" && (
                <p className="text-xs text-yellow-400 mt-1">كوبون عجلة الحظ</p>
              )}
              <p className="text-xs text-gray-500 mt-1">حد أدنى: {Number(coupon.minOrder || 0).toFixed(2)} ج</p>

              {/* التواريخ */}
              {coupon.startDate && (
                <p className="text-xs text-gray-500 mt-1">
                  🟢 من: {new Date(coupon.startDate).toLocaleString("ar-EG")}
                </p>
              )}
              {coupon.endDate && (
                <p className="text-xs text-gray-500 mt-1">
                  🔴 لحد: {new Date(coupon.endDate).toLocaleString("ar-EG")}
                </p>
              )}

              {/* عدد الاستخدامات */}
              {coupon.usageLimit && (
                <p className="text-xs text-gray-500 mt-1">
                  🔢 {coupon.usageCount || 0} / {coupon.usageLimit} استخدام
                </p>
              )}

              <p className={`text-xs mt-2 font-semibold ${status.color}`}>{status.label}</p>

              <button
                onClick={() => onDelete(coupon.id)}
                className="mt-3 py-2 px-3 text-sm border border-red-500/40 text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
              >
                🗑️ حذف
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CouponsTab;
