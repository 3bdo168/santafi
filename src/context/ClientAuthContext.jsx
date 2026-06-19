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
  return null;
};

const ensureClientDoc = async (user) => {
  if (!user?.uid) return;
  const docRef = doc(db, "clients", user.uid);
  const docSnap = await getDocWithRetry(docRef);
  if (!docSnap?.exists()) {
    try {
      await user.getIdToken(true);
      await setDoc(docRef, {
        name: user.displayName || "",
        email: user.email || "",
        phone: "",
        address: "",
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to write client document after refresh:", err);
      throw err;
    }
  }
};

const buildClientUser = (user, data = {}) => ({
  uid: user.uid,
  email: user.email || "",
  displayName: user.displayName || "",
  photoURL: user.photoURL || "",
  ...data,
});

export const ClientAuthProvider = ({ children }) => {
  const [clientUser, setClientUser] = useState(null);
  const [clientLoading, setClientLoading] = useState(true);
  const [clientAuthError, setClientAuthError] = useState(null);

  useEffect(() => {
    if (!hasRealFirebaseConfig) {
      setClientLoading(false);
      return undefined;
    }

    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;

      if (!user) {
        setClientUser(null);
        setClientLoading(false);
        return;
      }

      try {
        // ── Check if the signed-in user is an admin/owner first ──
        // Admin users must NOT go through ensureClientDoc — the `clients`
        // collection write/read would be blocked by Firestore rules and
        // cause 3× retries before the loading spinner ever clears.
        const adminRef = doc(db, "admins", user.uid);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          // Admin / owner — just set a minimal user object and bail out early
          if (!active) return;
          setClientUser(buildClientUser(user, adminSnap.data()));
          return; // finally still runs → setClientLoading(false)
        }

        // ── Regular client user ──
        await ensureClientDoc(user);
        const docRef = doc(db, "clients", user.uid);
        const docSnap = await getDocWithRetry(docRef);
        if (!active) return;
        setClientUser(buildClientUser(user, docSnap?.exists() ? docSnap.data() : {}));
      } catch (err) {
        console.error("ClientAuth Firestore error:", err);
        if (!active) return;
        setClientUser(buildClientUser(user));
      } finally {
        if (active) setClientLoading(false);
      }
    }, (err) => {
      console.error("ClientAuth state error:", err);
      if (!active) return;
      setClientAuthError({ code: err?.code || "unknown", message: err?.message || "" });
      setClientUser(null);
      setClientLoading(false);
    });

    getRedirectResult(auth)
      .then((result) => {
        if (active && result?.user) {
          setClientAuthError(null);
        }
      })
      .catch((err) => {
        console.error("Google redirect login error:", err?.code, err?.message, err);
        if (active) {
          setClientAuthError({ code: err?.code || "unknown", message: err?.message || "" });
        }
      });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const registerWithEmail = async (name, email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await result.user.getIdToken(true);
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
      const result = await signInWithPopup(auth, googleProvider);
      return result;
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
