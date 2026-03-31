import { motion } from "framer-motion";

const ProductsTab = ({
  editId,
  form,
  setForm,
  categories,
  handleImageUpload,
  imageUploading,
  loading,
  handleSubmit,
  setEditId,
  products,
  handleEdit,
  handleDelete,
}) => (
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
        <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white">
          <option value="none">بدون خصم</option>
          <option value="percent">خصم نسبة %</option>
          <option value="fixed">خصم ثابت</option>
        </select>
        <input placeholder="قيمة الخصم" type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white" />
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
      <div className="flex items-center gap-3 mt-3">
        <input type="checkbox" id="discountActive" checked={form.discountActive} onChange={(e) => setForm({ ...form, discountActive: e.target.checked })} className="w-4 h-4 accent-orange-500" />
        <label htmlFor="discountActive" className="text-gray-300 font-semibold">تفعيل الخصم</label>
      </div>
      <div className="flex gap-3 mt-6">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl disabled:opacity-50">
          {loading ? "جاري الحفظ..." : editId ? "تحديث المنتج" : "إضافة منتج"}
        </motion.button>
        {editId && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setEditId(null); setForm({ name: "", description: "", category: "", price_single: "", price_double: "", price_triple: "", image: "", isNew: false, discountType: "none", discountValue: "", discountActive: false }); }}
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
          <p className="text-orange-400 font-bold mb-1">{product.price_single?.toFixed(2)} ج</p>
          {product.discountActive && product.discountType !== "none" && Number(product.discountValue) > 0 && (
            <p className="text-xs text-green-400 mb-3">
              خصم: {product.discountType === "percent" ? `${product.discountValue}%` : `${product.discountValue} ج`}
            </p>
          )}
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleEdit(product)} className="flex-1 py-2 border border-orange-500/40 text-orange-400 rounded-lg hover:bg-orange-500/10 transition-all text-sm font-semibold">✏️ تعديل</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleDelete(product.id)} className="flex-1 py-2 border border-red-500/40 text-red-400 rounded-lg hover:bg-red-500/10 transition-all text-sm font-semibold">🗑️ حذف</motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default ProductsTab;
