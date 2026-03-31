import { motion } from "framer-motion";

const CategoriesTab = ({
  catForm,
  setCatForm,
  EMOJI_LIST,
  handleAddCategory,
  catLoading,
  categories,
  handleDeleteCategory,
}) => (
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
);

export default CategoriesTab;
