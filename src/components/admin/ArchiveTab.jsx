import { motion } from "framer-motion";
import OrderCard from "./OrderCard";

const ArchiveTab = ({ archivedOrders, handleArchiveStatusUpdate, handleDeleteArchivedOrder, handleMoveToCompleted }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-2xl font-bold gradient-text">📁 الأوردرات المؤرشفة</h2>
      <span className="text-gray-400 text-sm">{archivedOrders.length} أوردر</span>
    </div>

    {archivedOrders.length === 0 ? (
      <div className="text-center text-gray-400 py-20">
        <div className="text-6xl mb-4">📁</div>
        <p className="text-xl">لا يوجد أوردرات مؤرشفة</p>
      </div>
    ) : archivedOrders.map((order) => (
      <div key={order.docId} className="space-y-2">
        <OrderCard
          order={{ ...order, id: order.docId }}
          showActions="archive"
          handleArchiveStatusUpdate={handleArchiveStatusUpdate}
        />
        {/* ✅ زراير نقل + حذف */}
        <div className="flex gap-2 px-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleMoveToCompleted(order)}
            className="flex-1 py-2 bg-blue-500/20 border border-blue-500/40 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all text-sm font-semibold"
          >
            📦 نقل للأوردرات المنجزة
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleDeleteArchivedOrder(order.docId)}
            className="py-2 px-4 bg-red-900/30 border border-red-700/50 text-red-500 rounded-lg hover:bg-red-900/50 transition-all text-sm font-semibold"
          >
            🗑️ حذف نهائي
          </motion.button>
        </div>
      </div>
    ))}
  </div>
);

export default ArchiveTab;