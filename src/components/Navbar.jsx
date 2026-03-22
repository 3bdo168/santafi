import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Navbar = ({ totalItems = 0, onCartClick }) => {
  const [isOpen, setIsOpen] = useState(false);

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
            alt="Santafi"
            className="w-10 h-10 object-contain"
          />
          <span className="text-2xl font-bold gradient-text hidden sm:inline">Santafi</span>
                    </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/" label="Home" />
          <NavLink to="/menu" label="Menu" />
          <NavLink to="/about" label="About" />
          <NavLink to="/contact" label="Contact" />
        </div>

        {/* Cart Icon */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCartClick}
          className="relative"
        >
          <div className="text-2xl">🛒</div>
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

        {/* Mobile Menu Button */}
        <button className="md:hidden text-2xl" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-dark-800/80 backdrop-blur-xl border-t border-orange-500/20 p-4"
        >
          <NavLink to="/" label="Home" mobile />
          <NavLink to="/menu" label="Menu" mobile />
          <NavLink to="/about" label="About" mobile />
          <NavLink to="/contact" label="Contact" mobile />
        </motion.div>
      )}
    </motion.nav>
  );
};

const NavLink = ({ to, label, mobile = false }) => (
  <Link to={to}>
    <motion.div
      whileHover={{ color: "#dc2626" }}
      whileTap={{ scale: 0.95 }}
      className={`font-semibold text-gray-300 hover:text-orange-400 transition-colors ${
        mobile ? "block py-2" : ""
      }`}
    >
      {label}
    </motion.div>
  </Link>
);

export default Navbar;