
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Added

const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;

if (!getApps().length) {
  if (!firebaseConfigValues.apiKey || firebaseConfigValues.apiKey === "your_firebase_api_key") {
    throw new Error(
      "Firebase API Key is missing or is still the placeholder value ('your_firebase_api_key'). " +
      "Please update NEXT_PUBLIC_FIREBASE_API_KEY in your .env file with a valid API key from your Firebase project settings."
    );
  }
  if (!firebaseConfigValues.projectId || firebaseConfigValues.projectId === "your_firebase_project_id") {
    throw new Error(
      "Firebase Project ID is missing or is still the placeholder value ('your_firebase_project_id'). " +
      "Please update NEXT_PUBLIC_FIREBASE_PROJECT_ID in your .env file with a valid Project ID from your Firebase project settings."
    );
  }
  if (!firebaseConfigValues.authDomain) {
    console.warn("Firebase Auth Domain (NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) is not set in .env. This might cause issues.");
  }
  if (!firebaseConfigValues.appId) {
    console.warn("Firebase App ID (NEXT_PUBLIC_FIREBASE_APP_ID) is not set in .env. This might cause issues.");
  }

  app = initializeApp(firebaseConfigValues);
} else {
  app = getApp();
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app); // Added Firestore instance

export { app, auth, googleProvider, db }; // Export db
