import React, { useEffect, useMemo, useState } from "react";
import { useCountdown } from "../hooks/useCountdown";
import { startAlarm, unlockAudio } from "../utils/sound";

function formatSeconds(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function secondsUntil(endAt) {
  if (!endAt) return 0;
  return Math.max(0, Math.ceil((Number(endAt) - Date.now()) / 1000));
}

export default function ScreenTimeTimer({ record, defaultMinutes, updateRecord }) {
  const [minutesDraft, setMinutesDraft] = useState(
    Number(record.screenTimeMinutes) || defaultMinutes
  );
  const isRunning = record.timerStatus === "running";
  const liveSeconds = useCountdown(record.endAt, isRunning);

  const displaySeconds = useMemo(() => {
    if (isRunning) return secondsUntil(record.endAt) || liveSeconds;
    return Number(record.remainingSeconds) || (Number(record.screenTimeMinutes) || defaultMinutes) * 60;
  }, [
    defaultMinutes,
    isRunning,
    liveSeconds,
    record.remainingSeconds,
    record.screenTimeMinutes
  ]);

  useEffect(() => {
    setMinutesDraft(Number(record.screenTimeMinutes) || defaultMinutes);
  }, [defaultMinutes, record.screenTimeMinutes]);

  useEffect(() => {
    if (
      record.timerStatus === "running" &&
      record.endAt &&
      Number(record.endAt) <= Date.now() &&
      liveSeconds <= 0
    ) {
      updateRecord((current) => ({
        ...current,
        timerStatus: "expired",
        endAt: null,
        remainingSeconds: 0,
        deviceReturned: false
      }));
      startAlarm();
    }
  }, [liveSeconds, record.endAt, record.timerStatus, updateRecord]);

  function handleMinutesChange(value) {
    const nextMinutes = Math.max(1, Math.min(180, Number(value) || defaultMinutes));
    setMinutesDraft(nextMinutes);
    updateRecord((current) => ({
      ...current,
      screenTimeMinutes: nextMinutes,
      remainingSeconds:
        current.timerStatus === "idle" || current.timerStatus === "done"
          ? nextMinutes * 60
          : current.remainingSeconds,
      timerStatus: current.timerStatus === "done" ? "idle" : current.timerStatus
    }));
  }

  function startTimer() {
    unlockAudio();
    const secondsToUse =
      record.timerStatus === "paused"
        ? displaySeconds
        : Math.max(1, Number(minutesDraft) || defaultMinutes) * 60;

    updateRecord((current) => ({
      ...current,
      screenTimeMinutes: Number(minutesDraft) || defaultMinutes,
      timerStatus: "running",
      endAt: Date.now() + secondsToUse * 1000,
      remainingSeconds: secondsToUse,
      deviceReturned: false
    }));
  }

  function pauseTimer() {
    updateRecord((current) => ({
      ...current,
      timerStatus: "paused",
      endAt: null,
      remainingSeconds: displaySeconds
    }));
  }

  function resetTimer() {
    const minutes = Number(minutesDraft) || defaultMinutes;
    updateRecord((current) => ({
      ...current,
      screenTimeMinutes: minutes,
      timerStatus: "idle",
      endAt: null,
      remainingSeconds: minutes * 60,
      deviceReturned: false
    }));
  }

  return (
    <div className="timer-panel">
      <div className="timer-topline">
        <span>Screen time timer</span>
        <label>
          <input
            type="number"
            min="1"
            max="180"
            value={minutesDraft}
            onChange={(event) => handleMinutesChange(event.target.value)}
            disabled={isRunning}
          />
          min
        </label>
      </div>
      <div className={record.timerStatus === "expired" ? "timer-display expired" : "timer-display"}>
        {formatSeconds(displaySeconds)}
      </div>
      <div className="button-row">
        {isRunning ? (
          <button type="button" onClick={pauseTimer}>
            暂停
          </button>
        ) : (
          <button type="button" className="primary" onClick={startTimer}>
            开始
          </button>
        )}
        <button type="button" onClick={resetTimer}>
          重置
        </button>
      </div>
    </div>
  );
}
