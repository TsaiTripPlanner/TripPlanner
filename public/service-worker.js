const CACHE_NAME = "trip-planner-v1.0.2";

// 1. 安裝：快取首頁
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/"]);
    })
  );
});

// 2. 激活：清理舊快取
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
    .then(() => self.clients.claim())
  );
});

// 3. 抓取策略
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // 策略 A：Firebase 全部不干涉 (讓 SDK 自行處理離線快取)
  if (
    url.includes("firestore.googleapis.com") ||
    url.includes("identitytoolkit.googleapis.com") ||
    url.includes("securetoken.googleapis.com") ||
    url.includes("firebase.googleapis.com")
  ) {
    return;
  }

  // 策略 B：Google Fonts，Cache First (因為字體不常變動)
  if (url.includes("fonts.googleapis.com") || url.includes("fonts.gstatic.com")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((res) => {
          const cloned = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return res;
        });
      })
    );
    return;
  }

  // 策略 C：其他資源 (HTML, JS, CSS, 圖片)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      
      return fetch(event.request)
        .then((networkResponse) => {
          // 只快取正常的請求 (200) 或 跨域不透明請求 (0)
          if (!networkResponse || (networkResponse.status !== 200 && networkResponse.status !== 0)) {
            return networkResponse;
          }

          // 重要修正：允許 Cloudinary 圖片進入快取
          if (networkResponse.status === 0 && !url.includes("cloudinary.com")) {
           return networkResponse;
          }

          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return networkResponse;
        })
        .catch(() => {
          // 網路斷線時的兜底：如果是頁面請求，回傳快取的首頁
          if (event.request.destination === "document") {
            return caches.match("/");
          }
          return new Response("", { status: 408 });
        });
    })
  );
});