import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

const AnimatedCard3D = ({ children, intensity = 10 }) => {
  const ref = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * intensity;
    const rotateY = ((centerX - x) / centerX) * intensity;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: rotation.x,
        rotateY: rotation.y,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{
        perspective: 1000,
        transformStyle: "preserve-3d",
      }}
      className="relative"
    >
      {/* Light effect */}
      <motion.div
        animate={{
          backgroundPosition: `${rotation.y * 5}% ${rotation.x * 5}%`,
        }}
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-50 transition-opacity"
        style={{
          backgroundImage: `radial-gradient(circle at ${50 - rotation.y * 2}% ${
            50 - rotation.x * 2
          }%, rgba(249, 115, 22, 0.5), transparent)`,
        }}
      />
      {children}
    </motion.div>
  );
};

export default AnimatedCard3D;
