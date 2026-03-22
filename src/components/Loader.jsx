import React from "react";
import { motion } from "framer-motion";

const Loader = () => {
  return (
    <div className="fixed inset-0 bg-dark-900 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center gap-8"
      >
        {/* Spinning Loader */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full"
        />

        {/* Animated Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-2xl font-bold gradient-text"
        >
          Loading...
        </motion.div>

        {/* Loading Dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [-8, 8, -8] }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                repeat: Infinity,
              }}
              className="w-3 h-3 bg-orange-500 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Loader;
