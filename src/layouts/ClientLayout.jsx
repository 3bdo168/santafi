import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import CartSidebar from "../components/CartSidebar";
import { useCart } from "../context/CartContext";
import { useClientBranch } from "../context/ClientBranchContext";
import { getOffersPageConfig } from "../services/offersPageService";

const ClientLayout = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const { totalItems } = useCart();
  const { selectedBranch } = useClientBranch();
  const branchId = selectedBranch?.id || null;
  const [showOffersTab, setShowOffersTab] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!branchId) {
        setShowOffersTab(false);
        return;
      }
      try {
        const { enabled } = await getOffersPageConfig(branchId);
        setShowOffersTab(Boolean(enabled));
      } catch {
        setShowOffersTab(false);
      }
    };
    run();
  }, [branchId]);

  return (
    <div className="bg-dark-900 text-white min-h-screen">
      <Navbar totalItems={totalItems} onCartClick={() => setCartOpen(true)} showOffersTab={showOffersTab} />
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <Outlet />
    </div>
  );
};

export default ClientLayout;
