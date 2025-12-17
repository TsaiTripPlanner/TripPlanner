// src/hooks/useAuth.js
import { useState, useEffect } from "react";
import {
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword, // 1. 引入登入功能
  createUserWithEmailAndPassword, // 2. 引入註冊功能
  signOut, // 3. 引入登出功能
} from "firebase/auth";
import { auth } from "../config/firebase";

export const useAuth = () => {
  const [user, setUser] = useState(null); // 改成存整個使用者物件，不只存 ID
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!auth) {
      setAuthError("Firebase Config 尚未設定或錯誤。");
      setIsAuthReady(true);
      return;
    }

    // 監聽登入狀態改變
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);

      // 如果使用者完全沒登入，自動幫他匿名登入 (確保一定能用)
      // 這樣剛進來的人雖然沒輸入通行碼，也能先試用
      if (!currentUser) {
        signInAnonymously(auth).catch((error) => {
          console.error("匿名認證失敗:", error);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // ★★★ 這就是核心功能：通行碼登入 ★★★
  const loginWithCode = async (accessCode) => {
    // 1. 資料清洗：
    // .trim() -> 去除前後空白
    // .replace(/\s+/g, "") -> 去除中間所有空白 (例如 "Tokyo 2025" 變 "Tokyo2025")
    // .toLowerCase() -> 轉成小寫 (讓 "Tokyo" 和 "tokyo" 視為同一個房間)
    const cleanCode = accessCode.trim().replace(/\s+/g, "").toLowerCase();

    // 2. 檢查長度
    if (cleanCode.length < 3) {
      throw new Error("通行碼太短囉，請至少輸入 3 個英數字！");
    }

    // 3. 產生對應的 Email/密碼
    const fakeEmail = `${cleanCode}@trip.local`;
    const fakePassword = `code_${cleanCode}`;

    try {
      // 嘗試登入
      await signInWithEmailAndPassword(auth, fakeEmail, fakePassword);
    } catch (error) {
      // 捕捉錯誤
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-credential"
      ) {
        // 沒人註冊過 -> 嘗試註冊
        try {
          await createUserWithEmailAndPassword(auth, fakeEmail, fakePassword);
        } catch (createError) {
          // 如果後台沒開功能，會報 operation-not-allowed
          if (createError.code === "auth/operation-not-allowed") {
            throw new Error(
              "後台尚未開啟 Email/密碼登入功能，請至 Firebase Console 開啟。"
            );
          }
          throw new Error("建立失敗: " + createError.message);
        }
      } else {
        // 其他登入錯誤
        if (error.code === "auth/operation-not-allowed") {
          throw new Error(
            "後台尚未開啟 Email/密碼登入功能，請至 Firebase Console 開啟。"
          );
        }
        throw new Error("登入失敗: " + error.message);
      }
    }
  };

  // 登出功能
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  // 回傳資料給 App.js 使用
  return {
    userId: user ? user.uid : null,
    // 判斷是否為「訪客/匿名」狀態 (如果有 email 就代表是用通行碼登入的正式使用者)
    isAnonymous: user ? user.isAnonymous : true,
    // 如果有 email，我們把後面的 @trip.local 切掉，只顯示通行碼給使用者看
    userCode: user?.email ? user.email.split("@")[0] : null,
    isAuthReady,
    authError,
    loginWithCode, // ★ 記得把這支函式傳出去
    logout, // ★ 傳出登出函式
  };
};
