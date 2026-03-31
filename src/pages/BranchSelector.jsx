// src/pages/BranchSelector.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useClientBranch, BRANCHES } from "../context/ClientBranchContext";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.13, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
};

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
  </svg>
);

export default function BranchSelector() {
  const navigate = useNavigate();
  const { setSelectedBranch } = useClientBranch();
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const handleSelect = (branch) => {
    if (selectedId) return;
    setSelectedId(branch.id);
    setSelectedBranch(branch);
    setTimeout(() => navigate("/menu"), 350);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #1c1c1c 100%)" }}
    >
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <motion.div
          className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl shadow-lg"
          style={{ background: "linear-gradient(135deg, #f97316, #c2410c)" }}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.08, type: "spring", stiffness: 200 }}
        >
          🍽️
        </motion.div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">اختار فرعك</h1>
        <p className="text-gray-500 text-sm">اختار أقرب فرع ليك واستمتع بالمنيو</p>
      </motion.div>

      <motion.ul
        className="w-full max-w-sm space-y-3 list-none p-0 m-0"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {BRANCHES.map((branch) => {
          const isHovered = hoveredId === branch.id;
          const isSelected = selectedId === branch.id;
          return (
            <motion.li key={branch.id} variants={itemVariants}>
              <motion.button
                onClick={() => handleSelect(branch)}
                onHoverStart={() => setHoveredId(branch.id)}
                onHoverEnd={() => setHoveredId(null)}
                className="w-full text-right rounded-2xl p-4 border focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                style={{
                  background: isSelected ? "rgba(249,115,22,0.12)" : isHovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)",
                  borderColor: isSelected ? "#f97316" : isHovered ? "rgba(249,115,22,0.35)" : "rgba(255,255,255,0.07)",
                  transition: "background 0.2s, border-color 0.2s",
                  cursor: selectedId && !isSelected ? "default" : "pointer",
                  opacity: selectedId && !isSelected ? 0.45 : 1,
                }}
                whileTap={!selectedId ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 space-y-1.5">
                    <p className="text-white font-bold text-base leading-tight">{branch.name}</p>
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                      <LocationIcon />
                      <span>{branch.area}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-500 text-xs">
                      <span className="flex items-center gap-1"><ClockIcon />{branch.hours}</span>
                      <span className="flex items-center gap-1"><PhoneIcon />{branch.phone}</span>
                    </div>
                  </div>
                  <motion.div
                    animate={{ x: isHovered && !selectedId ? -4 : 0 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      color: isSelected ? "#f97316" : isHovered ? "#fb923c" : "#4b5563",
                      flexShrink: 0,
                      transition: "color 0.2s",
                    }}
                  >
                    {isSelected ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <ArrowLeftIcon />
                    )}
                  </motion.div>
                </div>
              </motion.button>
            </motion.li>
          );
        })}
      </motion.ul>

      <motion.p
        className="text-gray-700 text-xs mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        santafe &copy; {new Date().getFullYear()}
      </motion.p>
    </div>
  );
}