// src/context/BranchContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, hasRealFirebaseConfig } from "../firebase";

const BranchContext = createContext();
const UID_ACCESS_MAP = {
  bTOLBRFh8qMbDieX7s3ICTS8iBQ2: { role: "admin", branchId: "mansoura" },
  fhrYP1RF1hhYdVEWbcThd7pE4Ci1: { role: "admin", branchId: "mit_ghamr" },
  xF7ZYwiFJhY3LED8PTvgEvz2Pnr1: { role: "admin", branchId: "zagazig" },
  YgIH9e2ZW9RsLdoyH6kMwm7krAB2: { role: "owner", branchId: "" },
};

export const BranchProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasRealFirebaseConfig) {
      setLoading(false);
      return;
    }

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
            const fallbackAccess = UID_ACCESS_MAP[firebaseUser.uid];
            if (fallbackAccess) {
              setCurrentUser(firebaseUser);
              setRole(fallbackAccess.role);
              setBranchId(fallbackAccess.branchId || null);
              localStorage.setItem("role", fallbackAccess.role);
              localStorage.setItem("branchId", fallbackAccess.branchId || "");
            } else {
              await signOut(auth);
              setCurrentUser(null);
              setRole(null);
              setBranchId(null);
              localStorage.clear();
            }
          }
        } catch (err) {
          console.error("Firestore error:", err);
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