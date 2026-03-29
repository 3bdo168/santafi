import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const CartSidebar = ({ cart, isOpen, onClose, onRemove, onUpdateQty, totalPrice }) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-dark-900 border-l border-orange-500/20 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-orange-500/20">
              <h2 className="text-2xl font-bold gradient-text">🛒 Your Cart</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ✕
              </motion.button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-xl">Your cart is empty</p>
                  <p className="text-sm mt-2">Add some delicious items!</p>
                </div>
              ) : (
                cart.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="flex items-center gap-4 glass p-4 rounded-xl border border-orange-500/20"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            {item.image && item.image.startsWith("http") ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl flex items-center justify-center w-full h-full">
                                {item.image || "🍔"}
                                </span>
                            )}
                            </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{item.name}</p>
                      <p className="text-orange-400 text-sm font-bold">
                        {(item.price_single * item.qty).toFixed(2)}
                      </p>
                    </div>
                    {/* Qty Controls */}
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onUpdateQty(item.id, item.qty - 1)}
                        className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 font-bold hover:bg-orange-500/40 transition-colors"
                      >
                        −
                      </motion.button>
                      <span className="text-white font-bold w-5 text-center">{item.qty}</span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onUpdateQty(item.id, item.qty + 1)}
                        className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 font-bold hover:bg-orange-500/40 transition-colors"
                      >
                        +
                      </motion.button>
                    </div>
                    {/* Remove */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onRemove(item.id)}
                      className="text-red-400 hover:text-red-300 transition-colors text-lg"
                    >
                      🗑️
                    </motion.button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-orange-500/20 space-y-4">
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-gray-300">Total:</span>
                  <span className="gradient-text">${totalPrice.toFixed(2)}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(249, 115, 22, 0.7)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { onClose(); navigate("/checkout"); }}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl text-lg shadow-neon"
                >
                  Checkout →
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;