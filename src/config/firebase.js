// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 1. 加上 export，讓別的檔案可以讀取 appId
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

// 2. 把設定好的 db 和 auth 匯出給其他檔案使用
export { db, auth };
