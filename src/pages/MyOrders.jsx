// src/pages/MyOrders.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useClientAuth } from "../context/ClientAuthContext";

/* ─────────────────────────────────────────
   Status Configuration
───────────────────────────────────────── */
const STATUS_CONFIG = {
  pending: {
    label: "قيد الانتظار",
    emoji: "⏳",
    color: "#FFC107",
    bg: "rgba(255,193,7,0.12)",
    border: "rgba(255,193,7,0.35)",
    step: 0,
  },
  confirmed: {
    label: "تم التأكيد",
    emoji: "✅",
    color: "#2196F3",
    bg: "rgba(33,150,243,0.12)",
    border: "rgba(33,150,243,0.35)",
    step: 1,
  },
  preparing: {
    label: "قيد التحضير",
    emoji: "🔥",
    color: "#FF9800",
    bg: "rgba(255,152,0,0.12)",
    border: "rgba(255,152,0,0.35)",
    step: 2,
  },
  out_for_delivery: {
    label: "خرج للتوصيل",
    emoji: "🛵",
    color: "#9C27B0",
    bg: "rgba(156,39,176,0.12)",
    border: "rgba(156,39,176,0.35)",
    step: 3,
  },
  delivered: {
    label: "تم التوصيل",
    emoji: "🎉",
    color: "#4CAF50",
    bg: "rgba(76,175,80,0.12)",
    border: "rgba(76,175,80,0.35)",
    step: 4,
  },
  done: {
    label: "تم",
    emoji: "✅",
    color: "#4CAF50",
    bg: "rgba(76,175,80,0.12)",
    border: "rgba(76,175,80,0.35)",
    step: 4,
  },
  rejected: {
    label: "مرفوض",
    emoji: "❌",
    color: "#F44336",
    bg: "rgba(244,67,54,0.12)",
    border: "rgba(244,67,54,0.35)",
    step: -1,
  },
  cancelled: {
    label: "ملغي",
    emoji: "❌",
    color: "#F44336",
    bg: "rgba(244,67,54,0.12)",
    border: "rgba(244,67,54,0.35)",
    step: -1,
  },
  pending_payment: {
    label: "في انتظار الدفع",
    emoji: "🔒",
    color: "#9C27B0",
    bg: "rgba(156,39,176,0.12)",
    border: "rgba(156,39,176,0.35)",
    step: 0,
  },
};

const TIMELINE_STEPS = [
  { key: "pending",           emoji: "⏳", label: "استلمنا طلبك" },
  { key: "confirmed",         emoji: "✅", label: "تم التأكيد" },
  { key: "preparing",         emoji: "🔥", label: "بيتجهز" },
  { key: "out_for_delivery",  emoji: "🛵", label: "في الطريق" },
  { key: "delivered",         emoji: "🎉", label: "وصلك!" },
];

const getStatusConfig = (status) =>
  STATUS_CONFIG[status] || STATUS_CONFIG.pending;

/* ─────────────────────────────────────────
   Timeline Component
───────────────────────────────────────── */
const OrderTimeline = ({ status }) => {
  const cfg = getStatusConfig(status);
  const isFailed = status === "rejected" || status === "cancelled";
  const currentStep = cfg.step;

  if (isFailed) {
    return (
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-bold"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
      >
        <span className="text-xl">{cfg.emoji}</span>
        <span>الطلب {cfg.label}</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-between mt-4 px-1">
      {/* Connector line */}
      <div
        className="absolute top-5 right-5 left-5 h-0.5"
        style={{ background: "rgba(255,255,255,0.08)" }}
      />
      {/* Active line */}
      <motion.div
        className="absolute top-5 right-5 h-0.5"
        style={{ background: "linear-gradient(90deg, #FFD700, #FF9800)", left: "20px" }}
        initial={{ width: "0%" }}
        animate={{
          width: currentStep <= 0
            ? "0%"
            : `${Math.min(100, (currentStep / (TIMELINE_STEPS.length - 1)) * 100)}%`,
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {TIMELINE_STEPS.map((step, idx) => {
        const done = idx <= currentStep;
        const active = idx === currentStep;
        return (
          <div key={step.key} className="flex flex-col items-center gap-1.5 z-10" style={{ minWidth: 48 }}>
            <motion.div
              animate={active ? { scale: [1, 1.15, 1], boxShadow: ["0 0 0px #FFD700", "0 0 14px #FFD700", "0 0 0px #FFD700"] } : {}}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500"
              style={{
                background: done
                  ? "linear-gradient(135deg, #FFD700, #f0a500)"
                  : "rgba(255,255,255,0.07)",
                border: done
                  ? "2px solid rgba(255,215,0,0.6)"
                  : "2px solid rgba(255,255,255,0.1)",
                boxShadow: active ? "0 0 16px rgba(255,215,0,0.4)" : "none",
              }}
            >
              {step.emoji}
            </motion.div>
            <span
              className="text-center leading-tight"
              style={{
                fontSize: 10,
                color: done ? "#FFD700" : "#555",
                fontWeight: active ? 700 : 400,
                maxWidth: 50,
              }}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────
   Single Order Card
───────────────────────────────────────── */
const OrderCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = getStatusConfig(order.status);

  const date = order.createdAt?.toDate?.();
  const dateStr = date
    ? date.toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const timeStr = date
    ? date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    : "";

  const payLabel =
    order.paymentMethod === "cod"
      ? "💵 كاش عند الاستلام"
      : order.paymentMethod === "vodafone"
      ? "📱 Vodafone Cash"
      : order.paymentMethod === "instapay"
      ? "⚡ InstaPay"
      : order.paymentMethod || "—";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(14,14,14,0.97)",
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 4px 24px ${cfg.bg}`,
      }}
    >
      {/* ── Header ── */}
      <button
        className="w-full text-right px-6 pt-5 pb-4"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: Branch + Date */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">🏪 {order.branchName || "الفرع"}</p>
            <p className="text-gray-500 text-xs mt-0.5">
              {dateStr} {timeStr && <span className="text-gray-600">· {timeStr}</span>}
            </p>
            <p className="text-gray-600 text-xs mt-0.5">#{(order.orderId || order.id || "").slice(-6).toUpperCase()}</p>
          </div>

          {/* Right: Total + Status */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-lg font-black" style={{ color: "#FFD700" }}>
              {order.total?.toFixed(2)} ج
            </span>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
            >
              {cfg.emoji} {cfg.label}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <OrderTimeline status={order.status} />

        {/* Expand indicator */}
        <div className="flex items-center justify-center mt-3">
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-gray-600 text-xs"
          >
            ▼
          </motion.span>
        </div>
      </button>

      {/* ── Expanded Details ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div
              className="px-6 pb-5 space-y-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              {/* Items */}
              <div className="pt-4">
                <p className="text-gray-500 text-xs font-semibold mb-3 uppercase tracking-wider">📦 تفاصيل الطلب</p>
                <div className="space-y-2">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-8 h-8 rounded-lg object-cover"
                            style={{ border: "1px solid rgba(255,215,0,0.15)" }}
                          />
                        )}
                        <span className="text-gray-300">{item.name}</span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-md font-bold"
                          style={{ background: "rgba(255,215,0,0.1)", color: "#FFD700" }}
                        >
                          ×{item.qty}
                        </span>
                      </div>
                      <span className="text-gray-400 font-semibold">
                        {(item.price_single * item.qty).toFixed(2)} ج
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals breakdown */}
              <div
                className="rounded-xl p-4 space-y-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                {order.couponCode && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">🏷️ كوبون ({order.couponCode})</span>
                    <span style={{ color: "#4CAF50" }}>-{order.couponDiscount?.toFixed(2)} ج</span>
                  </div>
                )}
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">🛵 رسوم التوصيل {order.deliveryZoneName ? `(${order.deliveryZoneName})` : ""}</span>
                    <span className="text-gray-400">{order.deliveryFee?.toFixed(2)} ج</span>
                  </div>
                )}
                {order.freeDeliveryApplied && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">🎁 توصيل مجاني</span>
                    <span style={{ color: "#4CAF50" }}>مجاناً!</span>
                  </div>
                )}
                <div
                  className="flex justify-between pt-2"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span className="text-white font-bold text-sm">الإجمالي</span>
                  <span className="font-black text-sm" style={{ color: "#FFD700" }}>
                    {order.total?.toFixed(2)} ج
                  </span>
                </div>
              </div>

              {/* Footer meta */}
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{payLabel}</span>
                {order.address && <span className="truncate max-w-[140px]">📍 {order.address}</span>}
              </div>

              {order.notes && (
                <div
                  className="rounded-xl px-4 py-3 text-xs text-gray-400"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  📝 {order.notes}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   Main Page
───────────────────────────────────────── */
const MyOrders = () => {
  const navigate = useNavigate();
  const { clientUser, clientLoading } = useClientAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | active | done
  const prevOrdersRef = useRef([]);
  const isFirstLoad = useRef(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!clientLoading && !clientUser) {
      navigate("/login", { replace: true });
    }
  }, [clientLoading, clientUser, navigate]);

  // Live orders subscription
  useEffect(() => {
    if (!clientUser?.uid) return;

    const q = query(
      collection(db, "all_orders"),
      where("clientUid", "==", clientUser.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => {
          const aMs = a.createdAt?.toMillis?.() || 0;
          const bMs = b.createdAt?.toMillis?.() || 0;
          return bMs - aMs;
        });

        // Detect live status changes (not on first load)
        if (!isFirstLoad.current) {
          data.forEach((newOrder) => {
            const prev = prevOrdersRef.current.find((o) => o.id === newOrder.id);
            if (prev && prev.status !== newOrder.status) {
              // flash notification — could be enhanced with a toast library
              console.info(`Order ${newOrder.id} changed: ${prev.status} → ${newOrder.status}`);
            }
          });
        }
        isFirstLoad.current = false;
        prevOrdersRef.current = data;
        setOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error("MyOrders snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [clientUser?.uid]);

  const activeStatuses = ["pending", "confirmed", "preparing", "out_for_delivery", "pending_payment"];
  const doneStatuses   = ["delivered", "done", "rejected", "cancelled"];

  const filtered =
    filter === "active"
      ? orders.filter((o) => activeStatuses.includes(o.status))
      : filter === "done"
      ? orders.filter((o) => doneStatuses.includes(o.status))
      : orders;

  const activeCount = orders.filter((o) => activeStatuses.includes(o.status)).length;

  // ── Loading
  if (clientLoading || (loading && !clientUser)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full border-4 border-t-transparent"
          style={{ borderColor: "rgba(255,215,0,0.3)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!clientUser) return null;

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: "#0a0a0a" }}>
      {/* Background ambient blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, 40, 0], opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 9, repeat: Infinity }}
          className="absolute top-20 left-10 w-80 h-80 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #8B000050, transparent)" }}
        />
        <motion.div
          animate={{ y: [0, -40, 0], opacity: [0.06, 0.14, 0.06] }}
          transition={{ duration: 9, repeat: Infinity, delay: 3 }}
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #FFD70028, transparent)" }}
        />
      </div>

      <div className="max-w-2xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            ←
          </button>

          <div className="flex-1">
            <h1 className="text-2xl font-black text-white">أوردراتي 📦</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {orders.length === 0
                ? "مفيش طلبات لحد دلوقتي"
                : `${orders.length} طلب${activeCount > 0 ? ` · ${activeCount} نشط` : ""}`}
            </p>
          </div>

          {/* Live indicator */}
          {activeCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.3)" }}>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full"
                style={{ background: "#4CAF50" }}
              />
              <span className="text-xs font-semibold" style={{ color: "#4CAF50" }}>مباشر</span>
            </div>
          )}
        </motion.div>

        {/* ── Filter Tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex rounded-xl p-1 mb-6"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          {[
            { id: "all",    label: `الكل (${orders.length})` },
            { id: "active", label: `🔴 نشط (${activeCount})` },
            { id: "done",   label: `✅ منتهي (${orders.length - activeCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300"
              style={
                filter === tab.id
                  ? { background: "linear-gradient(135deg, #FFD700, #f0a500)", color: "#0a0a0a" }
                  : { color: "#6b7280" }
              }
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 rounded-full border-4 border-t-transparent"
              style={{ borderColor: "rgba(255,215,0,0.3)", borderTopColor: "#FFD700" }}
            />
            <p className="text-gray-500 text-sm">جاري تحميل الطلبات...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 rounded-2xl text-center"
            style={{ background: "rgba(14,14,14,0.97)", border: "1px solid rgba(255,215,0,0.08)" }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-7xl mb-5"
            >
              {filter === "active" ? "⏳" : filter === "done" ? "✅" : "📦"}
            </motion.div>
            <p className="text-white font-bold text-xl mb-2">
              {filter === "active"
                ? "مفيش طلبات نشطة دلوقتي"
                : filter === "done"
                ? "مفيش طلبات منتهية"
                : "مفيش طلبات لحد دلوقتي!"}
            </p>
            <p className="text-gray-500 text-sm mb-8">
              {filter === "all" ? "اطلب أول أكلة من القائمة 🍔" : ""}
            </p>
            {filter === "all" && (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255,215,0,0.3)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/menu")}
                className="px-8 py-3.5 rounded-xl font-black text-black"
                style={{ background: "linear-gradient(135deg, #FFD700, #f0a500)" }}
              >
                اطلب دلوقتي 🍔
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            layout
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <OrderCard order={order} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Order Again CTA ── */}
        {orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/menu")}
              className="px-8 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: "rgba(255,215,0,0.08)",
                border: "1px solid rgba(255,215,0,0.2)",
                color: "#FFD700",
              }}
            >
              🍔 اطلب تاني
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
