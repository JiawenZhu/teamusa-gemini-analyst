// lib/firebase.ts — Firebase initialization for TeamUSA Archetype Oracle
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY_REDACTED",
  authDomain: "teamusa-8b1ba.firebaseapp.com",
  projectId: "teamusa-8b1ba",
  storageBucket: "teamusa-8b1ba.firebasestorage.app",
  messagingSenderId: "789615763226",
  appId: "1:789615763226:web:5a21c2f523dd6c143b56a3",
  measurementId: "G-VNRE5VP9V0",
};

// Prevent duplicate app initialization in Next.js hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);

// Analytics only runs in the browser
export const analyticsPromise = isSupported().then((yes) =>
  yes ? getAnalytics(app) : null
);

export default app;
