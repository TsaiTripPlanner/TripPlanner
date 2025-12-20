// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const appId = "my-trip-app-v18-burger-icon";

const firebaseConfig = {
  apiKey: "AIzaSyB6kHRCZuEK2MAY5ce4cRu_C3ZfJoijIqg",
  authDomain: "conantowntripapp.firebaseapp.com",
  databaseURL:
    "https://conantowntripapp-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "conantowntripapp",
  storageBucket: "conantowntripapp.firebasestorage.app",
  messagingSenderId: "601821748614",
  appId: "1:601821748614:web:1e9e4b88a5eaf26a15e007",
  measurementId: "G-3ZTZZJJPTB",
};

let firebaseApp = null;
let db = null;
let auth = null;

if (firebaseConfig && firebaseConfig.apiKey) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
  } catch (e) {
    console.error("Firebase Initialization Error:", e);
  }
}

export { db, auth };
