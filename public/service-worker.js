const CACHE_NAME = "trip-planner-v" + new Date().getTime(); // 每次 build 使用不同版本號
const urlsToCache = ["/"]; // 只需要快取根路徑，其餘動態抓取

// 安裝並強制立即接管
self.addEventListener("install", (event) => {
  self.skipWaiting(); // 強制跳過等待，立即激活
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 清理舊的快取 (這步最關鍵，能解決空白問題)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("清理舊快取:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // 確保 SW 立即控制所有頁面
});

// 修改策略：Network First (網路優先)
// 這樣只要有網路，就會去抓新的 index.html
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
