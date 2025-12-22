// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";

export const appId = "my-trip-app-v18-burger-icon";

const firebaseConfig = {
  apiKey: "AIzaSyB6kHRCZuEK2MAY5ce4cRu_C3ZfJoijIqg",
  authDomain: "conantowntripapp.firebaseapp.com",
  projectId: "conantowntripapp",
  storageBucket: "conantowntripapp.firebasestorage.app",
  messagingSenderId: "601821748614",
  appId: "1:601821748614:web:1e9e4b88a5eaf26a15e007",
};

const firebaseApp = initializeApp(firebaseConfig);

// 啟用離線快取
const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache(),
});

const auth = getAuth(firebaseApp);

export { db, auth };
