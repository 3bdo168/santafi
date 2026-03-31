// src/context/BranchContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const BranchContext = createContext();

export const BranchProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const userDoc = await getDoc(doc(db, "admins", firebaseUser.uid));

        if (userDoc.exists()) {
          const data = userDoc.data();
          setCurrentUser(firebaseUser);
          setRole(data.role);
          setBranchId(data.branchId);
          localStorage.setItem("role", data.role);
          localStorage.setItem("branchId", data.branchId || "");
        } else {
          await signOut(auth);
          setCurrentUser(null);
          setRole(null);
          setBranchId(null);
          localStorage.clear();
        }
      } catch (err) {
        console.error("Firestore error:", err);
        // ✅ fallback على localStorage لو Firebase offline
        const cachedRole = localStorage.getItem("role");
        const cachedBranchId = localStorage.getItem("branchId");
        if (cachedRole) {
          setCurrentUser(firebaseUser);
          setRole(cachedRole);
          setBranchId(cachedBranchId || null);
        } else {
          setCurrentUser(null);
          setRole(null);
          setBranchId(null);
        }
      }
    } else {
      setCurrentUser(null);
      setRole(null);
      setBranchId(null);
      localStorage.removeItem("role");
      localStorage.removeItem("branchId");
    }

    setLoading(false);
  });

  return () => unsub();
}, []);
  const logout = async () => {
    await signOut(auth);
    localStorage.clear();
  };

  return (
    <BranchContext.Provider value={{ currentUser, role, branchId, loading, logout }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => useContext(BranchContext);