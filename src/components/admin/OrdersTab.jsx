import OrderCard from "./OrderCard";

const OrdersTab = ({ orders, handleUpdateStatus, handleArchiveOrder }) => (
  <div className="space-y-4">
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
      />
    ))}
  </div>
);

export default OrdersTab;
