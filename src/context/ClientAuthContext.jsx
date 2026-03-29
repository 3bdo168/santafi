import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

const ClientAuthContext = createContext();

export const useClientAuth = () => useContext(ClientAuthContext);

const googleProvider = new GoogleAuthProvider();

export const ClientAuthProvider = ({ children }) => {
  const [clientUser, setClientUser] = useState(null);
  const [clientLoading, setClientLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // ✅ جيب بيانات العميل من Firestore
        const docRef = doc(db, "clients", user.uid);
        const docSnap = await getDoc(docRef);
        setClientUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          ...(docSnap.exists() ? docSnap.data() : {}),
        });
      } else {
        setClientUser(null);
      }
      setClientLoading(false);
    });
    return () => unsub();
  }, []);

  // ✅ Register بـ Email
  const registerWithEmail = async (name, email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });

    // ✅ احفظ في Firestore
    await setDoc(doc(db, "clients", result.user.uid), {
      name,
      email,
      phone: "",
      address: "",
      createdAt: serverTimestamp(),
    });

    return result;
  };

  // ✅ Login بـ Email
  const loginWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  // ✅ Login بـ Google
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const docRef = doc(db, "clients", result.user.uid);
    const docSnap = await getDoc(docRef);

    // ✅ لو أول مرة يسجل بـ Google، اعمله document في Firestore
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        name: result.user.displayName,
        email: result.user.email,
        phone: "",
        address: "",
        createdAt: serverTimestamp(),
      });
    }
    return result;
  };

  // ✅ Logout
  const logout = () => signOut(auth);

  return (
    <ClientAuthContext.Provider
      value={{
        clientUser,
        clientLoading,
        registerWithEmail,
        loginWithEmail,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
};