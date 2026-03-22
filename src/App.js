import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import CartSidebar from "./components/CartSidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ProductDetails from "./pages/ProductDetails";
import "./styles/globals.css";

function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const updateQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i));
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.price_single * i.qty, 0);

  return (
    <Router>
      <Routes>
        {/* Admin Routes - no Navbar */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Public Routes - with Navbar */}
        <Route path="/*" element={
          <div className="bg-dark-900 text-white min-h-screen">
            <Navbar totalItems={totalItems} onCartClick={() => setCartOpen(true)} />
            <CartSidebar
              cart={cart}
              isOpen={cartOpen}
              onClose={() => setCartOpen(false)}
              onRemove={removeFromCart}
              onUpdateQty={updateQty}
              totalPrice={totalPrice}
            />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu addToCart={addToCart} />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/checkout" element={<Checkout cart={cart} totalPrice={totalPrice} onClearCart={clearCart} />} />
              <Route path="/product/:id" element={<ProductDetails addToCart={addToCart} />} />
            </Routes>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;