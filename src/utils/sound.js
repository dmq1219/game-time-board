let audioContext;
let melodyTimeoutId;
let alarmActive = false;
let scheduledOsc = [];

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

function vibrate(pattern) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Some tablets have no vibration motor — ignore.
    }
  }
}

// Note frequencies (Hz). 0 = rest.
const NOTE = {
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  REST: 0
};

// Synthesized "Baby Shark" hook (the melody is a traditional children's tune;
// this is our own tone sequence, not a copyrighted recording). [note, beats]
const BABY_SHARK = [
  // Baby shark, doo doo doo doo doo doo
  ["C5", 0.5], ["C5", 0.5], ["D5", 1],
  ["E5", 0.5], ["E5", 0.5], ["E5", 0.5], ["E5", 0.5], ["E5", 0.5], ["E5", 0.5],
  // Baby shark, doo doo doo doo doo doo
  ["C5", 0.5], ["C5", 0.5], ["D5", 1],
  ["E5", 0.5], ["E5", 0.5], ["E5", 0.5], ["E5", 0.5], ["E5", 0.5], ["E5", 0.5],
  // Baby shark, doo doo doo doo doo doo
  ["C5", 0.5], ["C5", 0.5], ["D5", 1],
  ["E5", 0.5], ["E5", 0.5], ["E5", 0.5], ["E5", 0.5], ["E5", 0.5], ["E5", 0.5],
  // Baby shark!
  ["E5", 0.5], ["D5", 0.5], ["C5", 1],
  ["REST", 0.75]
];

const SECONDS_PER_BEAT = 0.34;

function scheduleNote(context, frequency, startTime, duration, volume) {
  if (!frequency) return; // rest

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const attack = 0.012;
  const release = 0.06;
  const sustainUntil = Math.max(startTime + attack, startTime + duration - release);

  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + attack);
  gain.gain.setValueAtTime(volume, sustainUntil);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);

  scheduledOsc.push(oscillator);
  oscillator.onended = () => {
    scheduledOsc = scheduledOsc.filter((osc) => osc !== oscillator);
  };
}

// Schedule one full pass of the melody; returns its total duration in seconds.
function playMelodyPass(context, startAt) {
  let cursor = startAt;
  for (const [name, beats] of BABY_SHARK) {
    const duration = beats * SECONDS_PER_BEAT;
    scheduleNote(context, NOTE[name] || 0, cursor, duration * 0.92, 0.34);
    cursor += duration;
  }
  return cursor - startAt;
}

// Plays the Baby Shark melody on a loop until stopAlarm() is called.
export function startAlarm() {
  if (alarmActive) return;

  const context = getAudioContext();
  if (!context) return;

  alarmActive = true;
  unlockAudio();

  const loop = () => {
    if (!alarmActive) return;
    if (context.state === "suspended") context.resume();
    const passSeconds = playMelodyPass(context, context.currentTime + 0.06);
    vibrate([200, 120, 200]);
    melodyTimeoutId = window.setTimeout(loop, passSeconds * 1000);
  };

  loop();
}

export function stopAlarm() {
  alarmActive = false;

  if (melodyTimeoutId) {
    window.clearTimeout(melodyTimeoutId);
    melodyTimeoutId = undefined;
  }

  scheduledOsc.forEach((osc) => {
    try {
      osc.stop();
    } catch {
      // already stopped
    }
  });
  scheduledOsc = [];

  vibrate(0);
}

// If the melody is playing while the tab is backgrounded, the audio context
// gets suspended; resume it the moment the app returns to the foreground.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (alarmActive && document.visibilityState === "visible") {
      unlockAudio();
    }
  });
}
