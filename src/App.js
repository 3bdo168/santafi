import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { BranchProvider } from "./context/BranchContext";
import { ClientBranchProvider } from "./context/ClientBranchContext";
import { ClientAuthProvider } from "./context/ClientAuthContext";
import { CartProvider } from "./context/CartContext";
import ClientLayout from "./layouts/ClientLayout";
import BranchSelector from "./pages/BranchSelector";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import WeeklyReports from "./pages/WeeklyReports"; // ✅ جديد
import ProductDetails from "./pages/ProductDetails";
import Login from "./pages/Login";
import "./styles/globals.css";
import Profile from "./pages/Profile";

function App() {
  return (
    <Router>
      <BranchProvider>
        <ClientBranchProvider>
          <ClientAuthProvider>
            <CartProvider>
              <Routes>

                <Route path="/" element={<BranchSelector />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<AdminLogin />} />

                <Route
                  path="/admin/dashboard/mansoura"
                  element={
                    <ProtectedRoute requiredRole="admin" requiredBranch="mansoura">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dashboard/mit_ghamr"
                  element={
                    <ProtectedRoute requiredRole="admin" requiredBranch="mit_ghamr">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dashboard/zagazig"
                  element={
                    <ProtectedRoute requiredRole="admin" requiredBranch="zagazig">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/owner"
                  element={
                    <ProtectedRoute requiredRole="owner">
                      <OwnerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* ✅ التقارير الأسبوعية — محمية بـ owner */}
                <Route
                  path="/owner/reports"
                  element={
                    <ProtectedRoute requiredRole="owner">
                      <WeeklyReports />
                    </ProtectedRoute>
                  }
                />

                <Route element={<ClientLayout />}>
                  <Route path="/home" element={<Home />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                </Route>
                <Route path="*" element={<Navigate to="/home" replace />} />

              </Routes>
            </CartProvider>
          </ClientAuthProvider>
        </ClientBranchProvider>
      </BranchProvider>
    </Router>
  );
}

export default App;
