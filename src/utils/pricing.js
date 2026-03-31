export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const getProductBasePrice = (product, sizeKey = "single") => {
  if (!product) return 0;
  if (sizeKey === "double") return Number(product.price_double) || 0;
  if (sizeKey === "triple") return Number(product.price_triple) || 0;
  return Number(product.price_single) || 0;
};

export const validateProductDiscount = (basePrice, discountType, discountValue) => {
  const value = Number(discountValue) || 0;
  if (!discountType || discountType === "none") return { ok: true, value: 0 };
  if (discountType === "percent") {
    if (value < 0 || value > 100) return { ok: false, message: "خصم النسبة لازم بين 0 و 100" };
    return { ok: true, value };
  }
  if (discountType === "fixed") {
    if (value < 0) return { ok: false, message: "الخصم الثابت لا يمكن يكون بالسالب" };
    if (value > Number(basePrice || 0)) return { ok: false, message: "الخصم الثابت أكبر من سعر المنتج" };
    return { ok: true, value };
  }
  return { ok: false, message: "نوع خصم غير صالح" };
};

export const applyProductDiscount = (basePrice, product) => {
  const original = Number(basePrice) || 0;
  if (!product?.discountActive) return { original, discounted: original, discountAmount: 0 };
  const type = product.discountType || "none";
  const rawValue = Number(product.discountValue) || 0;
  if (type === "none" || rawValue <= 0) {
    return { original, discounted: original, discountAmount: 0 };
  }
  const discountAmount =
    type === "percent" ? original * (clamp(rawValue, 0, 100) / 100) : Math.min(rawValue, original);
  const discounted = Math.max(0, original - discountAmount);
  return {
    original,
    discounted,
    discountAmount,
  };
};

export const getDiscountedProductPrice = (product, sizeKey = "single") => {
  const base = getProductBasePrice(product, sizeKey);
  return applyProductDiscount(base, product);
};

export const applyCouponDiscount = (subtotal, coupon) => {
  const safeSubtotal = Number(subtotal) || 0;
  if (!coupon || !coupon.active) {
    return { amount: 0, code: null, finalSubtotal: safeSubtotal };
  }
  if (coupon.expiresAt?.toMillis && coupon.expiresAt.toMillis() < Date.now()) {
    return { amount: 0, code: coupon.code, finalSubtotal: safeSubtotal, invalidReason: "expired" };
  }
  const minOrder = Number(coupon.minOrder) || 0;
  if (safeSubtotal < minOrder) {
    return { amount: 0, code: coupon.code, finalSubtotal: safeSubtotal, invalidReason: "minOrder" };
  }
  const value = Number(coupon.value) || 0;
  const amount = coupon.type === "percent"
    ? safeSubtotal * (clamp(value, 0, 100) / 100)
    : Math.min(value, safeSubtotal);
  const finalSubtotal = Math.max(0, safeSubtotal - amount);
  return { amount, code: coupon.code, finalSubtotal };
};

export const calculateCartSubtotal = (cart = []) =>
  cart.reduce((sum, item) => sum + (Number(item.price_single) || 0) * (Number(item.qty) || 0), 0);

export const calculateFinalTotals = ({ cart = [], coupon = null, deliveryFee = 0 }) => {
  const subtotal = calculateCartSubtotal(cart);
  const couponResult = applyCouponDiscount(subtotal, coupon);
  const shipping = Number(deliveryFee) || 0;
  const total = Math.max(0, couponResult.finalSubtotal + shipping);
  return {
    subtotal,
    couponDiscount: couponResult.amount || 0,
    deliveryFee: shipping,
    total,
  };
};
