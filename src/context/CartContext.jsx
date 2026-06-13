import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

const stableStringify = (value) => {
  try {
    if (!value) return "";
    if (Array.isArray(value)) return JSON.stringify(value.map((v) => stableStringify(v)));
    if (typeof value !== "object") return JSON.stringify(value);
    const keys = Object.keys(value).sort();
    const obj = {};
    keys.forEach((k) => {
      obj[k] = value[k];
    });
    return JSON.stringify(obj);
  } catch {
    return "";
  }
};

const makeCartKey = (item) => {
  const base = item?.id || "";
  const sizeKey = item?.selectedSize || "single";
  const modifiersKey = stableStringify(item?.selectedModifiers || {});
  return `${base}::${sizeKey}::${modifiersKey}`;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    const safePrice = Number(item?.price_single) || 0;
    const key = makeCartKey(item);
    setCart((prev) => {
      const existing = prev.find((i) => i._cartKey === key);
      if (existing) {
        return prev.map((i) =>
          i._cartKey === key ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        { ...item, _cartKey: key, price_single: safePrice, qty: 1 },
      ];
    });
  };

  const removeFromCart = (cartKeyOrId) => {
    setCart((prev) => prev.filter((i) => i._cartKey !== cartKeyOrId && i.id !== cartKeyOrId));
  };

  const updateQty = (cartKeyOrId, qty) => {
    if (qty < 1) {
      removeFromCart(cartKeyOrId);
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i._cartKey === cartKeyOrId || i.id === cartKeyOrId
          ? { ...i, qty: Number(qty) || 1 }
          : i
      )
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    [cart]
  );

  const totalPrice = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + (Number(item.price_single) || 0) * (Number(item.qty) || 0),
        0
      ),
    [cart]
  );

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
