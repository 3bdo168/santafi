// src/pages/WeeklyReports.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { Link } from "react-router-dom";

const BRANCHES = [
  { id: "mansoura", name: "المنصورة" },
  { id: "mit_ghamr", name: "ميت غمر" },
  { id: "zagazig", name: "الزقازيق" },
];

const WeeklyReports = () => {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "weeklyReports", "data", "reports"),
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setReports(data);
      }
    );
    return () => unsub();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("هتمسح التقرير ده؟")) return;
    await deleteDoc(doc(db, "weeklyReports", "data", "reports", id));
    if (selected?.id === id) setSelected(null);
  };

  const totalBranchRevenue = (report) =>
    Object.values(report.branches || {}).reduce((s, b) => s + (b.revenue || 0), 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white" dir="rtl">

      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <h1 className="text-xl font-bold text-yellow-400">سجل التقارير الأسبوعية</h1>
        </div>
        <Link to="/owner" className="bg-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors font-bold">
          ← رجوع
        </Link>
      </div>

      <div className="p-6 flex flex-col md:flex-row gap-6">

        {/* قائمة التقارير */}
        <div className="w-full md:w-80 flex-shrink-0">
          <h2 className="text-gray-400 text-sm font-bold mb-3 uppercase tracking-wide">
            {reports.length} تقرير محفوظ
          </h2>
          {reports.length === 0 ? (
            <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700">
              <p className="text-gray-500">لا توجد تقارير بعد</p>
              <p className="text-gray-600 text-sm mt-1">اضغط "حفظ الأسبوع" من الداشبورد</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`w-full text-right p-4 rounded-xl border transition-all ${
                    selected?.id === r.id
                      ? "bg-yellow-500/20 border-yellow-500/50"
                      : "bg-gray-800 border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-sm">{r.label}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {new Date(r.createdAt).toLocaleDateString("ar-EG", {
                          day: "numeric", month: "long", year: "numeric"
                        })}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-yellow-400 font-black text-sm">
                        {(r.totalRevenue || totalBranchRevenue(r)).toFixed(0)} ج
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        r.type === "manual"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {r.type === "manual" ? "يدوي" : "أوتو"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* تفاصيل التقرير */}
        <div className="flex-1">
          {!selected ? (
            <div className="bg-gray-800 rounded-2xl p-12 text-center border border-gray-700 border-dashed">
              <p className="text-gray-500 text-lg">👈 اختار تقرير من القائمة</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">

              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-yellow-400">{selected.label}</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {new Date(selected.createdAt).toLocaleDateString("ar-EG", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric"
                    })}
                  </p>
                  {selected.notes && (
                    <p className="text-gray-300 text-sm mt-2 bg-gray-700 px-3 py-2 rounded-lg">
                      📝 {selected.notes}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="bg-red-600/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-sm hover:bg-red-600/30 transition-colors"
                >
                  🗑️ حذف
                </button>
              </div>

              {/* إجماليات */}
              {selected.type !== "manual" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="bg-gray-700 rounded-xl p-3 text-center">
                    <p className="text-gray-400 text-xs">إجمالي الإيرادات</p>
                    <p className="text-yellow-400 font-black text-lg">{selected.totalRevenue?.toFixed(2)} ج</p>
                  </div>
                  <div className="bg-gray-700 rounded-xl p-3 text-center">
                    <p className="text-gray-400 text-xs">إجمالي الأوردرات</p>
                    <p className="text-blue-400 font-black text-lg">{selected.totalOrders}</p>
                  </div>
                  <div className="bg-gray-700 rounded-xl p-3 text-center">
                    <p className="text-gray-400 text-xs">نسبة الإتمام</p>
                    <p className="text-green-400 font-black text-lg">{selected.completionRate}%</p>
                  </div>
                  <div className="bg-gray-700 rounded-xl p-3 text-center">
                    <p className="text-gray-400 text-xs">أعلى منتج</p>
                    <p className="text-white font-bold text-sm truncate">{selected.topProduct}</p>
                    <p className="text-gray-400 text-xs">{selected.topProductQty} قطعة</p>
                  </div>
                </div>
              )}

              {/* إيرادات الفروع */}
              <h3 className="text-gray-300 font-bold mb-3">🏪 إيرادات الفروع</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {BRANCHES.map(({ id, name }) => {
                  const b = selected.branches?.[id];
                  return (
                    <div key={id} className="bg-gray-700 rounded-xl p-4">
                      <p className="text-gray-400 text-sm mb-1">{name}</p>
                      <p className="text-yellow-400 font-black text-xl">{(b?.revenue || 0).toFixed(2)} ج</p>
                      {b?.total > 0 && (
                        <p className="text-gray-500 text-xs mt-1">{b.total} أوردر — {b.delivered} تم</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* طرق الدفع */}
              {selected.type !== "manual" && Object.keys(selected.paymentStats || {}).length > 0 && (
                <>
                  <h3 className="text-gray-300 font-bold mb-3">💳 طرق الدفع</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selected.paymentStats).sort((a, b) => b[1] - a[1]).map(([method, count]) => (
                      <span key={method} className="bg-gray-700 border border-gray-600 px-3 py-1.5 rounded-full text-sm">
                        <span className="text-gray-300">{method}</span>
                        <span className="text-yellow-400 font-bold mr-2">{count}</span>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default WeeklyReports;