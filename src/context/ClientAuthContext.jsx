import React, { useEffect, useState } from "react";
import { ClientAuthContext } from "./authContext";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, hasRealFirebaseConfig } from "../firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const getDocWithRetry = async (docRef, retries = 3, delay = 250) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await getDoc(docRef);
    } catch (err) {
      if (err.code === "permission-denied" && i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
};

const ensureClientDoc = async (user) => {
  const docRef = doc(db, "clients", user.uid);
  const docSnap = await getDocWithRetry(docRef);
  if (!docSnap.exists()) {
    await setDoc(docRef, {
      name: user.displayName || "",
      email: user.email || "",
      phone: "",
      address: "",
      createdAt: serverTimestamp(),
    });
  }
};

export const ClientAuthProvider = ({ children }) => {
  const [clientUser, setClientUser] = useState(null);
  const [clientLoading, setClientLoading] = useState(true);
  const [clientAuthError, setClientAuthError] = useState(null);

  useEffect(() => {
    if (!hasRealFirebaseConfig) {
      setClientLoading(false);
      return;
    }

    let unsub = () => {};
    let active = true;

    const initAuth = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          setClientAuthError(null);
        }
      } catch (err) {
        console.error("Google redirect login error:", err?.code, err?.message, err);
        setClientAuthError({ code: err?.code || "unknown", message: err?.message || "" });
      } finally {
        if (!active) return;

        unsub = onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              await ensureClientDoc(user);
              const docRef = doc(db, "clients", user.uid);
              const docSnap = await getDocWithRetry(docRef);
              setClientUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                ...(docSnap.exists() ? docSnap.data() : {}),
              });
            } catch (err) {
              console.error("ClientAuth Firestore error:", err);
              // ✅ fallback — نستخدم بيانات الـ Auth بس من غير Firestore
              setClientUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
              });
            }
          } else {
            setClientUser(null);
          }
          setClientLoading(false);
        });
      }
    };

    initAuth();

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const registerWithEmail = async (name, email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    await setDoc(doc(db, "clients", result.user.uid), {
      name,
      email,
      phone: "",
      address: "",
      createdAt: serverTimestamp(),
    });
    return result;
  };

  const loginWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const loginWithGoogle = async () => {
    try {
      setClientAuthError(null);
      setClientLoading(true);
      await signInWithRedirect(auth, googleProvider);
      return { redirecting: true };
    } catch (err) {
      setClientLoading(false);
      setClientAuthError({ code: err?.code || "unknown", message: err?.message || "" });
      throw err;
    }
  };

  const logout = () => signOut(auth);

  return (
    <ClientAuthContext.Provider
      value={{
        clientUser,
        clientLoading,
        clientAuthError,
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
