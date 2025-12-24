const CACHE_NAME = "trip-planner-v1";

// 想要快取的檔案清單
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo192.png",
  "/logo512.png",
];

// 安裝 Service Worker 並快取檔案
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 攔截請求，優先從快取抓取資料（實現離線開啟）
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
