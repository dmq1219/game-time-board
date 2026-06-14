// Keeps the screen awake while a timer is counting down, so the device does
// not sleep before the alarm fires. Screen Wake Lock is supported by the
// Chromium-based browsers on Huawei / Android tablets. Safely no-ops elsewhere.

let wakeLock = null;
let wanted = false;

async function acquire() {
  if (!("wakeLock" in navigator)) return;
  if (document.visibilityState !== "visible") return;

  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch {
    // Permission denied, low battery, or unsupported — ignore.
    wakeLock = null;
  }
}

export function requestWakeLock() {
  wanted = true;
  acquire();
}

export function releaseWakeLock() {
  wanted = false;
  if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}

// The OS drops the lock whenever the page is hidden; re-acquire on return.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (wanted && document.visibilityState === "visible" && !wakeLock) {
      acquire();
    }
  });
}
