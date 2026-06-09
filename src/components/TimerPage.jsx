import React, { useEffect, useMemo, useState } from "react";
import { useCountdown } from "../hooks/useCountdown";
import { startAlarm, stopAlarm, unlockAudio } from "../utils/sound";

const TIMER_OPTIONS = [30, 60, 90];

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

export default function TimerPage() {
  const [selectedMinutes, setSelectedMinutes] = useState(30);
  const [timerState, setTimerState] = useState({
    status: "idle",
    endAt: null,
    remainingSeconds: 30 * 60
  });
  const isRunning = timerState.status === "running";
  const liveSeconds = useCountdown(timerState.endAt, isRunning);

  const displaySeconds = useMemo(() => {
    if (isRunning) return secondsUntil(timerState.endAt) || liveSeconds;
    return timerState.remainingSeconds;
  }, [isRunning, liveSeconds, timerState.endAt, timerState.remainingSeconds]);

  useEffect(() => {
    if (
      timerState.status === "running" &&
      timerState.endAt &&
      Number(timerState.endAt) <= Date.now() &&
      liveSeconds <= 0
    ) {
      setTimerState((current) => ({
        ...current,
        status: "expired",
        endAt: null,
        remainingSeconds: 0
      }));
      startAlarm();
    }
  }, [liveSeconds, timerState.endAt, timerState.status]);

  function selectMinutes(minutes) {
    setSelectedMinutes(minutes);
    setTimerState({
      status: "idle",
      endAt: null,
      remainingSeconds: minutes * 60
    });
    stopAlarm();
  }

  function startTimer() {
    unlockAudio();
    const secondsToUse = timerState.status === "paused" ? displaySeconds : selectedMinutes * 60;
    setTimerState({
      status: "running",
      endAt: Date.now() + secondsToUse * 1000,
      remainingSeconds: secondsToUse
    });
  }

  function pauseTimer() {
    setTimerState({
      status: "paused",
      endAt: null,
      remainingSeconds: displaySeconds
    });
  }

  function resetTimer() {
    stopAlarm();
    setTimerState({
      status: "idle",
      endAt: null,
      remainingSeconds: selectedMinutes * 60
    });
  }

  function acknowledgeReturn() {
    stopAlarm();
    setTimerState((current) => ({
      ...current,
      status: "done",
      endAt: null,
      remainingSeconds: 0
    }));
  }

  return (
    <section className="page timer-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Standalone countdown</p>
          <h2>Timer Page</h2>
        </div>
      </div>

      <div className="timer-workbench">
        <div className="segmented-control" aria-label="选择时长">
          {TIMER_OPTIONS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              className={selectedMinutes === minutes ? "active" : ""}
              onClick={() => selectMinutes(minutes)}
              disabled={isRunning}
            >
              {minutes} min
            </button>
          ))}
        </div>

        <div className={timerState.status === "expired" ? "big-countdown expired" : "big-countdown"}>
          {formatSeconds(displaySeconds)}
        </div>

        {timerState.status === "expired" && (
          <div className="return-message">Time to return device</div>
        )}

        <div className="button-row center">
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
          {timerState.status === "expired" && (
            <button type="button" className="primary" onClick={acknowledgeReturn}>
              确认归还
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
