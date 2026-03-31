import React, { useState } from "react";
import { motion } from "framer-motion";
import { titleVariants, containerVariants, badgeVariants } from "../animations/motionVariants";
import { useNavigate } from "react-router-dom";
import { getDiscountedProductPrice } from "../utils/pricing";

const CategorySection = ({ category, items, onAddToCart }) => {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <section className="py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <motion.div
          variants={titleVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-5xl">{category.icon}</span>
            <h2 className="text-4xl md:text-5xl font-bold gradient-text">
              {category.name}
            </h2>
          </div>
          <div className="h-1 w-32 bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
        </motion.div>

        {/* Items Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {items.map((item) => (
            <CardItem
              key={item.id}
              item={item}
              onAddToCart={onAddToCart}
              isHovered={hoveredCard === item.id}
              onHover={(id) => setHoveredCard(id)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const CardItem = ({ item, onAddToCart, isHovered, onHover }) => {
  const navigate = useNavigate();
  const { getTransformStyle, handleMouseMove, handleMouseLeave, handleMouseEnter } = useCardTilt();

  // ✅ حدد الـ default size الأول المتاح
  const getDefaultSize = () => {
    if (item.price_single) return "S";
    if (item.price_double) return "D";
    if (item.price_triple) return "T";
    return "S";
  };

  const [selectedSize, setSelectedSize] = useState(getDefaultSize());

  // ✅ رجّع السعر بناءً على الـ size المختار
  const getSelectedPrice = () => {
    if (selectedSize === "D") return getDiscountedProductPrice(item, "double").discounted;
    if (selectedSize === "T") return getDiscountedProductPrice(item, "triple").discounted;
    return getDiscountedProductPrice(item, "single").discounted;
  };

  // ✅ ابعت للكارت بالـ size والسعر الصح
  const handleAddToCart = (e) => {
    e.stopPropagation();
    onAddToCart({
      ...item,
      selectedSize,
      price_single: getSelectedPrice(), // ده الـ price الى بيتحسب في CartSidebar
      id: `${item.id}_${selectedSize}`,  // unique id لكل size عشان يتعامل معاه كـ item منفصل
      name: `${item.name} (${selectedSize})`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -10 }}
      viewport={{ once: true }}
      onMouseEnter={() => { handleMouseEnter(); onHover(item.id); }}
      onMouseLeave={() => { handleMouseLeave(); onHover(null); }}
      onMouseMove={handleMouseMove}
      className="relative group cursor-pointer"
    >
      <div
        className="relative h-full rounded-2xl overflow-hidden glass backdrop-blur-xl transition-all duration-300"
        style={getTransformStyle()}
      >
        {/* Animated border glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Image Section */}
        <div
          onClick={() => navigate(`/product/${item.id}`)}
          className="h-40 bg-gradient-to-br from-dark-700 via-dark-800 to-dark-900 flex items-center justify-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 group-hover:via-orange-500/30 transition-all duration-500" />
          {item.image && item.image.startsWith("http") ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <motion.div
              initial={{ scale: 1, rotate: 0 }}
              animate={isHovered ? { scale: 1.3, rotate: 5 } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.3 }}
              className="text-5xl"
            >
              {item.image || "🍔"}
            </motion.div>
          )}
        </div>

        {/* NEW Badge */}
        {item.isNew && (
          <motion.div
            variants={badgeVariants}
            initial="hidden"
            animate="visible"
            className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-neon"
          >
            ⭐ NEW
          </motion.div>
        )}

        {/* Content */}
        <div className="p-4 bg-gradient-to-b from-dark-800/70 to-dark-900/80 backdrop-blur-md">
          {/* Name */}
          <h3
            onClick={() => navigate(`/product/${item.id}`)}
            className="text-lg font-bold text-white mb-2 group-hover:text-orange-300 transition-colors line-clamp-1 hover:underline"
          >
            {item.name}
          </h3>

          {/* Description */}
          <p className="text-xs md:text-sm text-gray-300 mb-3 line-clamp-2 group-hover:text-gray-100 transition-colors">
            {item.description}
          </p>

          {/* ✅ Pricing - بقت clickable وبتحدد الـ size */}
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {item.price_single && (
              <PriceTag
                label="S"
                pricing={getDiscountedProductPrice(item, "single")}
                isSelected={selectedSize === "S"}
                onClick={() => setSelectedSize("S")}
              />
            )}
            {item.price_double && (
              <PriceTag
                label="D"
                pricing={getDiscountedProductPrice(item, "double")}
                isSelected={selectedSize === "D"}
                onClick={() => setSelectedSize("D")}
              />
            )}
            {item.price_triple && (
              <PriceTag
                label="T"
                pricing={getDiscountedProductPrice(item, "triple")}
                isSelected={selectedSize === "T"}
                onClick={() => setSelectedSize("T")}
              />
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate(`/product/${item.id}`)}
              className="flex-1 border border-orange-500/40 text-orange-400 font-semibold py-2 px-3 rounded-lg hover:bg-orange-500/10 transition-all text-sm"
            >
              Details
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08, boxShadow: "0 0 30px rgba(249, 115, 22, 0.6)" }}
              whileTap={{ scale: 0.92 }}
              onClick={handleAddToCart}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2 px-3 rounded-lg transition-all duration-300 text-sm"
            >
              Add to Cart 🛒
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ✅ PriceTag بقت button بدل span - بتتحدد لما تضغط عليها
const PriceTag = ({ label, pricing, isSelected, onClick }) => (
  <motion.button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    className={`text-xs px-2 py-1 rounded-md border font-semibold transition-all duration-200 ${
      isSelected
        ? "bg-orange-500 text-white border-orange-400 shadow-neon scale-105"
        : "bg-orange-500/15 text-orange-300 border-orange-500/30 hover:bg-orange-500/30"
    }`}
  >
    <span>{label}: {pricing?.discounted?.toFixed?.(2) || "0.00"} ج</span>
    {pricing?.discountAmount > 0 && (
      <span className="ml-1 text-[10px] line-through opacity-80">
        {pricing.original.toFixed(2)}
      </span>
    )}
  </motion.button>
);

function useCardTilt() {
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = React.useState(false);

  const handleMouseMove = (e) => {
    if (!isHovering) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (e.clientY - centerY) / rect.height * 10;
    const y = (centerX - e.clientX) / rect.width * 10;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovering(false);
  };

  const handleMouseEnter = () => setIsHovering(true);

  const getTransformStyle = () => ({
    transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
    transition: isHovering ? "none" : "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
  });

  return { tilt, getTransformStyle, handleMouseMove, handleMouseLeave, handleMouseEnter };
}

export default React.memo(CategorySection);
