import { useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot, collection, query, where, getDocs, setDoc, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useClientBranch } from "../context/ClientBranchContext";
import { useClientAuth } from "../context/authContext";
import { pickWeightedPrize } from "../utils/spin";

const prizeTypes = {
  percent: "خصم",
  fixed: "خصم ثابت",
  free_delivery: "توصيل مجاني",
  none: "هدية",
};

const segmentColors = ["#FF6B35", "#E63946", "#F4A261", "#C1121F", "#FFB703"];
const SPIN_DURATION = 4300;
const SVG_SIZE = 320;
const CENTER = SVG_SIZE / 2;
const RADIUS = 150;

const polarToCartesian = (angle, radius = RADIUS) => {
  const radians = (angle - 90) * (Math.PI / 180);
  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
};

const describeArc = (startAngle, endAngle) => {
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${CENTER} ${CENTER}`,
    `L ${start.x} ${start.y}`,
    `A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
};

const isWinningPrize = (prize, couponCode) => {
  if (couponCode) return true;
  if (!prize || prize.type === "none") return false;
  return ["percent", "fixed", "free_delivery"].includes(prize.type);
};

const ClientSpinWheel = () => {
  const navigate = useNavigate();
  const tickTimer = useRef(null);
  const { clientUser } = useClientAuth();
  const { selectedBranch } = useClientBranch();
  const [config, setConfig] = useState(null);
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [fallbackConfetti, setFallbackConfetti] = useState(false);

  useEffect(() => {
    if (!selectedBranch?.id) {
      setConfig(null);
      return undefined;
    }

    return onSnapshot(doc(db, "wheelSettings", selectedBranch.id), (snap) => {
      const data = snap.data();
      const normalized = {
        enabled: Boolean(data?.enabled),
        dailyLimit: Math.max(0, Number(data?.dailyLimit || 0)),
        prizes: Array.isArray(data?.prizes) ? data.prizes : [],
        staticCoupon: data?.staticCoupon || null,
      };
      setConfig(normalized);
    }, (err) => {
      console.warn("ClientSpinWheel config error (can be ignored):", err.message);
    });
  }, [selectedBranch?.id]);

  useEffect(() => () => {
    if (tickTimer.current) window.clearTimeout(tickTimer.current);
  }, []);

  const availablePrizes = useMemo(
    () => (config?.prizes || []).filter((p) => p.enabled !== false && Number(p.weight || 0) > 0),
    [config?.prizes]
  );

  const totalWeight = useMemo(
    () => availablePrizes.reduce((sum, prize) => sum + Number(prize.weight || 0), 0),
    [availablePrizes]
  );

  const segments = useMemo(() => {
    let cursor = 0;
    return availablePrizes.map((prize, index) => {
      const angle = totalWeight > 0 ? (Number(prize.weight || 0) / totalWeight) * 360 : 360 / availablePrizes.length;
      const segment = {
        prize,
        index,
        startAngle: cursor,
        endAngle: cursor + angle,
        centerAngle: cursor + angle / 2,
        color: prize.color || segmentColors[index % segmentColors.length],
      };
      cursor += angle;
      return segment;
    });
  }, [availablePrizes, totalWeight]);

  if (!config?.enabled || availablePrizes.length === 0) return null;

  const playTickSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = 780;
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.04);
      window.setTimeout(() => ctx.close(), 80);
    } catch {
      return;
    }
  };

  const startTicking = () => {
    if (tickTimer.current) window.clearTimeout(tickTimer.current);
    let delay = 70;
    const tick = () => {
      playTickSound();
      delay = Math.min(delay + 12, 240);
      tickTimer.current = window.setTimeout(tick, delay);
    };
    tick();
  };

  const stopTicking = () => {
    if (tickTimer.current) {
      window.clearTimeout(tickTimer.current);
      tickTimer.current = null;
    }
  };

  const runConfetti = async () => {
    try {
      const importer = new Function("name", "return import(name)");
      const mod = await importer("canvas-confetti");
      const confetti = mod.default || mod;
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.62 } });
      confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 } });
    } catch {
      if (typeof window.confetti === "function") {
        window.confetti({ particleCount: 120, spread: 75, origin: { y: 0.62 } });
        return;
      }
      setFallbackConfetti(true);
      window.setTimeout(() => setFallbackConfetti(false), 1800);
    }
  };

  const findSegment = (prize) => {
    if (!prize) return segments[0];

    const byId = segments.find((segment) => segment.prize.id && segment.prize.id === prize.id);
    if (byId) return byId;

    return segments.find((segment) => (
      segment.prize.label === prize.label
      && segment.prize.type === prize.type
      && Number(segment.prize.value || 0) === Number(prize.value || 0)
    )) || segments[0];
  };

  const finishSpin = (prize, nextCouponCode, expiresAt) => {
    const finalCouponCode = nextCouponCode || "";
    setResult(prize);
    setCouponCode(finalCouponCode);
    setSpinning(false);
    stopTicking();

    if (isWinningPrize(prize, finalCouponCode)) {
      runConfetti();
      if (finalCouponCode) {
        localStorage.setItem("pendingWheelCoupon", JSON.stringify({
          code: finalCouponCode,
          discount: prize.value,
          type: prize.type,
          label: prize.label,
          expiresAt: expiresAt || (Date.now() + 48 * 60 * 60 * 1000)
        }));
      }
    }
  };

  const landOnPrize = (prize, nextCouponCode, expiresAt) => {
    const segment = findSegment(prize);
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const nextRotation = rotation
      + (6 * 360)
      + ((360 - segment.centerAngle - normalizedRotation + 360) % 360);

    requestAnimationFrame(() => {
      setRotation(nextRotation);
    });

    window.setTimeout(() => {
      finishSpin(prize, nextCouponCode, expiresAt);
    }, SPIN_DURATION);
  };

  const spin = async () => {
    if (!clientUser?.uid) {
      navigate("/login");
      return;
    }
    if (!selectedBranch?.id) {
      setMessage("اختار الفرع الأول عشان نطلعلك كوبون صالح للفرع.");
      return;
    }

    const todayKey = `wheelSpun_${clientUser.uid}_${selectedBranch.id}_${new Date().toDateString()}`;
    if (localStorage.getItem(todayKey)) {
      setMessage("استنفذت لفاتك النهارده 🎡");
      return;
    }

    // Eligibility check FIRST, before any UI changes
    try {
      if (config.dailyLimit > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const spinsSnap = await getDocs(query(
          collection(db, "wheelSpins"),
          where("userId", "==", clientUser.uid),
          where("branchId", "==", selectedBranch.id),
          where("timestamp", ">=", today)
        ));
        if (spinsSnap.size >= config.dailyLimit) {
          setMessage("استنفذت لفاتك النهارده");
          return;
        }
      }
    } catch {
      setMessage("حدث خطأ في التحقق، حاول مرة أخرى");
      return;
    }

    // Only AFTER check passes → start UI
    setSpinning(true);
    setResult(null);
    setCouponCode("");
    setCopied(false);
    setMessage("");
    startTicking();

    try {
      const prize = pickWeightedPrize(config.prizes);
      if (!prize) {
        throw new Error("لا توجد جوائز متاحة");
      }

      let wonCouponCode = null;
      const expiresAtMillis = Date.now() + 48 * 60 * 60 * 1000;
      const expiresAt = Timestamp.fromMillis(expiresAtMillis);

      if (prize.couponCode && prize.type !== "none") {
        wonCouponCode = prize.couponCode.trim().toUpperCase();
        const couponRef = doc(db, selectedBranch.id, "discountCoupons", "data", wonCouponCode);
        await setDoc(couponRef, {
          code: wonCouponCode,
          type: prize.type === "free_delivery" ? "free_delivery" : "percent",
          value: prize.type === "free_delivery" ? 0 : Math.min(Math.max(Number(prize.value || 0), 0), 100),
          minOrderAmount: Number(prize.minOrderAmount || prize.minOrder || 0) || 0,
          active: true,
          usageLimit: 1,
          usageCount: 0,
          source: "spinWheel",
          ownerUid: clientUser.uid,
          createdAt: serverTimestamp(),
          expiresAt: expiresAt,
        });
      }

      await addDoc(collection(db, "wheelSpins"), {
        userId: clientUser.uid,
        userName: clientUser.displayName || clientUser.email || clientUser.uid,
        prize: prize.label || "",
        couponCode: wonCouponCode || null,
        timestamp: serverTimestamp(),
        branchId: selectedBranch.id,
      });

      localStorage.setItem(todayKey, "1");

      landOnPrize(prize, wonCouponCode, expiresAtMillis);
    } catch (err) {
      const text = err?.message || "حاول مرة أخرى";
      setMessage(text);
      setSpinning(false);
      stopTicking();
    }
  };

  const copyCoupon = async () => {
    if (!couponCode) return;
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  const winner = isWinningPrize(result, couponCode);

  return (
    <>
      <style>{`
        @keyframes resultPop {
          from { opacity: 0; transform: translateY(12px) scale(.94); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes confettiFall {
          0% { opacity: 1; transform: translate3d(0, -20px, 0) rotate(0deg); }
          100% { opacity: 0; transform: translate3d(var(--x), 280px, 0) rotate(720deg); }
        }

        .client-wheel-spin {
          transition: transform ${SPIN_DURATION}ms cubic-bezier(.12, .72, .12, 1);
          transform-box: fill-box;
          transform-origin: center;
        }
      `}</style>

      <button
        title="عجلة الحظ"
        onClick={() => {
          setOpen(true);
          setMessage("");
        }}
        className="fixed bottom-[80px] right-[20px] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-3xl shadow-xl shadow-orange-500/25 transition hover:scale-110"
      >
        🎡
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" dir="rtl">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-orange-500/30 bg-dark-900 text-center shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-orange-500/20 to-transparent" />

            <button
              onClick={() => !spinning && setOpen(false)}
              disabled={spinning}
              className="absolute left-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xl font-black text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="إغلاق"
            >
              ×
            </button>

            {!clientUser?.uid ? (
              <div className="relative z-10 flex flex-col items-center p-5 pb-12 pt-12">
                <div className="mb-4 text-6xl">🎡</div>
                <h3 className="mb-6 text-xl font-black text-white">سجل دخول علشان تلف عجلة الحظ!</h3>
                <button
                  onClick={() => { setOpen(false); navigate("/login"); }}
                  className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 py-3 font-black text-white shadow-lg shadow-orange-500/20 transition hover:scale-[1.02]"
                >
                  تسجيل الدخول
                </button>
              </div>
            ) : (
              <div className="relative z-10 p-5 pt-8">
                <p className="text-sm font-bold text-orange-200">جرب حظك مع سانتا في</p>
                <h2 className="mt-1 text-3xl font-black gradient-text">عجلة الحظ</h2>

                <div className="relative mx-auto mt-7 aspect-square w-full max-w-[320px]">
                  <div className="absolute -top-3 left-1/2 z-30 -translate-x-1/2">
                    <div className="h-0 w-0 border-l-[18px] border-r-[18px] border-t-[34px] border-l-transparent border-r-transparent border-t-orange-300 drop-shadow-[0_4px_8px_rgba(0,0,0,.45)]" />
                  </div>

                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-orange-500 to-red-600 p-3 shadow-2xl">
                    <div className="h-full w-full rounded-full bg-dark-950 p-2">
                      <div
                        className="client-wheel-spin relative h-full w-full rounded-full border-4 border-white/80 shadow-2xl"
                        style={{ transform: `rotate(${rotation}deg)` }}
                      >
                        <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="h-full w-full overflow-visible rounded-full">
                          {segments.map((segment) => {
                            const labelPoint = polarToCartesian(segment.centerAngle, 94);
                            const textRotation = segment.centerAngle > 90 && segment.centerAngle < 270
                              ? segment.centerAngle + 180
                              : segment.centerAngle;
                            return (
                              <g key={segment.prize.id || `${segment.prize.label}-${segment.index}`}>
                                <path
                                  d={describeArc(segment.startAngle, segment.endAngle)}
                                  fill={segment.color}
                                  stroke="rgba(255,255,255,.7)"
                                  strokeWidth="2"
                                />
                                <text
                                  x={labelPoint.x}
                                  y={labelPoint.y}
                                  fill="#fff"
                                  fontSize="12"
                                  fontWeight="900"
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  transform={`rotate(${textRotation} ${labelPoint.x} ${labelPoint.y})`}
                                  style={{ textShadow: "0 1px 2px rgba(0,0,0,.55)" }}
                                >
                                  {(segment.prize.label || "").slice(0, 22)}
                                </text>
                              </g>
                            );
                          })}
                          <circle cx={CENTER} cy={CENTER} r="39" fill="#18181b" stroke="#fff" strokeWidth="6" />
                          <text x={CENTER} y={CENTER + 5} fill="#FFB703" fontSize="18" fontWeight="900" textAnchor="middle">
                            لف
                          </text>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {message && (
                  <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
                    {message}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setOpen(false)}
                    disabled={spinning}
                    className="flex-1 rounded-xl border border-gray-600 py-3 font-bold text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    إغلاق
                  </button>
                  <button
                    onClick={spin}
                    disabled={spinning}
                    className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 py-3 font-black text-white shadow-lg shadow-orange-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {spinning ? "بتلف..." : "لف"}
                  </button>
                </div>
              </div>
            )}

            {result && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-5">
                {fallbackConfetti && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {Array.from({ length: 34 }).map((_, index) => (
                      <span
                        key={index}
                        className="absolute top-0 h-3 w-2 rounded-sm"
                        style={{
                          left: `${(index * 29) % 100}%`,
                          background: segmentColors[index % segmentColors.length],
                          "--x": `${((index * 47) % 220) - 110}px`,
                          animation: `confettiFall ${1.25 + (index % 7) * 0.13}s ease-out ${(index % 5) * 0.08}s both`,
                        }}
                      />
                    ))}
                  </div>
                )}
                <div
                  className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-dark-900 p-6 text-center shadow-2xl"
                  style={{ animation: "resultPop .22s ease-out both" }}
                >
                  <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl font-black ${winner ? "bg-yellow-400 text-dark-950" : "bg-white/10 text-gray-300"}`}>
                    {winner ? "★" : "!"}
                  </div>
                  <h3 className="mt-4 text-2xl font-black text-white">
                    {winner ? "مبروك!" : "حظ أوفر المرة الجاية"}
                  </h3>
                  <div className="mt-4 rounded-xl border border-orange-500/20 bg-white/5 p-4">
                    <p className="text-xl font-black text-orange-200">{result.label}</p>
                    <p className="mt-1 text-sm font-bold text-gray-400">{prizeTypes[result.type] || result.type}</p>
                    {couponCode && (
                      <div className="mt-4 rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3">
                        <p className="text-xs font-bold text-yellow-100">استخدم الكود ده في صفحة الدفع</p>
                        {result.minOrderAmount > 0 && (
                          <p className="mt-2 text-sm text-yellow-200">يشتغل على طلبات فوق {result.minOrderAmount} جنيه</p>
                        )}
                        <div className="mt-2 flex items-center gap-2 rounded-lg bg-black/25 p-2" dir="ltr">
                          <p className="flex-1 text-center text-2xl font-black tracking-wider text-yellow-300">{couponCode}</p>
                          <button
                            onClick={copyCoupon}
                            className="rounded-md bg-yellow-400 px-3 py-2 text-xs font-black text-dark-950"
                          >
                            {copied ? "COPIED" : "COPY"}
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setOpen(false);
                            navigate("/menu");
                          }}
                          className="mt-3 w-full rounded-lg bg-orange-500 px-3 py-2 text-sm font-black text-white transition hover:bg-orange-600 shadow-md"
                        >
                          اذهب للطلب واستخدم الكوبون 🛒
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="mt-5 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 py-3 font-black text-white transition hover:scale-[1.02]"
                  >
                    تمام
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ClientSpinWheel;
