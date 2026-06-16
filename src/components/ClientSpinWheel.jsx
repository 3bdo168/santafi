import { useEffect, useMemo, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useNavigate } from "react-router-dom";
import { functions } from "../firebase";
import { useClientBranch } from "../context/ClientBranchContext";
import { useClientAuth } from "../context/authContext";
import { normalizeSpinConfig, spinConfigRef, spinUserRef } from "../utils/spin";

const prizeTypes = {
  percent: "خصم",
  free_delivery: "توصيل مجاني",
  none: "هدية",
};

const ClientSpinWheel = () => {
  const navigate = useNavigate();
  const { clientUser } = useClientAuth();
  const { selectedBranch } = useClientBranch();
  const [config, setConfig] = useState(null);
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [message, setMessage] = useState("");
  const [hasSpun, setHasSpun] = useState(false);

  useEffect(() => {
    return onSnapshot(spinConfigRef, (snap) => {
      setConfig(snap.exists() ? normalizeSpinConfig(snap.data()) : normalizeSpinConfig());
    }, (err) => {
      console.warn("ClientSpinWheel config error (can be ignored):", err.message);
    });
  }, []);

  useEffect(() => {
    if (!clientUser?.uid) {
      setHasSpun(false);
      return undefined;
    }
    return onSnapshot(spinUserRef(clientUser.uid), (snap) => {
      setHasSpun(snap.exists());
    }, (err) => {
      console.warn("ClientSpinWheel spinUser error (can be ignored):", err.message);
    });
  }, [clientUser?.uid]);

  const availablePrizes = useMemo(
    () => (config?.prizes || []).filter((p) => p.enabled !== false && Number(p.weight || 0) > 0),
    [config?.prizes]
  );

  if (!config?.enabled || availablePrizes.length === 0) return null;

  const spin = async () => {
    if (!clientUser?.uid) {
      navigate("/login");
      return;
    }
    if (!selectedBranch?.id) {
      setMessage("اختار الفرع الأول عشان نطلعلك كوبون صالح للفرع.");
      return;
    }
    if (hasSpun) {
      setMessage("\u0644\u0642\u062f \u0627\u0633\u062a\u062e\u062f\u0645\u062a \u0639\u062c\u0644\u0629 \u0627\u0644\u062d\u0638 \u0645\u0646 \u0642\u0628\u0644. \u0645\u062a\u0627\u062d\u0629 \u0645\u0631\u0629 \u0648\u0627\u062d\u062f\u0629 \u0641\u0642\u0637 \u0644\u0643\u0644 \u062d\u0633\u0627\u0628.");
      return;
    }
    setSpinning(true);
    setResult(null);
    setCouponCode("");
    setMessage("");
    try {
      const spinWheel = httpsCallable(functions, "spinWheel");
      const response = await spinWheel({ branchId: selectedBranch.id });
      setResult(response.data?.prize || null);
      setCouponCode(response.data?.couponCode || "");
      setHasSpun(true);
    } catch (err) {
      const code = err.message || err.code || "";
      const text = code.includes("daily_limit") || code.includes("resource-exhausted")
        ? "تم الوصول للحد اليومي"
        : code.includes("disabled")
          ? "العجلة غير متاحة الآن"
          : code.includes("already_spun")
            ? "\u0644\u0642\u062f \u0627\u0633\u062a\u062e\u062f\u0645\u062a \u0639\u062c\u0644\u0629 \u0627\u0644\u062d\u0638 \u0645\u0646 \u0642\u0628\u0644. \u0645\u062a\u0627\u062d\u0629 \u0645\u0631\u0629 \u0648\u0627\u062d\u062f\u0629 \u0641\u0642\u0637 \u0644\u0643\u0644 \u062d\u0633\u0627\u0628."
            : "حاول مرة أخرى";
      setMessage(text);
    } finally {
      setSpinning(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-4 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black shadow-xl shadow-orange-500/20"
      >
        🎁 لف واكسب
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" dir="rtl">
          <div className="w-full max-w-sm bg-dark-900 border border-orange-500/30 rounded-2xl p-6 text-center">
            <div className={`mx-auto w-48 h-48 rounded-full border-8 border-orange-500/40 flex items-center justify-center bg-dark-800 ${spinning ? "animate-spin" : ""}`}>
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-red-500 flex items-center justify-center text-4xl">
                🎁
              </div>
            </div>

            <h2 className="mt-5 text-2xl font-black gradient-text">عجلة الحظ</h2>
            {result && (
              <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                <p className="text-green-400 font-black">{result.label}</p>
                <p className="text-gray-300 text-sm">{prizeTypes[result.type] || result.type}</p>
                {couponCode && (
                  <div className="mt-3 rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3">
                    <p className="text-xs text-yellow-200">استخدم الكود ده في صفحة الدفع</p>
                    <p className="mt-1 text-xl font-black tracking-wider text-yellow-300" dir="ltr">{couponCode}</p>
                  </div>
                )}
              </div>
            )}
            {message && <p className="mt-4 text-red-400 font-bold">{message}</p>}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-3 border border-gray-600 text-gray-300 rounded-xl font-bold"
              >
                إغلاق
              </button>
              <button
                onClick={spin}
                disabled={spinning || hasSpun}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-black disabled:opacity-50"
              >
                {spinning ? "..." : hasSpun ? "\u062a\u0645 \u0627\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645" : "لف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientSpinWheel;
