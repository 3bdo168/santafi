import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import { normalizeSpinConfig, spinLogRef, todaySpinLogId } from "../../utils/spin";

const defaultConfig = {
  enabled: false,
  dailyLimit: 10,
  prizes: [
    { id: "p1", label: "10% خصم", type: "percent", value: 10, weight: 40, enabled: true },
  ],
};

const prizeTypes = [
  { value: "percent", label: "percent" },
  { value: "fixed", label: "fixed" },
  { value: "free_delivery", label: "free_delivery" },
  { value: "none", label: "none" },
];

const emptyCompetition = {
  title: "",
  matchName: "",
  team1: "",
  team2: "",
  correctAnswer: "",
  deadline: "",
  isOpen: true,
};

const formatTime = (value) => {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  if (!date) return "-";
  return date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
};

const formatDateTime = (value) => {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  if (!date) return "-";
  return date.toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
};

const predictionName = (prediction) => (
  prediction.name || prediction.userName || prediction.displayName || prediction.email || prediction.userEmail || "مستخدم"
);

const predictionEmail = (prediction) => (
  prediction.email || prediction.userEmail || "-"
);

const predictionAvatar = (prediction) => (
  prediction.avatar || prediction.photoURL || prediction.userAvatar || ""
);

const SpinSettingsTab = ({ branchId = "mansoura" }) => {
  const [config, setConfig] = useState(defaultConfig);
  const [logs, setLogs] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [competitionForm, setCompetitionForm] = useState(emptyCompetition);
  const [correctPredictors, setCorrectPredictors] = useState({});
  const [loadingPredictors, setLoadingPredictors] = useState({});
  const [analytics, setAnalytics] = useState({
    spinsToday: 0,
    winnersToday: 0,
    usedCoupons: 0,
    totalCoupons: 0,
    recentSpins: []
  });
  const today = todaySpinLogId();
  const wheelSettingsRef = useMemo(() => doc(db, "wheelSettings", branchId), [branchId]);

  useEffect(() => {
    const unsubConfig = onSnapshot(wheelSettingsRef, async (snap) => {
      if (!snap.exists()) {
        await setDoc(wheelSettingsRef, defaultConfig, { merge: true });
        setConfig(defaultConfig);
        return;
      }
      setConfig(normalizeSpinConfig(snap.data()));
    });
    const unsubLogs = onSnapshot(spinLogRef(today), (snap) => {
      setLogs(snap.exists() && Array.isArray(snap.data().entries) ? snap.data().entries : []);
    });
    const unsubCompetitions = onSnapshot(collection(db, "competitions"), (snap) => {
      const list = snap.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || new Date(a.createdAt || 0).getTime();
          const bTime = b.createdAt?.toMillis?.() || new Date(b.createdAt || 0).getTime();
          return bTime - aTime;
        });
      setCompetitions(list);
    });
    return () => {
      unsubConfig();
      unsubLogs();
      unsubCompetitions();
    };
  }, [today, wheelSettingsRef]);

  useEffect(() => {
    competitions
      .filter((competition) => competition.isOpen === false && competition.correctAnswer)
      .forEach((competition) => {
        if (!correctPredictors[competition.id] && !loadingPredictors[competition.id]) {
          loadCorrectPredictors(competition);
        }
      });
  }, [competitions]);

  useEffect(() => {
    if (!branchId) return;

    const fetchAnalytics = async () => {
      try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const spinsQuery = query(
          collection(db, "wheelSpins"),
          where("branchId", "==", branchId),
          where("timestamp", ">=", startOfToday)
        );
        const spinsSnap = await getDocs(spinsQuery);

        const couponsQuery = query(
          collection(db, branchId, "discountCoupons", "data"),
          where("source", "==", "spinWheel")
        );
        const couponsSnap = await getDocs(couponsQuery);

        let totalCoupons = couponsSnap.size;
        let winnersToday = 0;
        let usedCoupons = 0;
        const usedCouponsByUid = {};

        couponsSnap.forEach((docSnap) => {
          const c = docSnap.data();
          const isUsed = c.usageCount > 0 || c.used === true;
          if (isUsed) {
            usedCoupons++;
            if (c.ownerUid) usedCouponsByUid[c.ownerUid] = true;
          }
          if (c.createdAt?.toMillis && c.createdAt.toMillis() >= startOfToday.getTime()) {
            winnersToday++;
          }
        });

        let spinsToday = spinsSnap.size;
        let recentSpins = spinsSnap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              isUsed: data.used === true || usedCouponsByUid[data.userId] || false,
            };
          })
          .sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0))
          .slice(0, 10);

        setAnalytics({
          spinsToday,
          winnersToday,
          usedCoupons,
          totalCoupons,
          recentSpins,
        });
      } catch (err) {
        console.error("Error fetching wheel analytics:", err);
      }
    };
    fetchAnalytics();
  }, [branchId]);

  const totalWeight = useMemo(
    () => config.prizes.reduce((sum, prize) => sum + Number(prize.enabled === false ? 0 : prize.weight || 0), 0),
    [config.prizes]
  );

  const saveConfig = async (next) => {
    setConfig(next);
    await setDoc(wheelSettingsRef, next, { merge: true });
  };

  const updatePrize = (id, patch) => {
    const prizes = config.prizes.map((prize) => prize.id === id ? { ...prize, ...patch } : prize);
    saveConfig({ ...config, prizes });
  };

  const addPrize = () => {
    const id = `p${Date.now()}`;
    saveConfig({
      ...config,
      prizes: [
        ...config.prizes,
        { id, label: "جائزة جديدة", type: "none", value: 0, weight: 10, enabled: true },
      ],
    });
  };

  const deletePrize = (id) => {
    saveConfig({ ...config, prizes: config.prizes.filter((prize) => prize.id !== id) });
  };

  const resetToday = async () => {
    if (!window.confirm("مسح سجل لفات اليوم؟")) return;
    await deleteDoc(spinLogRef(today));
  };

  const createCompetition = async (event) => {
    event.preventDefault();
    if (!competitionForm.title.trim() || !competitionForm.matchName.trim()) return;

    await addDoc(collection(db, "competitions"), {
      title: competitionForm.title.trim(),
      matchName: competitionForm.matchName.trim(),
      team1: competitionForm.team1.trim(),
      team2: competitionForm.team2.trim(),
      correctAnswer: competitionForm.correctAnswer.trim(),
      deadline: competitionForm.deadline || "",
      isOpen: Boolean(competitionForm.isOpen),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setCompetitionForm(emptyCompetition);
  };

  const updateCompetition = async (competitionId, patch) => {
    await updateDoc(doc(db, "competitions", competitionId), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  };

  const closeCompetition = async (competition) => {
    await updateCompetition(competition.id, { isOpen: false });
    await loadCorrectPredictors({ ...competition, isOpen: false });
  };

  const loadCorrectPredictors = async (competition) => {
    if (!competition?.id || !competition.correctAnswer) return;

    setLoadingPredictors((prev) => ({ ...prev, [competition.id]: true }));
    try {
      const predictionsQuery = query(
        collection(db, "predictions"),
        where("competitionId", "==", competition.id),
        where("answer", "==", competition.correctAnswer)
      );
      const snap = await getDocs(predictionsQuery);
      setCorrectPredictors((prev) => ({
        ...prev,
        [competition.id]: snap.docs.map((item) => ({ id: item.id, ...item.data() })),
      }));
    } finally {
      setLoadingPredictors((prev) => ({ ...prev, [competition.id]: false }));
    }
  };

  const togglePredictionGrant = async (competition, prediction) => {
    const nextValue = !prediction.wheelSpinGranted;
    await updateDoc(doc(db, "predictions", prediction.id), { wheelSpinGranted: nextValue });
    setCorrectPredictors((prev) => ({
      ...prev,
      [competition.id]: (prev[competition.id] || []).map((item) => (
        item.id === prediction.id ? { ...item, wheelSpinGranted: nextValue } : item
      )),
    }));
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="glass p-6 rounded-2xl border border-orange-500/20">
        <h2 className="text-2xl font-black gradient-text mb-5">إعدادات عجلة الحظ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center justify-between gap-4 p-4 rounded-xl bg-dark-800/50 border border-orange-500/20">
            <span className="font-bold text-white">تفعيل العجلة</span>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => saveConfig({ ...config, enabled: e.target.checked })}
              className="w-5 h-5 accent-orange-500"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400 block mb-2">Daily Limit</span>
            <input
              type="number"
              min="0"
              value={config.dailyLimit}
              onChange={(e) => saveConfig({ ...config, dailyLimit: Number(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg text-white"
            />
          </label>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border border-orange-500/20">
        <h3 className="text-xl font-black text-orange-400 mb-4">مسابقات التوقعات</h3>
        <form onSubmit={createCompetition} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            value={competitionForm.title}
            onChange={(e) => setCompetitionForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="عنوان المسابقة"
            className="px-3 py-2 bg-dark-800/60 border border-orange-500/20 rounded-lg text-white"
          />
          <input
            value={competitionForm.matchName}
            onChange={(e) => setCompetitionForm((prev) => ({ ...prev, matchName: e.target.value }))}
            placeholder="اسم المباراة"
            className="px-3 py-2 bg-dark-800/60 border border-orange-500/20 rounded-lg text-white"
          />
          <input
            value={competitionForm.team1}
            onChange={(e) => setCompetitionForm((prev) => ({ ...prev, team1: e.target.value }))}
            placeholder="الفريق الأول"
            className="px-3 py-2 bg-dark-800/60 border border-orange-500/20 rounded-lg text-white"
          />
          <input
            value={competitionForm.team2}
            onChange={(e) => setCompetitionForm((prev) => ({ ...prev, team2: e.target.value }))}
            placeholder="الفريق الثاني"
            className="px-3 py-2 bg-dark-800/60 border border-orange-500/20 rounded-lg text-white"
          />
          <input
            value={competitionForm.correctAnswer}
            onChange={(e) => setCompetitionForm((prev) => ({ ...prev, correctAnswer: e.target.value }))}
            placeholder="الإجابة الصحيحة"
            className="px-3 py-2 bg-dark-800/60 border border-orange-500/20 rounded-lg text-white"
          />
          <input
            type="datetime-local"
            value={competitionForm.deadline}
            onChange={(e) => setCompetitionForm((prev) => ({ ...prev, deadline: e.target.value }))}
            className="px-3 py-2 bg-dark-800/60 border border-orange-500/20 rounded-lg text-white"
          />
          <label className="flex items-center justify-between gap-3 px-3 py-2 bg-dark-800/60 border border-orange-500/20 rounded-lg text-white">
            <span>مفتوحة</span>
            <input
              type="checkbox"
              checked={competitionForm.isOpen}
              onChange={(e) => setCompetitionForm((prev) => ({ ...prev, isOpen: e.target.checked }))}
              className="w-5 h-5 accent-orange-500"
            />
          </label>
          <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold">
            إنشاء مسابقة
          </button>
        </form>

        <div className="mt-6 space-y-4">
          {competitions.length === 0 ? (
            <div className="rounded-xl border border-orange-500/10 bg-dark-800/40 p-5 text-center text-gray-500">
              لا توجد مسابقات توقعات
            </div>
          ) : competitions.map((competition) => {
            const predictors = correctPredictors[competition.id] || [];
            const isLoading = loadingPredictors[competition.id];
            return (
              <div key={competition.id} className="rounded-xl border border-orange-500/20 bg-dark-800/40 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-black text-white">{competition.title}</h4>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${competition.isOpen ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"}`}>
                        {competition.isOpen ? "مفتوحة" : "مغلقة"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-300">{competition.matchName}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {competition.team1 || "-"} ضد {competition.team2 || "-"} | الإجابة: {competition.correctAnswer || "-"} | الموعد: {formatDateTime(competition.deadline)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {competition.isOpen ? (
                      <button
                        onClick={() => closeCompetition(competition)}
                        className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-bold text-red-300"
                      >
                        إغلاق المسابقة
                      </button>
                    ) : (
                      <button
                        onClick={() => updateCompetition(competition.id, { isOpen: true })}
                        className="rounded-lg border border-green-500/40 px-4 py-2 text-sm font-bold text-green-300"
                      >
                        إعادة فتح
                      </button>
                    )}
                    {!competition.isOpen && (
                      <button
                        onClick={() => loadCorrectPredictors(competition)}
                        className="rounded-lg border border-orange-500/40 px-4 py-2 text-sm font-bold text-orange-300"
                      >
                        تحديث الفائزين
                      </button>
                    )}
                  </div>
                </div>

                {!competition.isOpen && (
                  <div className="mt-4 overflow-x-auto">
                    {isLoading ? (
                      <div className="rounded-lg bg-dark-900/60 p-4 text-center text-gray-400">جاري تحميل التوقعات الصحيحة...</div>
                    ) : predictors.length === 0 ? (
                      <div className="rounded-lg bg-dark-900/60 p-4 text-center text-gray-500">لا توجد توقعات صحيحة</div>
                    ) : (
                      <table className="w-full min-w-[620px] text-sm">
                        <thead>
                          <tr className="border-b border-orange-500/20 text-gray-400">
                            <th className="py-3 text-right">المستخدم</th>
                            <th className="py-3 text-right">الإيميل</th>
                            <th className="py-3 text-right">الإجابة</th>
                            <th className="py-3 text-right">منح لفة عجلة ✅</th>
                          </tr>
                        </thead>
                        <tbody>
                          {predictors.map((prediction) => (
                            <tr key={prediction.id} className="border-b border-orange-500/10">
                              <td className="py-3">
                                <div className="flex items-center gap-3">
                                  {predictionAvatar(prediction) ? (
                                    <img src={predictionAvatar(prediction)} alt="" className="h-9 w-9 rounded-full object-cover" />
                                  ) : (
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/20 text-orange-200">
                                      {predictionName(prediction).slice(0, 1)}
                                    </div>
                                  )}
                                  <span className="font-bold text-white">{predictionName(prediction)}</span>
                                </div>
                              </td>
                              <td className="py-3 text-gray-300">{predictionEmail(prediction)}</td>
                              <td className="py-3 text-orange-200">{prediction.answer || "-"}</td>
                              <td className="py-3">
                                <input
                                  type="checkbox"
                                  checked={prediction.wheelSpinGranted === true}
                                  onChange={() => togglePredictionGrant(competition, prediction)}
                                  className="w-5 h-5 accent-green-500"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border border-orange-500/20 mb-6">
        <h3 className="text-xl font-black text-orange-400 mb-4">إحصائيات عجلة الحظ (اليوم)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-dark-800/50 p-4 rounded-xl border border-orange-500/20 text-center">
            <p className="text-gray-400 text-sm font-bold mb-1">إجمالي اللفات</p>
            <p className="text-3xl font-black text-[#FF6B35]">{analytics.spinsToday}</p>
          </div>
          <div className="bg-dark-800/50 p-4 rounded-xl border border-orange-500/20 text-center">
            <p className="text-gray-400 text-sm font-bold mb-1">إجمالي الفائزين</p>
            <p className="text-3xl font-black text-[#FF6B35]">{analytics.winnersToday}</p>
          </div>
          <div className="bg-dark-800/50 p-4 rounded-xl border border-orange-500/20 text-center">
            <p className="text-gray-400 text-sm font-bold mb-1">كوبونات اتستخدمت</p>
            <p className="text-3xl font-black text-[#FF6B35]">{analytics.usedCoupons}</p>
          </div>
          <div className="bg-dark-800/50 p-4 rounded-xl border border-orange-500/20 text-center">
            <p className="text-gray-400 text-sm font-bold mb-1">نسبة الاستخدام</p>
            <p className="text-3xl font-black text-[#FF6B35]">
              {analytics.totalCoupons > 0 ? Math.round((analytics.usedCoupons / analytics.totalCoupons) * 100) : 0}%
            </p>
          </div>
        </div>

        <h4 className="text-lg font-bold text-white mt-6 mb-3">آخر 10 لفات النهارده</h4>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-orange-500/20 text-gray-400">
                <th className="py-3 text-right">الوقت</th>
                <th className="py-3 text-right">المستخدم</th>
                <th className="py-3 text-right">الجائزة</th>
                <th className="py-3 text-right">الكوبون اتستخدم؟</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentSpins.length === 0 ? (
                <tr><td colSpan="4" className="py-8 text-center text-gray-500">لا يوجد لفات اليوم</td></tr>
              ) : analytics.recentSpins.map((spin, i) => (
                <tr key={spin.id || i} className="border-b border-orange-500/10 even:bg-white/5">
                  <td className="py-3 text-gray-400">{formatTime(spin.timestamp)}</td>
                  <td className="py-3 text-white font-bold">{spin.userName || spin.userId || "-"}</td>
                  <td className="py-3 text-orange-300">{spin.prize || "-"}</td>
                  <td className="py-3 text-gray-300">{spin.isUsed ? "✅ أيوه" : "❌ لأ"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border border-orange-500/20 overflow-x-auto">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-xl font-black text-orange-400">الجوائز</h3>
          <button onClick={addPrize} className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold">
            إضافة جائزة
          </button>
        </div>
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-orange-500/20">
              <th className="py-3 text-right">Label</th>
              <th className="py-3 text-right">Type</th>
              <th className="py-3 text-right">Value</th>
              <th className="py-3 text-right">كود الكوبون</th>
              <th className="py-3 text-right">Weight</th>
              <th className="py-3 text-right">%</th>
              <th className="py-3 text-right">Enabled</th>
              <th className="py-3 text-right">حذف</th>
            </tr>
          </thead>
          <tbody>
            {config.prizes.map((prize) => {
              const percent = totalWeight > 0 && prize.enabled !== false
                ? (Number(prize.weight || 0) / totalWeight) * 100
                : 0;
              return (
                <tr key={prize.id} className="border-b border-orange-500/10">
                  <td className="py-3">
                    <input
                      value={prize.label || ""}
                      onChange={(e) => updatePrize(prize.id, { label: e.target.value })}
                      className="w-full px-3 py-2 bg-dark-800/60 border border-orange-500/20 rounded-lg text-white"
                    />
                  </td>
                  <td className="py-3">
                    <select
                      value={prize.type || "none"}
                      onChange={(e) => updatePrize(prize.id, { type: e.target.value })}
                      className="w-full px-3 py-2 bg-dark-800/60 border border-orange-500/20 rounded-lg text-white"
                    >
                      {prizeTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                  </td>
                  <td className="py-3">
                    <input
                      type="number"
                      value={prize.value || 0}
                      onChange={(e) => updatePrize(prize.id, { value: Number(e.target.value) || 0 })}
                      className="w-24 px-3 py-2 bg-dark-800/60 border border-orange-500/20 rounded-lg text-white"
                    />
                  </td>
                  <td className="py-3">
                    <input
                      value={prize.type === "none" ? "" : prize.couponCode || ""}
                      onChange={(e) => updatePrize(prize.id, { couponCode: e.target.value })}
                      disabled={prize.type === "none"}
                      placeholder={prize.type === "none" ? "لا يوجد كوبون" : "كود الكوبون"}
                      className="w-28 px-3 py-2 bg-dark-800/60 border border-orange-500/20 rounded-lg text-white disabled:opacity-50"
                    />
                  </td>
                  <td className="py-3">
                    <input
                      type="number"
                      min="0"
                      value={prize.weight || 0}
                      onChange={(e) => updatePrize(prize.id, { weight: Number(e.target.value) || 0 })}
                      className="w-24 px-3 py-2 bg-dark-800/60 border border-orange-500/20 rounded-lg text-white"
                    />
                  </td>
                  <td className="py-3 text-orange-300 font-bold">{percent.toFixed(1)}%</td>
                  <td className="py-3">
                    <input
                      type="checkbox"
                      checked={prize.enabled !== false}
                      onChange={(e) => updatePrize(prize.id, { enabled: e.target.checked })}
                      className="w-5 h-5 accent-orange-500"
                    />
                  </td>
                  <td className="py-3">
                    <button onClick={() => deletePrize(prize.id)} className="px-3 py-2 border border-red-500/40 text-red-400 rounded-lg">
                      حذف
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="glass p-6 rounded-2xl border border-orange-500/20 overflow-x-auto">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-xl font-black text-orange-400">سجل لفات اليوم ({logs.length})</h3>
          <button onClick={resetToday} className="px-4 py-2 border border-red-500/40 text-red-400 rounded-lg font-bold">
            Reset Today's Spins
          </button>
        </div>
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-orange-500/20">
              <th className="py-3 text-right">User</th>
              <th className="py-3 text-right">Prize</th>
              <th className="py-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan="3" className="py-8 text-center text-gray-500">لا يوجد لفات اليوم</td></tr>
            ) : logs.map((log, index) => (
              <tr key={`${log.userId || "user"}-${index}`} className="border-b border-orange-500/10">
                <td className="py-3 text-white">{log.user || log.userId || "-"}</td>
                <td className="py-3 text-orange-300">{log.prizeLabel || "-"}</td>
                <td className="py-3 text-gray-400">{formatTime(log.time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SpinSettingsTab;
