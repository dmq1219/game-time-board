// Date + calendar helpers for the family hub.
// All dates are handled in the device's local time zone and keyed as YYYY-MM-DD.

export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAYS_CN = ["日", "一", "二", "三", "四", "五", "六"];
export const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function pad(value) {
  return String(value).padStart(2, "0");
}

// Local-time ISO key (avoids UTC off-by-one from toISOString()).
export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function parseISODate(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function isSameDay(a, b) {
  return toISODate(a) === toISODate(b);
}

// Sunday-start week containing the given date.
export function startOfWeek(date) {
  return addDays(date, -date.getDay());
}

export function weekDates(date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// Six-row month matrix (always 42 cells) so the grid never reflows.
export function monthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(gridStart, week * 7 + day))
  );
}

// "9:00" / "13:30" -> "9:00 AM" / "1:30 PM"
export function formatTime(hhmm) {
  if (!hhmm) return "";
  const [hRaw, m] = hhmm.split(":").map(Number);
  const period = hRaw >= 12 ? "PM" : "AM";
  const h = hRaw % 12 === 0 ? 12 : hRaw % 12;
  return `${h}:${pad(m)} ${period}`;
}

export function timeToMinutes(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function formatLongDate(date) {
  const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
    date.getDay()
  ];
  return `${weekday}, ${MONTHS_LONG[date.getMonth()]} ${date.getDate()}`;
}

export function formatClock(date) {
  let h = date.getHours();
  const m = pad(date.getMinutes());
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 === 0 ? 12 : h % 12;
  return { time: `${h}:${m}`, period };
}

// Sort events chronologically; all-day events float to the top.
export function sortEvents(events) {
  return [...events].sort((a, b) => {
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;
    return timeToMinutes(a.start) - timeToMinutes(b.start);
  });
}
