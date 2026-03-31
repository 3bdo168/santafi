import OrderCard from "./OrderCard";

const ArchiveTab = ({ archivedOrders, handleArchiveStatusUpdate }) => (
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
      <OrderCard
        key={order.docId}
        order={{ ...order, id: order.docId }}
        showActions="archive"
        handleArchiveStatusUpdate={handleArchiveStatusUpdate}
      />
    ))}
  </div>
);

export default ArchiveTab;
