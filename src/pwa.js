// Shared PWA service-worker setup for both entries (index.html + family.html).
// Registers in production; in dev it unregisters any old worker and clears
// caches so stale assets never shadow the dev server.
export function setupPWA() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  if (import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
        .catch(() => {});
    });
  } else {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
  }
}
