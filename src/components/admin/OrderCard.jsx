import { motion } from "framer-motion";

const OrderCard = ({
  order,
  showActions = true,
  handleUpdateStatus,
  handleArchiveOrder,
  handleArchiveStatusUpdate,
}) => (
  <motion.div
    key={order.id}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`glass p-6 rounded-2xl border transition-all ${
      order.status === "delivered" ? "border-green-500/30 opacity-80"
      : order.status === "rejected" ? "border-red-500/30 opacity-80"
      : order.status === "done" ? "border-green-500/30 opacity-70"
      : order.status === "cancelled" ? "border-red-500/30 opacity-70"
      : order.status === "preparing" ? "border-yellow-500/40"
      : "border-orange-500/20"
    }`}
  >
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="font-bold text-white text-lg">{order.name}</p>
        <p className="text-gray-400 text-sm">📞 {order.phone}</p>
        <p className="text-gray-400 text-sm">📍 {order.address}</p>
        {order.notes && <p className="text-gray-500 text-xs mt-1">📝 {order.notes}</p>}
        {order.createdAt && (
          <p className="text-gray-600 text-xs mt-1">
            🕒 {order.createdAt?.toDate?.()?.toLocaleString("en-EG", {
              year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="text-orange-400 font-black text-xl">{order.total?.toFixed(2)} ج</p>
        <p className="text-gray-500 text-xs mt-1">{order.paymentMethod}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block font-semibold ${
          order.status === "delivered" ? "bg-green-500/20 text-green-400"
          : order.status === "rejected" ? "bg-red-500/20 text-red-400"
          : order.status === "done" ? "bg-green-500/20 text-green-400"
          : order.status === "cancelled" ? "bg-red-500/20 text-red-400"
          : order.status === "preparing" ? "bg-yellow-500/20 text-yellow-400"
          : "bg-orange-500/20 text-orange-400"
        }`}>
          {order.status === "delivered" ? "✅ تم التوصيل"
          : order.status === "rejected" ? "❌ تم الرفض"
          : order.status === "done" ? "✅ تم"
          : order.status === "cancelled" ? "❌ ملغي"
          : order.status === "preparing" ? "🔥 قيد التحضير"
          : "⏳ انتظار"}
        </span>
      </div>
    </div>

    <div className="border-t border-orange-500/10 pt-3 space-y-1 mb-4">
      {order.items?.map((item, i) => (
        <div key={i} className="flex justify-between text-sm">
          <span className="text-gray-300">{item.name} x{item.qty}</span>
          <span className="text-orange-400">{(item.price_single * item.qty).toFixed(2)} ج</span>
        </div>
      ))}
    </div>

    {showActions === "archive" && order.status !== "delivered" && order.status !== "rejected" && (
      <div className="flex gap-2 flex-wrap">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleArchiveStatusUpdate(order.id, "delivered")}
          className="flex-1 py-2 bg-green-500/20 border border-green-500/40 text-green-400 rounded-lg hover:bg-green-500/30 transition-all text-sm font-semibold"
        >
          ✅ تم التوصيل
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleArchiveStatusUpdate(order.id, "rejected")}
          className="flex-1 py-2 bg-red-500/20 border border-red-500/40 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm font-semibold"
        >
          ❌ تم الرفض
        </motion.button>
      </div>
    )}

    {showActions === true && order.status !== "done" && order.status !== "cancelled" && (
      <div className="flex gap-2 flex-wrap">
        {order.status === "pending" && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleUpdateStatus(order.id, "preparing")}
            className="flex-1 py-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-all text-sm font-semibold"
          >
            🔥 قيد التحضير
          </motion.button>
        )}
        {order.status === "preparing" && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleUpdateStatus(order.id, "done")}
            className="flex-1 py-2 bg-green-500/20 border border-green-500/40 text-green-400 rounded-lg hover:bg-green-500/30 transition-all text-sm font-semibold"
          >
            ✅ تم التوصيل
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleUpdateStatus(order.id, "cancelled")}
          className="flex-1 py-2 bg-red-500/20 border border-red-500/40 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm font-semibold"
        >
          ❌ إلغاء
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleArchiveOrder(order)}
          className="py-2 px-3 bg-gray-500/20 border border-gray-500/40 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-all text-sm font-semibold"
          title="أرشفة يدوية"
        >
          📁
        </motion.button>
      </div>
    )}
  </motion.div>
);

export default OrderCard;
