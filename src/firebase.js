import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA19l42GFNX34Q9esaLYcBgAj_rXxOIoMQ",
  authDomain: "santafi.firebaseapp.com",
  projectId: "santafi",
  storageBucket: "santafi.firebasestorage.app",
  messagingSenderId: "830529325348",
  appId: "1:830529325348:web:ed65c7ede195c683bc0bb1",
  measurementId: "G-QJ7J60G79T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);