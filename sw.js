const CACHE_NAME = "mff-v1";
const urlsToCache = [
  "/MANSONRY-FAMILY-FRATERNITY-/",
  "/MANSONRY-FAMILY-FRATERNITY-/index.html",
  "/MANSONRY-FAMILY-FRATERNITY-/register.html",
  "/MANSONRY-FAMILY-FRATERNITY-/manifest.json",
  "/MANSONRY-FAMILY-FRATERNITY-/icon-192.png",
  "/MANSONRY-FAMILY-FRATERNITY-/icon-512.png",
  "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
