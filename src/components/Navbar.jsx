import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useClientAuth } from "../context/authContext";
import { useLanguage } from "../context/LanguageContext";

const Navbar = ({ totalItems = 0, onCartClick, showOffersTab = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { clientUser, logout } = useClientAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate("/home");
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 glass backdrop-blur-xl border-b border-orange-500/20"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img
              src="https://res.cloudinary.com/dkgiwnpfi/image/upload/v1774112719/Screenshot_2026-03-21_184621-removebg-preview_zzpxcw.png"
              alt="santafe"
              className="w-10 h-10 object-contain"
            />
            <span className="text-2xl font-bold gradient-text hidden sm:inline">santafe</span>
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/home" label={t.nav.home} />
          <NavLink to="/menu" label={t.nav.menu} />
          {showOffersTab && <NavLink to="/offers" label={<>{t.nav.offers} <span style={{ WebkitTextFillColor: 'initial', color: 'initial' }}>🔥</span></>} />}
          <NavLink to="/about" label={t.nav.about} />
          <NavLink to="/contact" label={t.nav.contact} />
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <Link to="/branches" state={{ from: location }} className="hidden sm:inline-flex">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-2 rounded-xl text-xs font-bold text-orange-200 border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/15"
            >
              {t.nav.changeBranch}
            </motion.button>
          </Link>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={toggleLanguage}
            className="hidden md:flex items-center overflow-hidden rounded-full border border-orange-500/40 bg-black/30 p-0.5 text-xs font-black"
            aria-label="Toggle language"
          >
            <span className={`px-2.5 py-1 rounded-full transition-all ${language === "ar" ? "bg-orange-500 text-black" : "text-gray-400"}`}>AR</span>
            <span className={`px-2.5 py-1 rounded-full transition-all ${language === "en" ? "bg-orange-500 text-black" : "text-gray-400"}`}>EN</span>
          </motion.button>

          {/* Cart Icon */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCartClick}
            className="relative"
          >
            <div className="text-2xl" style={{ WebkitTextFillColor: 'initial', color: 'initial' }}>🛒</div>
            {totalItems > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
              >
                {totalItems}
              </motion.div>
            )}
          </motion.button>


          <div className="hidden sm:block">
            {clientUser ? (

              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
                  style={{ border: "1px solid rgba(255,215,0,0.25)", background: "rgba(255,215,0,0.07)" }}
                >
                  {/* Avatar */}
                  {clientUser.photoURL ? (
                    <img
                      src={clientUser.photoURL}
                      alt="avatar"
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-black"
                      style={{ background: "linear-gradient(135deg, #FFD700, #f0a500)" }}
                    >
                      {(clientUser.name || clientUser.displayName || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold hidden sm:inline" style={{ color: "#FFD700" }}>
                    {(clientUser.name || clientUser.displayName || "User").split(" ")[0]}
                  </span>
                  <span className="text-gray-400 text-xs">{dropdownOpen ? "▲" : "▼"}</span>
                </motion.button>


                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 w-44 rounded-2xl overflow-hidden"
                      style={{
                        background: "rgba(15,15,15,0.98)",
                        border: "1px solid rgba(255,215,0,0.15)",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                      }}
                    >
                      <Link to="/profile" onClick={() => setDropdownOpen(false)}>
                        <motion.div
                          whileHover={{ background: "rgba(255,215,0,0.08)" }}
                          className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 cursor-pointer transition-all"
                        >
                          <span style={{ WebkitTextFillColor: 'initial', color: 'initial' }}>👤</span>
                          <span>{t.nav.profile}</span>
                        </motion.div>
                      </Link>
                      <div className="h-px mx-3" style={{ background: "rgba(255,255,255,0.06)" }} />
                      <Link to="/my-orders" onClick={() => setDropdownOpen(false)}>
                        <motion.div
                          whileHover={{ background: "rgba(255,215,0,0.08)" }}
                          className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 cursor-pointer transition-all"
                        >
                          <span style={{ WebkitTextFillColor: 'initial', color: 'initial' }}>📦</span>
                          <span>{t.nav.orders}</span>
                        </motion.div>
                      </Link>
                      <div className="h-px mx-3" style={{ background: "rgba(255,255,255,0.06)" }} />
                      <motion.div
                        whileHover={{ background: "rgba(139,0,0,0.15)" }}
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-3 text-sm cursor-pointer transition-all"
                        style={{ color: "#ff6b6b" }}
                      >
                        <span style={{ WebkitTextFillColor: 'initial', color: 'initial' }}>🚪</span>
                        <span>{t.nav.logout}</span>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (

              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,215,0,0.25)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: "linear-gradient(135deg, #FFD700, #f0a500)",
                    color: "#0a0a0a",
                  }}
                >
                  {t.nav.login} <span style={{ WebkitTextFillColor: 'initial', color: 'initial' }}>👤</span>
                </motion.button>
              </Link>
            )}
          </div>

          <button className="md:hidden text-2xl" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-dark-800/80 backdrop-blur-xl border-t border-orange-500/20 p-4"
          >
            <NavLink to="/home" label={t.nav.home} mobile />
            <NavLink to="/menu" label={t.nav.menu} mobile />
            {showOffersTab && <NavLink to="/offers" label={<>{t.nav.offers} <span style={{ WebkitTextFillColor: 'initial', color: 'initial' }}>🔥</span></>} mobile />}
            <NavLink to="/about" label={t.nav.about} mobile />
            <NavLink to="/contact" label={t.nav.contact} mobile />
            <Link to="/branches" state={{ from: location }} onClick={() => setIsOpen(false)}>
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="block py-2 font-semibold text-orange-300"
              >
                {t.nav.changeBranch}
              </motion.div>
            </Link>
            {clientUser ? (
              <>
                <NavLink to="/profile" label={<><span style={{ WebkitTextFillColor: 'initial', color: 'initial' }}>👤</span> {t.nav.profile}</>} mobile />
                <NavLink to="/my-orders" label={<><span style={{ WebkitTextFillColor: 'initial', color: 'initial' }}>📦</span> {t.nav.orders}</>} mobile />
                <motion.div
                  onClick={handleLogout}
                  whileTap={{ scale: 0.95 }}
                  className="block py-2 font-semibold cursor-pointer"
                  style={{ color: "#ff6b6b" }}
                >
                  <span style={{ WebkitTextFillColor: 'initial', color: 'initial' }}>🚪</span> {t.nav.logout}
                </motion.div>
              </>
            ) : (
              <NavLink to="/login" label={<><span style={{ WebkitTextFillColor: 'initial', color: 'initial' }}>👤</span> {t.nav.login}</>} mobile />
            )}

            {/* Language Switcher in Mobile Drawer */}
            <div className="border-t border-orange-500/20 mt-4 pt-4 flex items-center justify-between">
              <span className="text-gray-300 font-semibold">{language === "ar" ? "اللغة" : "Language"}</span>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={toggleLanguage}
                className="flex items-center overflow-hidden rounded-full border border-orange-500/40 bg-black/30 p-0.5 text-xs font-black"
                aria-label="Toggle language"
              >
                <span className={`px-2.5 py-1 rounded-full transition-all ${language === "ar" ? "bg-orange-500 text-black" : "text-gray-400"}`}>AR</span>
                <span className={`px-2.5 py-1 rounded-full transition-all ${language === "en" ? "bg-orange-500 text-black" : "text-gray-400"}`}>EN</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

const NavLink = ({ to, label, mobile = false }) => (
  <Link to={to}>
    <motion.div
      whileHover={{ color: "#dc2626" }}
      whileTap={{ scale: 0.95 }}
      className={`font-semibold text-gray-300 hover:text-orange-400 transition-colors ${mobile ? "block py-2" : ""
        }`}
    >
      {label}
    </motion.div>
  </Link>
);

export default Navbar;
