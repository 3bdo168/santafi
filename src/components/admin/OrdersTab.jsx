import { motion } from "framer-motion";
import OrderCard from "./OrderCard";

const OrdersTab = ({ orders, handleUpdateStatus, handleArchiveOrder, handleDeleteOrder, handleDeleteAllDone, handlePrintOrder }) => {
  const doneCount = orders.filter((o) =>
    o.status === "delivered" || o.status === "done" || o.status === "cancelled" || o.status === "rejected"
  ).length;

  return (
    <div className="space-y-4">
      {doneCount > 0 && (
        <div className="flex justify-end">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDeleteAllDone}
            className="px-5 py-2.5 bg-red-900/40 border border-red-700/50 text-red-400 rounded-xl hover:bg-red-900/60 transition-all text-sm font-bold"
          >
            🗑️ حذف كل المنتهية ({doneCount})
          </motion.button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center text-gray-400 py-20">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-xl">لا يوجد أوردرات نشطة</p>
        </div>
      ) : orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          handleUpdateStatus={handleUpdateStatus}
          handleArchiveOrder={handleArchiveOrder}
          handleDeleteOrder={handleDeleteOrder}
          handlePrintOrder={handlePrintOrder}
        />
      ))}
    </div>
  );
};

export default OrdersTab;
