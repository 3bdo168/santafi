import { useState, useEffect } from "react";

export const useTilt3D = () => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e) => {
    if (!isHovering) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const centerX = rect.left + width / 2;
    const centerY = rect.top + height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const rotateX = (mouseY / height) * 10;
    const rotateY = (mouseX / width) * -10;

    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovering(false);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const getTransformStyle = () => ({
    transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
    transition: isHovering ? "none" : "transform 0.6s cubic-bezier(0.23, 1, 0.320, 1)",
  });

  return {
    tilt,
    getTransformStyle,
    handleMouseMove,
    handleMouseLeave,
    handleMouseEnter,
  };
};
