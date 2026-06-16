const paymentLabels = {
  cod: "الدفع عند الاستلام",
  cash: "كاش",
  vodafone: "فودافون كاش",
  instapay: "إنستاباي",
  card: "بطاقة",
};

const formatMoney = (value) => `${Number(value || 0).toFixed(2)} ج`;

const formatDate = (value) => {
  const date = value?.toDate?.() || (value ? new Date(value) : new Date());
  return date.toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const OrderPrintView = ({ order, mode = "a4" }) => {
  if (!order) return null;

  const shortId = String(order.orderId || order.id || "").slice(-6);
  const restaurantName = "Santafe";
  const paymentMethod = paymentLabels[order.paymentMethod] || order.paymentMethod || "غير محدد";

  return (
    <div id="order-print-view" dir="rtl" className={`order-print-view ${mode === "thermal" ? "thermal" : "a4"}`}>
      <style>{`
        .order-print-view { display: none; }
        @media print {
          body * { visibility: hidden !important; }
          #order-print-view, #order-print-view * { visibility: visible !important; }
          #order-print-view {
            display: block !important;
            position: absolute;
            inset: 0 auto auto 0;
            width: 190mm;
            padding: 14mm;
            background: #fff;
            color: #000;
            font-family: Arial, Tahoma, sans-serif;
            font-size: 13px;
            line-height: 1.5;
          }
          #order-print-view.thermal {
            width: 80mm;
            padding: 4mm;
            font-size: 11px;
          }
          #order-print-view h1,
          #order-print-view h2,
          #order-print-view p { margin: 0; }
          #order-print-view .center { text-align: center; }
          #order-print-view .muted { color: #444; }
          #order-print-view .block { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #999; }
          #order-print-view table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          #order-print-view th,
          #order-print-view td { padding: 5px 3px; border-bottom: 1px solid #ddd; text-align: right; vertical-align: top; }
          #order-print-view th:last-child,
          #order-print-view td:last-child { text-align: left; }
          #order-print-view .totals { margin-top: 8px; }
          #order-print-view .row { display: flex; justify-content: space-between; gap: 8px; }
          #order-print-view .total { font-size: 16px; font-weight: 700; border-top: 1px solid #000; padding-top: 6px; margin-top: 6px; }
          #order-print-view.thermal .total { font-size: 13px; }
          @page { margin: 0; size: A4; }
          #order-print-view.thermal { page-break-after: avoid; }
        }
      `}</style>

      <div className="center">
        <h1>{restaurantName}</h1>
        <p className="muted">الفرع: {order.branchName || "غير محدد"}</p>
        <p>طلب #{shortId}</p>
        <p>{formatDate(order.createdAt)}</p>
      </div>

      <div className="block">
        <p><strong>العميل:</strong> {order.name || "-"}</p>
        <p><strong>الهاتف:</strong> {order.phone || "-"}</p>
        <p><strong>العنوان:</strong> {order.address || "-"}</p>
      </div>

      <div className="block">
        <table>
          <thead>
            <tr>
              <th>الصنف</th>
              <th>الكمية</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item, index) => (
              <tr key={`${item.name || "item"}-${index}`}>
                <td>{item.name || "-"}</td>
                <td>{item.qty || 0}</td>
                <td>{formatMoney(Number(item.price_single || 0) * Number(item.qty || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="block totals">
        <div className="row"><span>الإجمالي الفرعي</span><span>{formatMoney(order.subtotal)}</span></div>
        <div className="row"><span>خصم الكوبون</span><span>{formatMoney(order.couponDiscount)}</span></div>
        <div className="row"><span>التوصيل {order.deliveryZoneName ? `(${order.deliveryZoneName})` : ""}</span><span>{formatMoney(order.deliveryFee)}</span></div>
        <div className="row total"><span>الإجمالي</span><span>{formatMoney(order.total)}</span></div>
      </div>

      <div className="block">
        <p><strong>طريقة الدفع:</strong> {paymentMethod}</p>
        <p><strong>ملاحظات:</strong> {order.notes || "لا يوجد"}</p>
      </div>

      <div className="block center">
        <h2>شكراً لطلبك</h2>
      </div>
    </div>
  );
};

export default OrderPrintView;
