// src/pages/Checkout.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useClientBranch } from "../context/ClientBranchContext";
import { useClientAuth } from "../context/ClientAuthContext"; // ✅ جديد

const PAYMOB_API_KEY = process.env.REACT_APP_PAYMOB_API_KEY;
const WALLET_INTEGRATION_ID = process.env.REACT_APP_PAYMOB_WALLET_INTEGRATION_ID;
const CARD_INTEGRATION_ID = process.env.REACT_APP_PAYMOB_CARD_INTEGRATION_ID;
const CARD_IFRAME_ID = process.env.REACT_APP_PAYMOB_CARD_IFRAME_ID;
const WALLET_IFRAME_ID = process.env.REACT_APP_PAYMOB_WALLET_IFRAME_ID;

const Checkout = ({ cart = [], totalPrice = 0, onClearCart }) => {
  const navigate = useNavigate();
  const { selectedBranch } = useClientBranch();
  const { clientUser } = useClientAuth(); // ✅ جديد

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "", phone: "", address: "", notes: "",
  });

  // ✅ لو logged in، املي الـ form تلقائياً
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

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const buildOrderData = (extra = {}) => ({
    name: formData.name,
    phone: formData.phone,
    address: formData.address,
    notes: formData.notes,
    paymentMethod,
    branchId: selectedBranch?.id || "unknown",
    branchName: selectedBranch?.name || "غير محدد",
    clientUid: clientUser?.uid || null, // ✅ بيحفظ الـ uid لو logged in
    items: cart.map((i) => ({
      name: i.name,
      qty: i.qty,
      price_single: i.price_single,
      image: i.image || "",
    })),
    total: totalPrice,
    createdAt: serverTimestamp(),
    status: "pending",
    ...extra,
  });

  const saveOrder = async (extraData = {}) => {
    const orderData = buildOrderData(extraData);
    const branchId = selectedBranch?.id;
    if (!branchId) throw new Error("لم يتم اختيار الفرع!");
    await Promise.all([
      addDoc(collection(db, branchId, "orders", "data"), orderData),
      addDoc(collection(db, "all_orders"), orderData),
    ]);
  };

  const handlePaymob = async () => {
    setLoading(true);
    try {
      const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
      });
      const authData = await authRes.json();
      const token = authData.token;

      const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: token,
          delivery_needed: false,
          amount_cents: Math.round(totalPrice * 100),
          currency: "EGP",
          items: cart.map((i) => ({
            name: i.name,
            amount_cents: Math.round(i.price_single * 100),
            description: i.description || i.name,
            quantity: i.qty,
          })),
        }),
      });
      const orderData = await orderRes.json();
      const orderId = orderData.id;

      const nameParts = formData.name.split(" ");
      const paymentKeyRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: token,
          amount_cents: Math.round(totalPrice * 100),
          expiration: 3600,
          order_id: orderId,
          billing_data: {
            apartment: "NA", email: "customer@santafi.com", floor: "NA",
            first_name: nameParts[0] || formData.name,
            last_name: nameParts[1] || "Customer",
            street: formData.address, building: "NA",
            phone_number: formData.phone, shipping_method: "NA",
            postal_code: "NA", city: "Cairo", country: "EG", state: "Cairo",
          },
          currency: "EGP",
          integration_id: paymentMethod === "card" ? CARD_INTEGRATION_ID : WALLET_INTEGRATION_ID,
          lock_order_when_paid: false,
        }),
      });
      const paymentKeyData = await paymentKeyRes.json();
      const paymentKey = paymentKeyData.token;

      await saveOrder({ paymobOrderId: orderId });
      onClearCart();

      if (paymentMethod === "wallet") {
        window.location.href = `https://accept.paymob.com/api/acceptance/iframes/${WALLET_IFRAME_ID}?payment_token=${paymentKey}`;
      } else {
        window.location.href = `https://accept.paymob.com/api/acceptance/iframes/${CARD_IFRAME_ID}?payment_token=${paymentKey}`;
      }
    } catch (err) {
      console.error(err);
      alert("Payment failed. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === "card" || paymentMethod === "wallet") {
      await handlePaymob();
    } else {
      setLoading(true);
      try {
        await saveOrder();
        setStep(3);
        onClearCart();
      } catch (err) {
        console.error(err);
        alert("Failed to place order. Try again!");
      } finally {
        setLoading(false);
      }
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
                  {/* ✅ بيظهر إنه logged in */}
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
              <OrderSummary cart={cart} totalPrice={totalPrice} />
            </motion.div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="grid md:grid-cols-2 gap-8">
              <div className="glass p-8 rounded-2xl border border-orange-500/20 space-y-4">
                <h2 className="text-2xl font-bold text-orange-400 mb-6">💳 Payment Method</h2>
                {[
                  { id: "cod",      icon: "💵", label: "Cash on Delivery", desc: "Pay when your order arrives" },
                  { id: "vodafone", icon: "📱", label: "Vodafone Cash",     desc: "Send to: 01091873443" },
                  { id: "instapay", icon: "⚡", label: "InstaPay",          desc: "Send to: 01091873443" },
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
                          <p className="text-gray-300 text-sm">Transfer <span className="text-yellow-400 font-bold">{totalPrice.toFixed(2)} EGP</span> to:</p>
                        </div>
                        <div className="flex items-center gap-2 bg-dark-800/50 px-3 py-2 rounded-lg">
                          <span className="text-white font-black text-lg tracking-widest">01091873443</span>
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
                    {loading ? "Processing..." : (paymentMethod === "card" || paymentMethod === "wallet") ? "Pay Now 🔒" : "Place Order 🎉"}
                  </motion.button>
                </div>
              </div>
              <OrderSummary cart={cart} totalPrice={totalPrice} />
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
      </div>
    </div>
  );
};

const OrderSummary = ({ cart, totalPrice }) => (
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
      <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>{totalPrice.toFixed(2)} ج</span></div>
      <div className="flex justify-between text-gray-400"><span>Delivery</span><span className="text-green-400">Free 🎁</span></div>
      <div className="flex justify-between text-xl font-black mt-3">
        <span className="text-white">Total</span>
        <span className="gradient-text">{totalPrice.toFixed(2)} ج</span>
      </div>
    </div>
  </div>
);

export default Checkout;