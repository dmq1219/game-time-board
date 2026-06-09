let audioContext;
let alarmIntervalId;

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

export function playBeep(frequency = 880, duration = 0.16) {
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
  gain.gain.exponentialRampToValueAtTime(0.14, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

export function startAlarm() {
  if (alarmIntervalId) return;

  playBeep(880, 0.14);
  window.setTimeout(() => playBeep(660, 0.14), 180);
  alarmIntervalId = window.setInterval(() => {
    playBeep(880, 0.14);
    window.setTimeout(() => playBeep(660, 0.14), 180);
  }, 1100);
}

export function stopAlarm() {
  if (!alarmIntervalId) return;
  window.clearInterval(alarmIntervalId);
  alarmIntervalId = undefined;
}
