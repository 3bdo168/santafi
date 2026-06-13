import { motion } from "framer-motion";

const DeliveryZonesTab = ({
  zoneForm,
  setZoneForm,
  zones,
  onAdd,
  onDelete,
  freeDeliveryThreshold,
  setFreeDeliveryThreshold,
  onSaveFreeDeliveryThreshold,
  savingFreeDeliveryThreshold,
  freeDeliveryScope,
  setFreeDeliveryScope,
}) => (
  <div className="space-y-8">
    <div className="glass p-8 rounded-2xl border border-orange-500/20">
      <h2 className="text-2xl font-bold gradient-text mb-3">🎯 التوصيل المجاني</h2>
      <p className="text-gray-400 text-sm">
        لو إجمالي سلة العميل وصل للرقم ده (جنيه)، التوصيل يبقى مجاني تلقائيًا.
      </p>
      <div className="mt-5 flex flex-col md:flex-row gap-3 items-start md:items-end">
        <div className="w-full md:w-56">
          <label className="text-xs text-gray-400 block mb-1">نطاق الإعداد</label>
          <select
            value={freeDeliveryScope}
            onChange={(e) => setFreeDeliveryScope(e.target.value)}
            className="w-full px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
          >
            <option value="branch">للـ فرع</option>
            <option value="global">عام (كل الفروع)</option>
          </select>
        </div>
        <div className="flex-1 w-full">
          <label className="text-xs text-gray-400 block mb-1">الحد الأدنى للتوصيل المجاني (ج)</label>
          <input
            type="number"
            value={freeDeliveryThreshold}
            onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
            placeholder="مثال: 300"
            className="w-full px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
          />
          <p className="text-gray-500 text-xs mt-2">اكتب 0 لإلغاء التوصيل المجاني.</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onSaveFreeDeliveryThreshold}
          disabled={savingFreeDeliveryThreshold}
          className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-bold text-white disabled:opacity-50"
        >
          {savingFreeDeliveryThreshold ? "جاري الحفظ..." : "حفظ"}
        </motion.button>
      </div>
    </div>

    <div className="glass p-8 rounded-2xl border border-orange-500/20">
      <h2 className="text-2xl font-bold gradient-text mb-6">🚚 مناطق التوصيل</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} placeholder="اسم المنطقة" className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white" />
        <input type="number" value={zoneForm.fee} onChange={(e) => setZoneForm({ ...zoneForm, fee: e.target.value })} placeholder="سعر التوصيل" className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white" />
      </div>
      <div className="flex items-center gap-3 mt-4">
        <input type="checkbox" checked={zoneForm.active} onChange={(e) => setZoneForm({ ...zoneForm, active: e.target.checked })} className="w-4 h-4 accent-orange-500" />
        <span className="text-gray-300">المنطقة مفعلة</span>
      </div>
      <motion.button whileTap={{ scale: 0.95 }} onClick={onAdd} className="mt-6 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-bold text-white">
        إضافة منطقة
      </motion.button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {zones.map((zone) => (
        <div key={zone.id} className="glass p-4 rounded-xl border border-orange-500/20">
          <p className="font-black text-white">{zone.name}</p>
          <p className="text-orange-400 text-sm mt-1">{Number(zone.fee || 0).toFixed(2)} ج</p>
          <p className={`text-xs mt-1 ${zone.active !== false ? "text-green-400" : "text-red-400"}`}>{zone.active !== false ? "Active" : "Disabled"}</p>
          <button onClick={() => onDelete(zone.id)} className="mt-3 py-2 px-3 text-sm border border-red-500/40 text-red-400 rounded-lg">حذف</button>
        </div>
      ))}
    </div>
  </div>
);

export default DeliveryZonesTab;
