import { useCallback, useEffect, useRef, useState } from "react";

// Fires `idle` after `minutes` of no user interaction.
// Any touch / pointer / key activity resets the timer.
// `wake()` lets the UI dismiss the screensaver on the first tap.
export function useIdleScreensaver(minutes = 3) {
  const [idle, setIdle] = useState(false);
  const timerRef = useRef(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIdle(true), minutes * 60 * 1000);
  }, [minutes]);

  const wake = useCallback(() => {
    setIdle(false);
    reset();
  }, [reset]);

  // Manually enter the screensaver (e.g. a "Photo mode" button) for demos.
  const sleep = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIdle(true);
  }, []);

  useEffect(() => {
    const onActivity = () => {
      // Only keep the timer fresh while awake; the screensaver swallows its own taps.
      if (!idle) reset();
    };
    const events = ["pointerdown", "keydown", "mousemove", "touchstart", "wheel"];
    events.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));
    reset();
    return () => {
      events.forEach((name) => window.removeEventListener(name, onActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [idle, reset]);

  return { idle, wake, sleep };
}
