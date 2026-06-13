import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { BranchProvider } from "./context/BranchContext";
import { ClientBranchProvider, useClientBranch } from "./context/ClientBranchContext";
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
import ProductDetails from "./pages/ProductDetails";
import Login from "./pages/Login";
import Offers from "./pages/Offers";
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import CookieConsent from "./components/CookieConsent";

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const OwnerDashboard = lazy(() => import("./pages/OwnerDashboard"));
const WeeklyReports = lazy(() => import("./pages/WeeklyReports"));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const RequireBranch = ({ children }) => {
  const { selectedBranch } = useClientBranch();
  if (!selectedBranch) return <Navigate to="/branches" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <BranchProvider>
        <ClientBranchProvider>
          <ClientAuthProvider>
            <CartProvider>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/branches" element={<BranchSelector />} />
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

                  <Route
                    path="/owner/reports"
                    element={
                      <ProtectedRoute requiredRole="owner">
                        <WeeklyReports />
                      </ProtectedRoute>
                    }
                  />

                  <Route element={<ClientLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/menu" element={<Menu />} />
                    <Route path="/offers" element={<Offers />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  </Route>

                  <Route element={<RequireBranch><ClientLayout /></RequireBranch>}>
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/my-orders" element={<MyOrders />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/product/:id" element={<ProductDetails />} />
                  </Route>
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <CookieConsent />
              </Suspense>
            </CartProvider>
          </ClientAuthProvider>
        </ClientBranchProvider>
      </BranchProvider>
    </Router>
  );
}

export default App;
