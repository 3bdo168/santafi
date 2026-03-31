import { motion } from "framer-motion";

const CouponsTab = ({ couponForm, setCouponForm, coupons, onAdd, onDelete }) => (
  <div className="space-y-8">
    <div className="glass p-8 rounded-2xl border border-orange-500/20">
      <h2 className="text-2xl font-bold gradient-text mb-6">🎟️ إدارة الكوبونات</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} placeholder="CODE10" className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white" />
        <select value={couponForm.type} onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })} className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white">
          <option value="percent">نسبة %</option>
          <option value="fixed">مبلغ ثابت</option>
        </select>
        <input type="number" value={couponForm.value} onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })} placeholder="قيمة الخصم" className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white" />
        <input type="number" value={couponForm.minOrder} onChange={(e) => setCouponForm({ ...couponForm, minOrder: e.target.value })} placeholder="حد أدنى للأوردر" className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white" />
      </div>
      <div className="flex items-center gap-3 mt-4">
        <input type="checkbox" checked={couponForm.active} onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })} className="w-4 h-4 accent-orange-500" />
        <span className="text-gray-300">الكوبون مفعل</span>
      </div>
      <motion.button whileTap={{ scale: 0.95 }} onClick={onAdd} className="mt-6 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-bold text-white">
        حفظ الكوبون
      </motion.button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {coupons.map((coupon) => (
        <div key={coupon.id} className="glass p-4 rounded-xl border border-orange-500/20">
          <p className="font-black text-yellow-400">{coupon.code}</p>
          <p className="text-sm text-gray-300 mt-1">{coupon.type === "percent" ? `${coupon.value}%` : `${coupon.value} ج`}</p>
          <p className="text-xs text-gray-500 mt-1">Min: {Number(coupon.minOrder || 0).toFixed(2)} ج</p>
          <p className={`text-xs mt-1 ${coupon.active ? "text-green-400" : "text-red-400"}`}>{coupon.active ? "Active" : "Disabled"}</p>
          <button onClick={() => onDelete(coupon.id)} className="mt-3 py-2 px-3 text-sm border border-red-500/40 text-red-400 rounded-lg">حذف</button>
        </div>
      ))}
    </div>
  </div>
);

export default CouponsTab;
