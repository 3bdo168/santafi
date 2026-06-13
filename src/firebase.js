/**
 * Firebase client bootstrap.
 * Configuration is read from Vite env vars (VITE_FIREBASE_*).
 * Dev fallbacks apply only when those variables are missing.
 */
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dev-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dev.local",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dev-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dev-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:devapp",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/** True when production Firebase credentials are present in .env */
const hasRealFirebaseConfig = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID
);

const app = initializeApp(firebaseConfig);
let analytics = null;
try {
  if (typeof window !== "undefined" && hasRealFirebaseConfig && firebaseConfig.measurementId) {
    analytics = getAnalytics(app);
  }
} catch {
  analytics = null;
}
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

export { app, analytics, auth, db, functions, hasRealFirebaseConfig };