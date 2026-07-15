const CACHE_NAME = "freemasonry-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/offline.html"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
