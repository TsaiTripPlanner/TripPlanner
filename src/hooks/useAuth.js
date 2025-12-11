import { useState, useEffect } from "react";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";

// 這就是一個 Custom Hook，命名一定要用 use 開頭
export const useAuth = () => {
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!auth) {
      setAuthError("Firebase Config 尚未設定或錯誤。");
      setIsAuthReady(true);
      return;
    }

    // 匿名登入
    signInAnonymously(auth).catch((error) => {
      console.error("認證失敗:", error);
      setAuthError("登入失敗，請檢查 Firebase Auth 設定。");
    });

    // 監聽登入狀態
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : "guest");
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // 把 App.js 需要的資料「吐」回去
  return { userId, isAuthReady, authError };
};
