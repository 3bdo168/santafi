import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ImageCropperModal = ({ isOpen, src, onCancel, onSave }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 300, h: 300 });
  const [isProcessing, setIsProcessing] = useState(false);

  const imgRef = useRef(null);

  // Reset values when a new image is loaded
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsProcessing(false);
    }
  }, [isOpen, src]);

  if (!isOpen || !src) return null;

  const handleImageLoad = (e) => {
    const img = e.target;
    const ratio = img.naturalWidth / img.naturalHeight;
    const containerSize = 300;
    let w, h;
    if (ratio > 1) {
      // Landscape: height matches container, width stretches
      h = containerSize;
      w = containerSize * ratio;
    } else {
      // Portrait or Square: width matches container, height stretches
      w = containerSize;
      h = containerSize / ratio;
    }
    setImgSize({ w, h });
  };

  // Drag handlers for mouse
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Drag handlers for touch devices
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const newX = e.touches[0].clientX - dragStart.x;
    const newY = e.touches[0].clientY - dragStart.y;
    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Handle cropping with Canvas
  const handleSave = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const img = new Image();
    img.src = src;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 500;
        canvas.height = 500;
        const ctx = canvas.getContext("2d");

        // Clean background (White to avoid transparency issues in JPEGs)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 500, 500);

        // Center origin
        ctx.translate(250, 250);

        // Apply scale & zoom offsets
        const scaleRatio = 500 / 300;
        ctx.scale(zoom * scaleRatio, zoom * scaleRatio);

        // Apply translations
        ctx.translate(position.x, position.y);

        // Draw image centered at origin
        ctx.drawImage(img, -imgSize.w / 2, -imgSize.h / 2, imgSize.w, imgSize.h);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              onSave(blob);
            } else {
              alert("فشل في معالجة الصورة!");
              setIsProcessing(false);
            }
          },
          "image/jpeg",
          0.92
        );
      } catch (err) {
        console.error("Canvas crop error:", err);
        alert("حدث خطأ أثناء تعديل الصورة!");
        setIsProcessing(false);
      }
    };
    img.onerror = () => {
      alert("فشل في تحميل الصورة المصدر!");
      setIsProcessing(false);
    };
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border"
          style={{
            background: "#0f0f0f",
            borderColor: "rgba(255, 215, 0, 0.15)",
            boxShadow: "0 0 40px rgba(255, 215, 0, 0.05)",
          }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-white font-bold text-lg">تعديل وقص الصورة</h3>
            <span className="text-gray-500 text-xs">اسحب للتحريك · زوم للتعديل</span>
          </div>

          {/* Cropping Area */}
          <div className="flex justify-center py-6 bg-black/40">
            <div
              className="relative rounded-xl overflow-hidden cursor-move select-none border border-orange-500/20"
              style={{
                width: 300,
                height: 300,
                boxShadow: "inset 0 0 20px rgba(0,0,0,0.8)",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                ref={imgRef}
                src={src}
                alt="cropper source"
                onLoad={handleImageLoad}
                style={{
                  width: `${imgSize.w}px`,
                  height: `${imgSize.h}px`,
                  transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transformOrigin: "center center",
                  userSelect: "none",
                  pointerEvents: "none",
                  maxWidth: "none",
                  maxHeight: "none",
                }}
              />
              {/* Highlight Grid / Boundary indicator */}
              <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-yellow-500/30 rounded-xl" />
            </div>
          </div>

          {/* Controls */}
          <div className="px-6 py-5 space-y-4">
            {/* Zoom Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-400">
                <span>تعديل التكبير (Zoom)</span>
                <span className="text-yellow-400 font-bold">{zoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-yellow-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={isProcessing}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {isProcessing ? "⏳ معالجة..." : "حفظ وقص الصورة ✅"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                disabled={isProcessing}
                className="py-3 px-5 border border-white/10 text-gray-400 font-semibold rounded-xl text-sm transition-all hover:bg-white/5 hover:text-white"
              >
                إلغاء
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ImageCropperModal;
