import { useEffect, useMemo, useState } from "react";
import { deleteDoc, onSnapshot, setDoc } from "firebase/firestore";
import { normalizeSpinConfig, spinConfigRef, spinLogRef, todaySpinLogId } from "../../utils/spin";

const defaultConfig = {
  enabled: false,
  dailyLimit: 10,
  prizes: [
    { id: "p1", label: "10% خصم", type: "percent", value: 10, weight: 40, enabled: true },
  ],
};

const prizeTypes = [
  { value: "percent", label: "percent" },
  { value: "free_delivery", label: "free_delivery" },
  { value: "none", label: "none" },
];

const formatTime = (value) => {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  if (!date) return "-";
  return date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
};

const SpinSettingsTab = () => {
  const [config, setConfig] = useState(defaultConfig);
  const [logs, setLogs] = useState([]);
  const today = todaySpinLogId();

  useEffect(() => {
    const unsubConfig = onSnapshot(spinConfigRef, async (snap) => {
      if (!snap.exists()) {
        await setDoc(spinConfigRef, defaultConfig, { merge: true });
        return;
      }
      setConfig(normalizeSpinConfig(snap.data()));
    });
    const unsubLogs = onSnapshot(spinLogRef(today), (snap) => {
      setLogs(snap.exists() && Array.isArray(snap.data().entries) ? snap.data().entries : []);
    });
    return () => {
      unsubConfig();
      unsubLogs();
    };
  }, [today]);

  const totalWeight = useMemo(
    () => config.prizes.reduce((sum, prize) => sum + Number(prize.enabled === false ? 0 : prize.weight || 0), 0),
    [config.prizes]
  );

  const saveConfig = async (next) => {
    setConfig(next);
    await setDoc(spinConfigRef, next, { merge: true });
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
