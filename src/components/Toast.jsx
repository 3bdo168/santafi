import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Toast = ({ message, type = "success", duration = 3000 }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500",
  }[type];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-neon-lg flex items-center gap-3`}
        >
          <span className="text-lg">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
