// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from "react";
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

  // 取得最後一次成功登入的使用者資訊（離線恢復用）
  const getCachedUser = () => {
    const uid = localStorage.getItem("last_known_uid");
    if (!uid) return null;

    const email = localStorage.getItem("last_known_email");
    const isAnonymous = localStorage.getItem("last_known_is_anonymous") === "true";

    return {
      uid,
      email: email || null,
      isAnonymous,
    };
  };

  // 把目前登入的使用者資訊存起來，供離線時恢復
  const cacheUser = (currentUser) => {
    localStorage.setItem("last_known_uid", currentUser.uid);
    localStorage.setItem("last_known_email", currentUser.email || "");
    localStorage.setItem(
      "last_known_is_anonymous",
      String(currentUser.isAnonymous)
    );
  };

  const clearCachedUser = () => {
    localStorage.removeItem("last_known_uid");
    localStorage.removeItem("last_known_email");
    localStorage.removeItem("last_known_is_anonymous");
  };

  const performLogin = useCallback(async (cleanCode) => {
    const fakeEmail = `${cleanCode}@trip.local`;
    const fakePassword = `code_${cleanCode}`;
    try {
      await signInWithEmailAndPassword(auth, fakeEmail, fakePassword);
      localStorage.setItem("remembered_trip_code", cleanCode);
    } catch (error) {
      if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
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
  }, []);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        const savedCode = localStorage.getItem("remembered_trip_code");

        try {
          if (savedCode) {
            await performLogin(savedCode);
          } else {
            // 離線時這裡通常會噴 auth/network-request-failed
            await signInAnonymously(auth);
          }
        } catch (e) {
          console.warn("Auth 失敗（可能處於離線狀態）：", e.message);

          // 嘗試從 localStorage 恢復最後一次的使用者狀態，
          // 讓離線時畫面不會卡在 loading
          const cached = getCachedUser();
          if (cached) {
            console.log("正在從快取恢復使用者身份以進行離線瀏覽");
            setUser(cached);
          }

          setIsAuthReady(true);
          return;
        }
      }

      if (currentUser) {
        cacheUser(currentUser);
        setUser(currentUser);
      }

      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [performLogin]);

  const loginWithCode = async (accessCode) => {
    const cleanCode = accessCode.trim().replace(/\s+/g, "").toLowerCase();
    if (cleanCode.length < 3) throw new Error("通行碼太短囉！");
    await performLogin(cleanCode);
  };

  const logout = async () => {
    try {
      localStorage.removeItem("remembered_trip_code");
      clearCachedUser();
      await signOut(auth);
    } catch (error) {
      console.error(error);
    } finally {
      // 確保畫面狀態同步清除，即使離線時 onAuthStateChanged 沒有觸發
      setUser(null);
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