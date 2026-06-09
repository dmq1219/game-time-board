import { useEffect, useState } from "react";

function secondsUntil(endAt) {
  if (!endAt) return 0;
  return Math.max(0, Math.ceil((Number(endAt) - Date.now()) / 1000));
}

export function useCountdown(endAt, isRunning) {
  const [remainingSeconds, setRemainingSeconds] = useState(() => secondsUntil(endAt));

  useEffect(() => {
    setRemainingSeconds(secondsUntil(endAt));

    if (!isRunning || !endAt) return undefined;

    const intervalId = window.setInterval(() => {
      setRemainingSeconds(secondsUntil(endAt));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [endAt, isRunning]);

  return remainingSeconds;
}
