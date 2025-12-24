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
    // 路徑是指向 public/service-worker.js
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        // 監聽是否有新的 Service Worker 正在等待激活
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // 發現新版本！
                console.log("發現新版本，準備更新...");
                // 這裡可以選擇自動重整：
                window.location.reload();
              }
            }
          };
        };
      })
      .catch((error) => {
        console.error("SW 註冊失敗:", error);
      });
  });
}
