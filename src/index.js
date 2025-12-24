// src/index.js
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./utils/theme"; // 引入剛剛做好的主題功能

import App from "./App";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    {/* 這裡包起來，App 才能使用換膚功能 */}
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // 1. 先定義一個旗標在最外層，防止單次會話中重複觸發
    let isRefreshing = false;

    // 2. 監聽控制權變更 (這是最準確的更新觸發點)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (isRefreshing) return;
      isRefreshing = true;
      console.log("Service Worker 已更新，正在重新載入頁面...");
      window.location.reload();
    });

    // 3. 註冊 SW
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        // 每隔一個小時主動檢查一次伺服器有沒有新版本 (可選)
        setInterval(() => {
          registration.update();
        }, 1000 * 60 * 60);

        // 如果發現有新 SW 在等待，手動提醒它跳過等待
        registration.onupdatefound = () => {
          const newWorker = registration.installing;
          newWorker.onstatechange = () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log("新的 SW 已安裝，準備覆蓋舊版本...");
              // 這裡會觸發上面監聽的 controllerchange
            }
          };
        };
      })
      .catch((error) => {
        console.error("SW 註冊失敗:", error);
      });
  });
}
