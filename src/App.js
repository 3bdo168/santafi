import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import CartSidebar from "./components/CartSidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import { BranchProvider } from "./context/BranchContext";
import { ClientBranchProvider } from "./context/ClientBranchContext";
import { ClientAuthProvider } from "./context/ClientAuthContext";
import BranchSelector from "./pages/BranchSelector";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import WeeklyReports from "./pages/WeeklyReports";
import ProductDetails from "./pages/ProductDetails";
import Login from "./pages/Login";
import "./styles/globals.css";
import Profile from "./pages/Profile";
import { CLIENT } from "./client.config";

function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing)
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      return [...prev, { ...item, qty: 1 }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (id) =>
    setCart((prev) => prev.filter((i) => i.id !== id));

  const updateQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty } : i))
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.price_single * i.qty, 0);

  return (
    <Router>
      <BranchProvider>
        <ClientBranchProvider>
          <ClientAuthProvider>
            <Routes>

              <Route path="/" element={<BranchSelector />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<AdminLogin />} />

              {CLIENT.branches.map((branch) => (
                <Route
                  key={branch}
                  path={`/admin/dashboard/${branch}`}
                  element={
                    <ProtectedRoute requiredRole="admin" requiredBranch={branch}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              ))}

              <Route
                path="/owner"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/owner/reports"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <WeeklyReports />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/*"
                element={
                  <div className="bg-dark-900 text-white min-h-screen">
                    <Navbar
                      totalItems={totalItems}
                      onCartClick={() => setCartOpen(true)}
                    />
                    <CartSidebar
                      cart={cart}
                      isOpen={cartOpen}
                      onClose={() => setCartOpen(false)}
                      onRemove={removeFromCart}
                      onUpdateQty={updateQty}
                      totalPrice={totalPrice}
                    />
                    <Routes>
                      <Route path="/home" element={<Home />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/menu" element={<Menu addToCart={addToCart} />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route
                        path="/checkout"
                        element={
                          <Checkout
                            cart={cart}
                            totalPrice={totalPrice}
                            onClearCart={clearCart}
                          />
                        }
                      />
                      <Route
                        path="/product/:id"
                        element={<ProductDetails addToCart={addToCart} />}
                      />
                    </Routes>
                  </div>
                }
              />

            </Routes>
          </ClientAuthProvider>
        </ClientBranchProvider>
      </BranchProvider>
    </Router>
  );
}

export default App;