let audioContext;
let alarmIntervalId;
let alarmActive = false;

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }

  return audioContext;
}

export function unlockAudio() {
  const context = getAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    context.resume();
  }
}

export function playBeep(frequency = 880, duration = 0.16, volume = 0.18) {
  const context = getAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    context.resume();
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime;

  oscillator.type = "square";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

function vibrate(pattern) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Some tablets have no vibration motor — ignore.
    }
  }
}

// One attention-grabbing rising burst: loud, four quick beeps, like an alarm clock.
function alarmBurst() {
  unlockAudio();
  playBeep(988, 0.16, 0.6);
  window.setTimeout(() => playBeep(1175, 0.16, 0.6), 170);
  window.setTimeout(() => playBeep(988, 0.16, 0.6), 340);
  window.setTimeout(() => playBeep(1319, 0.22, 0.65), 510);
  vibrate([350, 130, 350, 130, 500]);
}

export function startAlarm() {
  if (alarmIntervalId) return;

  alarmActive = true;
  alarmBurst();
  alarmIntervalId = window.setInterval(alarmBurst, 1500);
}

export function stopAlarm() {
  alarmActive = false;
  if (alarmIntervalId) {
    window.clearInterval(alarmIntervalId);
    alarmIntervalId = undefined;
  }
  vibrate(0);
}

// If the alarm is ringing while the tab is backgrounded, the audio context gets
// suspended; resume it the moment the app returns to the foreground.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (alarmActive && document.visibilityState === "visible") {
      unlockAudio();
    }
  });
}
