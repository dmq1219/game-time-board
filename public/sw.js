// Service worker for both entries (index.html + family routes).
// App shell is precached resiliently (a single missing file can't abort install);
// hashed Vite assets are cached at runtime on first fetch.
const CACHE_NAME = "game-time-board-v12";
const APP_SHELL = [
  "./",
  "./index.html",
  "./family/",
  "./family.html",
  "./manifest.webmanifest",
  "./family-manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

const INDEX_URL = new URL("./index.html", self.registration.scope).href;
const FAMILY_URL = new URL("./family/", self.registration.scope).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Cache each item independently so one 404 doesn't fail the whole install.
      Promise.allSettled(APP_SHELL.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first, fall back to cache; cache successful same-origin GETs.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Offline navigation fallback: serve the matching app-shell page.
          if (event.request.mode === "navigate") {
            const wantsFamily = url.pathname.includes("family");
            return caches.match(wantsFamily ? FAMILY_URL : INDEX_URL);
          }
          return undefined;
        })
      )
  );
});
