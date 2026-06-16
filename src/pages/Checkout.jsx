// src/pages/Checkout.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  collection, getDocs, getDoc, serverTimestamp,
  doc, increment, runTransaction
} from "firebase/firestore";
import { db } from "../firebase";
import { useClientBranch } from "../context/ClientBranchContext";
import { useClientAuth } from "../context/authContext";
import { useCart } from "../context/CartContext";
import { calculateCartSubtotal, calculateFinalTotals } from "../utils/pricing";
import RecommendationsPopup from "../components/RecommendationsPopup";

const MANUAL_PAYMENT_PHONE = import.meta.env.VITE_MANUAL_PAYMENT_PHONE || "01091873443";
const FREE_DELIVERY_THRESHOLD = Number(import.meta.env.VITE_FREE_DELIVERY_THRESHOLD || 0);

const Checkout = () => {
  const navigate = useNavigate();
  const { selectedBranch } = useClientBranch();
  const { clientUser } = useClientAuth();
  const { cart, clearCart, addToCart } = useCart();

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [availableZones, setAvailableZones] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [formData, setFormData] = useState({
    name: "", phone: "", address: "", notes: "",
  });

  const selectedZone = availableZones.find((z) => z.id === selectedZoneId) || null;
  const subtotalForThreshold = calculateCartSubtotal(cart);
  const effectiveDeliveryFee =
    FREE_DELIVERY_THRESHOLD > 0 && subtotalForThreshold >= FREE_DELIVERY_THRESHOLD
      ? 0
      : (selectedZone?.fee || 0);

  const totals = calculateFinalTotals({
    cart,
    coupon: appliedCoupon,
    deliveryFee: effectiveDeliveryFee,
  });

  useEffect(() => {
    if (clientUser) {
      setFormData((prev) => ({
        ...prev,
        name: clientUser.name || clientUser.displayName || "",
        phone: clientUser.phone || "",
        address: clientUser.address || "",
      }));
    }
  }, [clientUser]);

  useEffect(() => {
    const loadCommerceConfigs = async () => {
      if (!selectedBranch?.id) return;
      try {
        const [branchCoupons, branchZonesSnap] = await Promise.all([
          getDocs(collection(db, selectedBranch.id, "discountCoupons", "data")),
          getDoc(doc(db, selectedBranch.id, "deliveryZones")),
        ]);

        const couponMap = {};
        branchCoupons.docs.forEach((d) => {
          const coupon = { id: d.id, ...d.data() };
          couponMap[(coupon.code || d.id).toUpperCase()] = coupon;
        });
        setAvailableCoupons(Object.values(couponMap));

        const zonesData = branchZonesSnap.exists() ? branchZonesSnap.data() : {};
        const zones = Object.entries(zonesData)
          .filter(([, zone]) => zone && typeof zone === "object" && ("name" in zone || "fee" in zone))
          .map(([id, zone]) => ({ id, ...zone }))
          .filter((z) => z.active !== false);
        setAvailableZones(zones);
        if (zones.length > 0) {
          setSelectedZoneId((prev) => prev || zones[0].id);
        }
      } catch (err) {
        console.error("Failed loading coupons/zones", err);
      }
    };
    loadCommerceConfigs();
  }, [selectedBranch?.id]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateCouponForCheckout = (coupon) => {
    if (!coupon || coupon.active === false) return "الكوبون غير صالح";

    if (coupon.ownerUid && coupon.ownerUid !== clientUser?.uid) {
      return "الكوبون غير صالح لهذا الحساب";
    }

    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) return "الكوبون لم يبدأ بعد";
    if (coupon.endDate && new Date(coupon.endDate) < now) return "الكوبون منتهي الصلاحية";
    if (coupon.expiresAt?.toMillis && coupon.expiresAt.toMillis() < Date.now()) return "الكوبون منتهي";
    if (coupon.usageLimit && Number(coupon.usageCount || 0) >= Number(coupon.usageLimit)) return "الكوبون استُنفد";
    if (subtotalForThreshold < Number(coupon.minOrder || 0)) {
      return `الحد الأدنى للكوبون ${Number(coupon.minOrder || 0).toFixed(2)} ج`;
    }

    return "";
  };

  const applyCoupon = () => {
    setCouponError("");
    if (!couponCode.trim()) {
      setAppliedCoupon(null);
      return;
    }
    const normalized = couponCode.trim().toUpperCase();
    const found = availableCoupons.find(
      (coupon) => (coupon.code || "").toUpperCase() === normalized
    );

    const validationError = validateCouponForCheckout(found);
    if (validationError) {
      setAppliedCoupon(null);
      setCouponError(validationError);
      return;
    }

    setAppliedCoupon(found);
  };

  const buildOrderData = (extra = {}, totalsOverride = totals, couponOverride = appliedCoupon) => ({
    name: formData.name,
    phone: formData.phone,
    address: formData.address,
    notes: formData.notes,
    paymentMethod,
    branchId: selectedBranch?.id || "unknown",
    branchName: selectedBranch?.name || "غير محدد",
    clientUid: clientUser?.uid || null,
    items: cart.map((i) => ({
      name: i.name,
      qty: i.qty,
      price_single: i.price_single,
      image: i.image || "",
    })),
    subtotal: totalsOverride.subtotal,
    couponCode: couponOverride?.code || null,
    couponDiscount: totalsOverride.couponDiscount || 0,
    deliveryZoneId: selectedZone?.id || null,
    deliveryZoneName: selectedZone?.name || null,
    deliveryFee: totalsOverride.deliveryFee || 0,
    originalDeliveryFee: Number(selectedZone?.fee || 0),
    freeDeliveryApplied: (FREE_DELIVERY_THRESHOLD > 0 && subtotalForThreshold >= FREE_DELIVERY_THRESHOLD) || couponOverride?.type === "free_delivery",
    total: totalsOverride.total,
    createdAt: serverTimestamp(),
    status: "pending",
    ...extra,
  });

  const saveOrder = async (extraData = {}) => {
    const branchId = selectedBranch?.id;
    if (!branchId) throw new Error("لم يتم اختيار الفرع!");

    const newOrderRef = doc(collection(db, branchId, "orders", "data"));
    const sharedId = newOrderRef.id;
    const couponRef = appliedCoupon?.code
      ? doc(db, branchId, "discountCoupons", "data", appliedCoupon.code)
      : null;

    await runTransaction(db, async (transaction) => {
      let couponForOrder = appliedCoupon;
      let totalsForOrder = totals;

      if (couponRef) {
        const couponSnap = await transaction.get(couponRef);
        if (!couponSnap.exists()) throw new Error("الكوبون غير صالح");

        couponForOrder = { id: couponSnap.id, ...couponSnap.data() };
        const validationError = validateCouponForCheckout(couponForOrder);
        if (validationError) throw new Error(validationError);
        totalsForOrder = calculateFinalTotals({
          cart,
          coupon: couponForOrder,
          deliveryFee: effectiveDeliveryFee,
        });
      }

      const orderData = buildOrderData({ ...extraData, orderId: sharedId }, totalsForOrder, couponForOrder);
      transaction.set(newOrderRef, orderData);
      transaction.set(doc(db, "all_orders", sharedId), orderData);
      if (couponRef) {
        transaction.update(couponRef, { usageCount: increment(1), updatedAt: serverTimestamp() });
      }
    });

    return sharedId;
  };

  const handlePlaceOrder = async () => {
    if (!clientUser?.uid) {
      alert("لازم تسجل دخول الأول عشان تقدر تتابع أوردراتك.");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      await saveOrder();
      setStep(3);
      clearCart();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to place order. Try again!");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedBranch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <p className="text-xl text-gray-400 mb-6">لم يتم اختيار الفرع!</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl"
          >اختار الفرع</motion.button>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-xl text-gray-400 mb-6">Your cart is empty!</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/menu")}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl"
          >Go to Menu</motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black gradient-text mb-2">Checkout</h1>
          <p className="text-gray-500 text-sm mb-6">🏪 {selectedBranch.name}</p>
          {step !== 3 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              {["Delivery Info", "Payment", "Confirm"].map((label, i) => (
                <React.Fragment key={i}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      step >= i + 1 ? "bg-gradient-to-r from-orange-500 to-red-500 text-white" : "bg-dark-700 text-gray-500"
                    }`}>{i + 1}</div>
                    <span className={`text-sm font-semibold hidden sm:inline ${step >= i + 1 ? "text-orange-400" : "text-gray-500"}`}>{label}</span>
                  </div>
                  {i < 2 && <div className={`w-12 h-0.5 ${step > i + 1 ? "bg-orange-500" : "bg-dark-700"}`} />}
                </React.Fragment>
              ))}
            </div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">

          {/* Step 1 */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="grid md:grid-cols-2 gap-8">
              <div className="glass p-8 rounded-2xl border border-orange-500/20 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-orange-400">📦 Delivery Details</h2>
                  {clientUser && (
                    <span className="text-xs px-3 py-1 rounded-full font-semibold"
                      style={{ background: "rgba(255,215,0,0.1)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.2)" }}>
                      ✓ بياناتك اتملت تلقائياً
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ahmed Mohamed"
                    className="w-full px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="01xxxxxxxxx"
                    className="w-full px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Delivery Address</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Street, Building, Floor, Apartment..." rows={3}
                    className="w-full px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white transition-all resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Delivery Zone</label>
                  <select value={selectedZoneId} onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white transition-all"
                  >
                    {availableZones.length === 0 ? (
                      <option value="">No delivery zones yet</option>
                    ) : (
                      availableZones.map((zone) => (
                        <option key={zone.id} value={zone.id}>{zone.name} - {Number(zone.fee || 0).toFixed(2)} ج</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Notes (Optional)</label>
                  <input type="text" name="notes" value={formData.notes} onChange={handleChange} placeholder="Any special requests?"
                    className="w-full px-4 py-3 bg-dark-800/50 border border-orange-500/30 rounded-lg focus:outline-none focus:border-orange-500 text-white transition-all" />
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(2)}
                  disabled={!formData.name || !formData.phone || !formData.address}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >Next: Payment →</motion.button>
              </div>
              <OrderSummary cart={cart} totals={totals} selectedZone={selectedZone} />
            </motion.div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="grid md:grid-cols-2 gap-8">
              <div className="glass p-8 rounded-2xl border border-orange-500/20 space-y-4">
                <h2 className="text-2xl font-bold text-orange-400 mb-6">💳 Payment Method</h2>
                <div className="p-4 rounded-xl border border-orange-500/30 bg-dark-800/40">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Coupon code"
                      className="flex-1 px-4 py-3 bg-dark-900 border border-orange-500/30 rounded-lg text-white"
                    />
                    <button onClick={applyCoupon} className="px-4 py-3 bg-orange-500 text-white rounded-lg font-bold">
                      Apply
                    </button>
                  </div>
                  {appliedCoupon && <p className="text-green-400 text-sm mt-2">✅ Coupon applied: {appliedCoupon.code}</p>}
                  {couponError && <p className="text-red-400 text-sm mt-2">❌ {couponError}</p>}
                </div>
                {[
                  { id: "cod",      icon: "💵", label: "Cash on Delivery", desc: "Pay when your order arrives" },
                  { id: "vodafone", icon: "📱", label: "Vodafone Cash",     desc: `Send to: ${MANUAL_PAYMENT_PHONE}` },
                  { id: "instapay", icon: "⚡", label: "InstaPay",          desc: `Send to: ${MANUAL_PAYMENT_PHONE}` },
                ].map((method) => (
                  <motion.div key={method.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === method.id ? "border-orange-500 bg-orange-500/10" : "border-orange-500/20 hover:border-orange-500/50"
                    }`}
                  >
                    <div className="text-2xl">{method.icon}</div>
                    <div className="flex-1">
                      <p className="font-bold text-white text-sm">{method.label}</p>
                      <p className="text-xs text-gray-400">{method.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 transition-all flex-shrink-0 ${
                      paymentMethod === method.id ? "border-orange-500 bg-orange-500" : "border-gray-500"
                    }`} />
                  </motion.div>
                ))}

                <AnimatePresence>
                  {(paymentMethod === "vodafone" || paymentMethod === "instapay") && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 overflow-hidden"
                    >
                      <p className="text-yellow-400 font-bold text-sm mb-3">
                        {paymentMethod === "vodafone" ? "📱 Vodafone Cash Instructions" : "⚡ InstaPay Instructions"}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-orange-400 font-bold text-xs bg-orange-500/20 px-2 py-0.5 rounded-full">1</span>
                          <p className="text-gray-300 text-sm">Transfer <span className="text-yellow-400 font-bold">{totals.total.toFixed(2)} EGP</span> to:</p>
                        </div>
                        <div className="flex items-center gap-2 bg-dark-800/50 px-3 py-2 rounded-lg">
                          <span className="text-white font-black text-lg tracking-widest">{MANUAL_PAYMENT_PHONE}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-orange-400 font-bold text-xs bg-orange-500/20 px-2 py-0.5 rounded-full">2</span>
                          <p className="text-gray-300 text-sm">Click "Place Order" and we'll confirm after verifying</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3 mt-6">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 border-2 border-orange-500/30 text-orange-400 font-bold rounded-xl hover:border-orange-500/60 transition-all"
                  >← Back</motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handlePlaceOrder}
                    disabled={!paymentMethod || loading}
                    className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Processing..." : "Place Order 🎉"}
                  </motion.button>
                </div>
              </div>
              <OrderSummary cart={cart} totals={totals} selectedZone={selectedZone} />
            </motion.div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="text-8xl mb-8">🎉</motion.div>
              <h2 className="text-4xl font-black gradient-text mb-4">Order Placed!</h2>
              <p className="text-gray-300 text-xl mb-2">Thank you for your order!</p>
              <p className="text-gray-400 text-sm mb-2">🏪 {selectedBranch.name}</p>
              <p className="text-gray-400 mb-10">We'll contact you soon to confirm delivery.</p>
              <div className="flex gap-4 justify-center">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/menu")}
                  className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl text-lg"
                >Order More 🍔</motion.button>
                {clientUser && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/profile")}
                    className="px-8 py-4 font-bold rounded-xl text-lg"
                    style={{ border: "2px solid rgba(255,215,0,0.3)", color: "#FFD700" }}
                  >شوف أوردراتي 👤</motion.button>
                )}
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/")}
                  className="px-8 py-4 border-2 border-orange-500/30 text-orange-400 font-bold rounded-xl text-lg hover:border-orange-500/60 transition-all"
                >Go Home</motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {step !== 3 && cart.length > 0 && (
          <RecommendationsPopup
            branchId={selectedBranch?.id}
            cart={cart}
            onAddToCart={addToCart}
          />
        )}
      </div>
    </div>
  );
};

const OrderSummary = ({ cart, totals, selectedZone }) => (
  <div className="glass p-8 rounded-2xl border border-orange-500/20 h-fit">
    <h3 className="text-xl font-bold text-orange-400 mb-6">🧾 Order Summary</h3>
    <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
      {cart.map((item) => (
        <div key={item.id} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
            {item.image && item.image.startsWith("http") ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl flex items-center justify-center w-full h-full">{item.image || "🍔"}</span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">{item.name}</p>
            <p className="text-gray-400 text-xs">x{item.qty}</p>
          </div>
          <span className="text-orange-400 font-bold text-sm">{(item.price_single * item.qty).toFixed(2)} ج</span>
        </div>
      ))}
    </div>
    <div className="border-t border-orange-500/20 pt-4 space-y-2">
      <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>{totals.subtotal.toFixed(2)} ج</span></div>
      {totals.couponDiscount > 0 && (
        <div className="flex justify-between text-gray-400"><span>Coupon</span><span className="text-green-400">- {totals.couponDiscount.toFixed(2)} ج</span></div>
      )}
      {totals.deliveryDiscount > 0 && (
        <div className="flex justify-between text-gray-400"><span>Delivery Coupon</span><span className="text-green-400">- {totals.deliveryDiscount.toFixed(2)} ج</span></div>
      )}
      <div className="flex justify-between text-gray-400"><span>Delivery {selectedZone ? `(${selectedZone.name})` : ""}</span><span>{totals.deliveryFee.toFixed(2)} ج</span></div>
      {FREE_DELIVERY_THRESHOLD > 0 && (
        <div className="mt-3 p-3 rounded-xl border border-orange-500/20 bg-dark-800/30">
          {totals.subtotal >= FREE_DELIVERY_THRESHOLD ? (
            <p className="text-green-400 font-bold text-sm">✅ توصيل مجاني اتفعل</p>
          ) : (
            <p className="text-gray-300 text-sm font-semibold">
              ضيف{" "}
              <span className="text-orange-400 font-black">
                {(FREE_DELIVERY_THRESHOLD - totals.subtotal).toFixed(2)} ج
              </span>{" "}
              عشان التوصيل يبقى مجاني
            </p>
          )}
          <div className="mt-2 w-full bg-dark-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-orange-500 to-red-500"
              style={{
                width: `${Math.min(100, (totals.subtotal / (FREE_DELIVERY_THRESHOLD || 1)) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
      <div className="flex justify-between text-xl font-black mt-3">
        <span className="text-white">Total</span>
        <span className="gradient-text">{totals.total.toFixed(2)} ج</span>
      </div>
    </div>
  </div>
);

export default Checkout;
