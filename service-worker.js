const CACHE_NAME = "my-site-cache";
const ASSETS_TO_CACHE = [
  "./",
  "index.html",
  "style.css",
  "webdesk.js",
  "app-icons.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
  "https://fonts.googleapis.com/css2?family=Exo:wght@100;200&family=Inconsolata&family=Nunito:ital@0;1&display=swap",
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@latest/font/bootstrap-icons.css",
  "https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.7.7/handlebars.min.js",
  "https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.2/dist/umd/popper.min.js",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.min.js",
  "https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js",
];

// Pre-cache static assets during the install event.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  // Force the waiting service worker to become active.
  self.skipWaiting();
});

// Use an online-first strategy: try to fetch from the network,
// update the cache on success, and fall back to the cache on failure.
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Only cache valid responses (status 200 and from our own domain OR CORS).
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (networkResponse.type === "basic" || networkResponse.type === "cors")
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        console.log(
          "Offline mode: Serving content from cache for",
          event.request.url
        );
        // If network fetch fails, try to return a cached resource.
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // For navigation requests or if an HTML page is expected,
          // fall back to the cached index.html.
          if (
            event.request.headers.get("accept") &&
            event.request.headers.get("accept").includes("text/html")
          ) {
            return caches.match("index.html");
          }
        });
      })
  );
});

// During activation, delete outdated caches and immediately take control of all clients.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});
