import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Firebase is optional. When the NEXT_PUBLIC_FIREBASE_* env vars are present we
 * initialize Firestore and the app uses it as the backend. Otherwise the app
 * falls back to local (IndexedDB) persistence so it runs with zero setup.
 */
const firebaseConfig = {
  apiKey: "AIzaSyA7-lVF5mE815abHw1-t5HysVig3vYCwNQ",
  authDomain: "expense-tracker-2454c.firebaseapp.com",
  projectId: "expense-tracker-2454c",
  storageBucket: "expense-tracker-2454c.firebasestorage.app",
  messagingSenderId: "915547054479",
  appId: "1:915547054479:web:44fee792152fffb84eebfa",
  measurementId: "G-31Q9Q3CQ0E",
};

export const isFirebaseEnabled = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let firestore: Firestore | null = null;

if (isFirebaseEnabled) {
  try {
    const app: FirebaseApp = getApps().length
      ? getApp()
      : initializeApp(firebaseConfig);
    firestore = getFirestore(app);
  } catch (err) {
    // If init fails for any reason, fall back to local persistence.
    console.error("[firebase] initialization failed, using local storage", err);
    firestore = null;
  }
}

export { firestore };
