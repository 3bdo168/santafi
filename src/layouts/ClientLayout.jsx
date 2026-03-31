import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import CartSidebar from "../components/CartSidebar";
import { useCart } from "../context/CartContext";

const ClientLayout = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <div className="bg-dark-900 text-white min-h-screen">
      <Navbar totalItems={totalItems} onCartClick={() => setCartOpen(true)} />
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <Outlet />
    </div>
  );
};

export default ClientLayout;
