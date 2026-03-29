// src/pages/OwnerDashboard.jsx
import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection, onSnapshot, getDocs,
  writeBatch, doc, setDoc, query, where
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";

const BRANCHES = [
  { id: "mansoura", name: "المنصورة" },
  { id: "mit_ghamr", name: "ميت غمر" },
  { id: "zagazig", name: "الزقازيق" },
];

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [branchStats, setBranchStats] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [slowProducts, setSlowProducts] = useState([]);
  const [paymentStats, setPaymentStats] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [saving, setSaving] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    label: "",
    mansoura: "", mit_ghamr: "", zagazig: "",
    notes: ""
  });

  // ── جيب الأوردرات (بس اللي مش archived) ──────────────────
  useEffect(() => {
    const unsubscribers = BRANCHES.map(({ id }) => {
      const ordersCol = collection(db, id, "orders", "data");
      const q = query(ordersCol, where("archived", "!=", true));
      return onSnapshot(q, (snap) => {
        const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const delivered = orders.filter(
          (o) => o.status === "delivered" || o.status === "done"
        );
        const revenue = delivered.reduce(
          (sum, o) => sum + (o.total || o.totalPrice || 0), 0
        );
        setBranchStats((prev) => ({
          ...prev,
          [id]: {
            total: orders.length,
            delivered: delivered.length,
            pending: orders.filter((o) => o.status === "pending").length,
            cancelled: orders.filter((o) => o.status === "cancelled").length,
            revenue,
            orders,
            recentOrders: [...orders]
              .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
              .slice(0, 3),
          },
        }));
      });
    });
    return () => unsubscribers.forEach((u) => u());
  }, []);

  useEffect(() => { analyzeProducts(); }, [branchStats]);

  const analyzeProducts = async () => {
    const allOrders = Object.values(branchStats).flatMap((b) => b.orders || []);
    const salesMap = {};
    allOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = item.name;
        if (!salesMap[key]) {
          salesMap[key] = { name: item.name, totalQty: 0, totalRevenue: 0, image: item.image || "" };
        }
        salesMap[key].totalQty += item.qty || 1;
        salesMap[key].totalRevenue += (item.price_single || 0) * (item.qty || 1);
      });
    });
    setTopProducts(Object.values(salesMap).sort((a, b) => b.totalQty - a.totalQty).slice(0, 8));
    const payMap = {};
    allOrders.forEach((o) => {
      const method = o.paymentMethod || "unknown";
      payMap[method] = (payMap[method] || 0) + 1;
    });
    setPaymentStats(payMap);
    try {
      const allProductsMap = {};
      await Promise.all(
        BRANCHES.map(async ({ id, name }) => {
          const snap = await getDocs(collection(db, id, "products", "data"));
          snap.docs.forEach((d) => {
            const p = d.data();
            const key = p.name;
            if (!allProductsMap[key]) {
              allProductsMap[key] = { name: p.name, image: p.image || "", branch: name, sales: salesMap[key]?.totalQty || 0 };
            }
          });
        })
      );
      setSlowProducts(Object.values(allProductsMap).filter((p) => p.sales < 3).sort((a, b) => a.sales - b.sales).slice(0, 8));
    } catch (err) { console.error(err); }
  };

  // ── حفظ تقرير أسبوعي أوتوماتيك ──────────────────────────
  const handleSaveWeeklyReport = async () => {
    if (!window.confirm("هتحفظ تقرير الأسبوع وتعمل reset للداشبورد. متأكد؟")) return;
    setSaving(true);
    try {
      const now = new Date();
      const reportId = `report_${now.getTime()}`;
      const label = `تقرير ${now.toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}`;

      // snapshot البيانات
      const reportData = {
        label,
        createdAt: now.toISOString(),
        type: "auto",
        totalRevenue,
        totalOrders,
        totalDelivered,
        completionRate: Number(completionRate),
        topProduct: topProducts[0]?.name || "—",
        topProductQty: topProducts[0]?.totalQty || 0,
        branches: {},
        paymentStats,
      };
      BRANCHES.forEach(({ id, name }) => {
        const b = branchStats[id] || {};
        reportData.branches[id] = {
          name,
          revenue: b.revenue || 0,
          total: b.total || 0,
          delivered: b.delivered || 0,
        };
      });

      // احفظ التقرير
      await setDoc(doc(db, "weeklyReports", "data", "reports", reportId), reportData);

      // archive الأوردرات الحالية
      const batch = writeBatch(db);
      await Promise.all(
        BRANCHES.map(async ({ id }) => {
          const snap = await getDocs(
            query(collection(db, id, "orders", "data"), where("archived", "!=", true))
          );
          snap.docs.forEach((d) => batch.update(d.ref, { archived: true }));
        })
      );
      await batch.commit();

      alert("✅ تم حفظ التقرير وعمل reset للداشبورد!");
    } catch (err) {
      console.error(err);
      alert("❌ فيه مشكلة، حاول تاني");
    }
    setSaving(false);
  };

  // ── حفظ تقرير يدوي ───────────────────────────────────────
  const handleSaveManual = async () => {
    if (!manualForm.label.trim()) { alert("اكتب اسم التقرير الأول"); return; }
    setSaving(true);
    try {
      const now = new Date();
      const reportId = `manual_${now.getTime()}`;
      await setDoc(doc(db, "weeklyReports", "data", "reports", reportId), {
        label: manualForm.label.trim(),
        createdAt: now.toISOString(),
        type: "manual",
        notes: manualForm.notes,
        totalRevenue: 0,
        totalOrders: 0,
        totalDelivered: 0,
        completionRate: 0,
        topProduct: "—",
        topProductQty: 0,
        paymentStats: {},
        branches: {
          mansoura:  { name: "المنصورة", revenue: Number(manualForm.mansoura)  || 0, total: 0, delivered: 0 },
          mit_ghamr: { name: "ميت غمر",  revenue: Number(manualForm.mit_ghamr) || 0, total: 0, delivered: 0 },
          zagazig:   { name: "الزقازيق", revenue: Number(manualForm.zagazig)   || 0, total: 0, delivered: 0 },
        },
      });
      setManualForm({ label: "", mansoura: "", mit_ghamr: "", zagazig: "", notes: "" });
      setShowManualModal(false);
      alert("✅ تم حفظ التقرير اليدوي!");
    } catch (err) {
      console.error(err);
      alert("❌ فيه مشكلة");
    }
    setSaving(false);
  };

  // ── Totals ────────────────────────────────────────────────
  const totalRevenue = Object.values(branchStats).reduce((s, b) => s + (b.revenue || 0), 0);
  const totalOrders = Object.values(branchStats).reduce((s, b) => s + (b.total || 0), 0);
  const totalPending = Object.values(branchStats).reduce((s, b) => s + (b.pending || 0), 0);
  const totalDelivered = Object.values(branchStats).reduce((s, b) => s + (b.delivered || 0), 0);
  const completionRate = totalOrders > 0 ? ((totalDelivered / totalOrders) * 100).toFixed(0) : 0;

  const paymentLabels = {
    cod: "💵 كاش", vodafone: "📱 Vodafone", instapay: "⚡ InstaPay",
    card: "💳 كارت", wallet: "👛 محفظة", unknown: "❓ غير محدد",
  };
  const topPayment = Object.entries(paymentStats).sort((a, b) => b[1] - a[1])[0];

  const handleLogout = async () => { await signOut(auth); navigate("/admin"); };

  return (
    <div className="min-h-screen bg-gray-900 text-white" dir="rtl">

      {/* ── Header ── */}
      <div className="bg-gray-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👑</span>
          <h1 className="text-xl font-bold text-yellow-400">لوحة تحكم الرئيس</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {totalPending > 0 && (
            <div className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-orange-400 text-sm font-bold">{totalPending} انتظار</span>
            </div>
          )}
          {/* زرار التقارير */}
          <Link to="/owner/reports" className="bg-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-500 transition-colors font-bold">
            📋 التقارير
          </Link>
          {/* حفظ يدوي */}
          <button
            onClick={() => setShowManualModal(true)}
            className="bg-purple-600 px-4 py-2 rounded-lg text-sm hover:bg-purple-500 transition-colors font-bold"
          >
            ✏️ تقرير يدوي
          </button>
          {/* حفظ أوتو */}
          <button
            onClick={handleSaveWeeklyReport}
            disabled={saving}
            className="bg-green-600 px-4 py-2 rounded-lg text-sm hover:bg-green-500 transition-colors font-bold disabled:opacity-50"
          >
            {saving ? "⏳ جاري..." : "💾 حفظ الأسبوع"}
          </button>
          <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-500 transition-colors">
            خروج
          </button>
        </div>
      </div>

      {/* ── Overall Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
        <StatCard label="إجمالي الإيرادات" value={`${totalRevenue.toFixed(2)} ج`} color="border-yellow-500" textColor="text-yellow-400" />
        <StatCard label="إجمالي الأوردرات" value={totalOrders} color="border-blue-500" textColor="text-blue-400" />
        <StatCard label="في الانتظار" value={totalPending} color="border-orange-500" textColor="text-orange-400" />
        <StatCard label="نسبة الإتمام" value={`${completionRate}%`} color="border-green-500" textColor="text-green-400" />
      </div>

      {/* ── Tabs ── */}
      <div className="px-6 mb-6">
        <div className="flex gap-2 bg-gray-800 p-1 rounded-xl w-fit">
          {[
            { id: "overview", label: "📊 نظرة عامة" },
            { id: "products", label: "🏆 المنتجات" },
            { id: "insights", label: "💡 تحليلات" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id ? "bg-yellow-500 text-gray-900" : "text-gray-400 hover:text-white"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-10">

        {/* Tab: نظرة عامة */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            {BRANCHES.map(({ id, name }) => {
              const stats = branchStats[id] || {};
              const branchRate = stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(0) : 0;
              return (
                <div key={id} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-yellow-400">🏪 فرع {name}</h2>
                    <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full font-bold">
                      إتمام {branchRate}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    <MiniStat label="إجمالي الأوردرات" value={stats.total || 0} />
                    <MiniStat label="في الانتظار" value={stats.pending || 0} color="text-orange-400" />
                    <MiniStat label="تم التوصيل" value={stats.delivered || 0} color="text-green-400" />
                    <MiniStat label="الإيرادات" value={`${(stats.revenue || 0).toFixed(2)} ج`} highlight />
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>نسبة الإتمام</span><span>{branchRate}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="h-2 rounded-full bg-gradient-to-r from-yellow-500 to-green-500 transition-all duration-500" style={{ width: `${branchRate}%` }} />
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">آخر الأوردرات:</p>
                  {(stats.recentOrders || []).length === 0 ? (
                    <p className="text-gray-600 text-sm text-center py-4">لا يوجد أوردرات بعد</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {stats.recentOrders.map((o, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-700 rounded-lg px-4 py-3 text-sm">
                          <span className="font-semibold text-white">{o.name || "عميل"}</span>
                          <span className="text-gray-400 text-xs">📞 {o.phone || "—"}</span>
                          <span className="text-yellow-400 font-bold">{(o.total || 0).toFixed(2)} ج</span>
                          <StatusBadge status={o.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: المنتجات */}
        {activeTab === "products" && (
          <div className="flex flex-col gap-6">
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <h2 className="text-lg font-bold text-yellow-400 mb-4">🏆 أعلى المنتجات مبيعاً</h2>
              {topProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">لا توجد بيانات بعد</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex items-center gap-4 bg-gray-700 rounded-xl px-4 py-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                        i === 0 ? "bg-yellow-500 text-gray-900" : i === 1 ? "bg-gray-400 text-gray-900" : i === 2 ? "bg-amber-600 text-white" : "bg-gray-600 text-gray-300"
                      }`}>{i + 1}</div>
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-600 flex items-center justify-center">
                        {p.image?.startsWith("http") ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-xl">{p.image || "🍔"}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{p.name}</p>
                        <p className="text-gray-400 text-xs">{p.totalRevenue.toFixed(2)} ج إيرادات</p>
                      </div>
                      <div className="hidden md:flex flex-col items-end gap-1 w-32">
                        <span className="text-yellow-400 font-black text-sm">{p.totalQty} قطعة</span>
                        <div className="w-full bg-gray-600 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
                            style={{ width: `${Math.min((p.totalQty / (topProducts[0]?.totalQty || 1)) * 100, 100)}%` }} />
                        </div>
                      </div>
                      <span className="text-yellow-400 font-black text-sm md:hidden">{p.totalQty}x</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-bold text-orange-400">⚠️ منتجات بطيئة البيع</h2>
                <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">أقل من 3 مبيعات</span>
              </div>
              {slowProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">🎉 كل المنتجات بتتباع كويس!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {slowProducts.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-700 rounded-xl px-4 py-3 border border-orange-500/10">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-600 flex items-center justify-center">
                        {p.image?.startsWith("http") ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-xl">{p.image || "🍔"}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{p.name}</p>
                        <p className="text-gray-400 text-xs">فرع {p.branch}</p>
                      </div>
                      <div className="text-center flex-shrink-0">
                        <p className={`font-black text-lg ${p.sales === 0 ? "text-red-400" : "text-orange-400"}`}>{p.sales}</p>
                        <p className="text-gray-500 text-xs">مبيعة</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: تحليلات */}
        {activeTab === "insights" && (
          <div className="flex flex-col gap-6">
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <h2 className="text-lg font-bold text-yellow-400 mb-4">💳 طرق الدفع الأكثر استخداماً</h2>
              {Object.keys(paymentStats).length === 0 ? (
                <p className="text-gray-500 text-center py-8">لا توجد بيانات بعد</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(paymentStats).sort((a, b) => b[1] - a[1]).map(([method, count]) => {
                    const total = Object.values(paymentStats).reduce((s, v) => s + v, 0);
                    const pct = ((count / total) * 100).toFixed(0);
                    return (
                      <div key={method}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300 font-semibold">{paymentLabels[method] || method}</span>
                          <span className="text-gray-400">{count} أوردر ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                          <div className="h-2.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <h2 className="text-lg font-bold text-yellow-400 mb-4">📈 ملخص تحليلي</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-xs mb-2">🏆 أعلى فرع إيرادات</p>
                  {(() => {
                    const top = BRANCHES.map(({ id, name }) => ({ name, revenue: branchStats[id]?.revenue || 0 })).sort((a, b) => b.revenue - a.revenue)[0];
                    return top ? (<><p className="text-white font-black text-lg">{top.name}</p><p className="text-yellow-400 font-bold">{top.revenue.toFixed(2)} ج</p></>) : <p className="text-gray-500">—</p>;
                  })()}
                </div>
                <div className="bg-gray-700 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-xs mb-2">💳 أكثر طريقة دفع</p>
                  {topPayment ? (<><p className="text-white font-black text-lg">{paymentLabels[topPayment[0]] || topPayment[0]}</p><p className="text-yellow-400 font-bold">{topPayment[1]} أوردر</p></>) : <p className="text-gray-500">—</p>}
                </div>
                <div className="bg-gray-700 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-xs mb-2">💰 متوسط قيمة الأوردر</p>
                  <p className="text-white font-black text-lg">{totalOrders > 0 ? (totalRevenue / (totalDelivered || 1)).toFixed(2) : "0.00"} ج</p>
                  <p className="text-gray-400 text-xs">من الأوردرات المكتملة</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <h2 className="text-lg font-bold text-yellow-400 mb-4">🔔 تنبيهات ذكية</h2>
              <div className="flex flex-col gap-3">
                {slowProducts.length > 0 && <Alert type="warning" message={`${slowProducts.length} منتج بيعهم بطيء — فكر في عروض أو تخفيضات عليهم`} />}
                {totalPending > 5 && <Alert type="danger" message={`في ${totalPending} أوردر في الانتظار — تأكد إن الفروع شايفينهم`} />}
                {completionRate < 70 && totalOrders > 10 && <Alert type="warning" message={`نسبة إتمام الأوردرات ${completionRate}% — أقل من المتوسط المطلوب`} />}
                {topProducts[0] && <Alert type="success" message={`"${topProducts[0].name}" هو الأكثر مبيعاً — ${topProducts[0].totalQty} قطعة اتباعت`} />}
                {slowProducts.length === 0 && totalPending <= 5 && completionRate >= 70 && <Alert type="success" message="كل حاجة تمام! 🎉 المبيعات شغالة كويس" />}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: تقرير يدوي ── */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-lg font-bold text-yellow-400 mb-5">✏️ إضافة تقرير يدوي</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">اسم التقرير *</label>
                <input
                  className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                  placeholder="مثال: أسبوع 1 — يناير"
                  value={manualForm.label}
                  onChange={(e) => setManualForm((p) => ({ ...p, label: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "mansoura", label: "المنصورة" },
                  { key: "mit_ghamr", label: "ميت غمر" },
                  { key: "zagazig", label: "الزقازيق" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-gray-400 text-xs mb-1 block">{label} (ج)</label>
                    <input
                      type="number"
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                      placeholder="0"
                      value={manualForm[key]}
                      onChange={(e) => setManualForm((p) => ({ ...p, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">ملاحظات (اختياري)</label>
                <textarea
                  className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 resize-none"
                  rows={3}
                  placeholder="أي ملاحظات عن الأسبوع ده..."
                  value={manualForm.notes}
                  onChange={(e) => setManualForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSaveManual} disabled={saving}
                className="flex-1 bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50">
                {saving ? "جاري الحفظ..." : "💾 حفظ التقرير"}
              </button>
              <button onClick={() => setShowManualModal(false)}
                className="flex-1 bg-gray-700 text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-600 transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────
const StatCard = ({ label, value, color, textColor }) => (
  <div className={`bg-gray-800 rounded-xl p-5 border-r-4 ${color} border border-gray-700`}>
    <p className="text-gray-400 text-sm">{label}</p>
    <p className={`text-3xl font-bold mt-1 ${textColor}`}>{value}</p>
  </div>
);
const MiniStat = ({ label, value, highlight, color }) => (
  <div className="bg-gray-700 rounded-lg p-3 text-center">
    <p className="text-gray-400 text-xs mb-1">{label}</p>
    <p className={`text-lg font-bold ${highlight ? "text-yellow-400" : color || "text-white"}`}>{value}</p>
  </div>
);
const StatusBadge = ({ status }) => {
  const map = {
    pending:   { label: "انتظار",  cls: "bg-orange-800 text-orange-300" },
    done:      { label: "تم ✅",   cls: "bg-green-800  text-green-300"  },
    delivered: { label: "تم ✅",   cls: "bg-green-800  text-green-300"  },
    cancelled: { label: "ملغي ❌", cls: "bg-red-800    text-red-300"    },
  };
  const { label, cls } = map[status] || { label: status, cls: "bg-gray-600 text-gray-300" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cls}`}>{label}</span>;
};
const Alert = ({ type, message }) => {
  const styles = {
    success: { bg: "bg-green-500/10",  border: "border-green-500/30",  text: "text-green-400",  icon: "✅" },
    warning: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", icon: "⚠️" },
    danger:  { bg: "bg-red-500/10",    border: "border-red-500/30",    text: "text-red-400",    icon: "🚨" },
  };
  const s = styles[type] || styles.warning;
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${s.bg} ${s.border}`}>
      <span>{s.icon}</span>
      <p className={`text-sm font-semibold ${s.text}`}>{message}</p>
    </div>
  );
};

export default OwnerDashboard;