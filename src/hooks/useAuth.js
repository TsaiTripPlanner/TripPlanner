// src/hooks/useAuth.js
import { useState, useEffect } from "react";
import {
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../config/firebase";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");

  // 封裝登入邏輯，方便「手動」與「自動」調用
  const performLogin = async (cleanCode) => {
    const fakeEmail = `${cleanCode}@trip.local`;
    const fakePassword = `code_${cleanCode}`;

    try {
      await signInWithEmailAndPassword(auth, fakeEmail, fakePassword);
      // 登入成功，存入本地，下次免輸入
      localStorage.setItem("remembered_trip_code", cleanCode);
    } catch (error) {
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-credential"
      ) {
        try {
          await createUserWithEmailAndPassword(auth, fakeEmail, fakePassword);
          localStorage.setItem("remembered_trip_code", cleanCode);
        } catch (createError) {
          throw new Error("建立失敗: " + createError.message);
        }
      } else {
        throw new Error("登入失敗: " + error.message);
      }
    }
  };

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // 如果完全沒登入過
      if (!currentUser) {
        const savedCode = localStorage.getItem("remembered_trip_code");

        if (savedCode) {
          // 有舊密碼，嘗試自動登入
          try {
            await performLogin(savedCode);
          } catch (e) {
            // 如果舊密碼失效（例如帳號被刪除），就走匿名流程
            signInAnonymously(auth);
          }
        } else {
          // 真的沒登入過也沒存過密碼，走匿名流程
          signInAnonymously(auth);
        }
      }

      setUser(currentUser);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const loginWithCode = async (accessCode) => {
    const cleanCode = accessCode.trim().replace(/\s+/g, "").toLowerCase();
    if (cleanCode.length < 3) throw new Error("通行碼太短囉！");
    await performLogin(cleanCode);
  };

  const logout = async () => {
    try {
      // 登出時清除「記住我」的紀錄
      localStorage.removeItem("remembered_trip_code");
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  return {
    userId: user ? user.uid : null,
    isAnonymous: user ? user.isAnonymous : true,
    userCode: user?.email ? user.email.split("@")[0] : null,
    isAuthReady,
    authError,
    loginWithCode,
    logout,
  };
};
