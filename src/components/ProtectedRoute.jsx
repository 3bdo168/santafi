import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  if (user === undefined) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-orange-400 text-2xl">Loading...</div>
    </div>
  );

  return user ? children : <Navigate to="/admin" />;
};

export default ProtectedRoute;