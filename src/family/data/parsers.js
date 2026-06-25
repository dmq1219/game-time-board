// Magic Import — parser adapters.
//
// v1 ships a rule-based EMAIL parser (paste text) plus PDF / IMAGE stubs.
// Every adapter shares one contract so real extractors (PDF text, OCR, an AI
// model) can be swapped in later without touching the UI:
//
//   parse(input, members) -> Candidate[]
//   Candidate = { tempId, title, date, start, end, location, memberId, notes }
//
// Nothing here writes to the calendar — candidates go to the Review screen.

let counter = 0;
const tempId = () => `cand-${(counter++).toString(36)}-${Math.floor(performance.now())}`;

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};
const WEEKDAYS = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

const pad = (n) => String(n).padStart(2, "0");
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

function startOfToday(now) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Forward-looking: a bare date already in the past rolls to next year.
function resolveYear(y, m, d, now) {
  if (y) return y;
  const guess = new Date(now.getFullYear(), m, d);
  return guess < startOfToday(now) ? now.getFullYear() + 1 : now.getFullYear();
}

// Find the first date-like token in a string. Returns { date, text, index } or null.
function findDate(str, now) {
  const candidates = [];

  // ISO 2026-03-12
  let m = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(str);
  if (m) candidates.push({ index: m.index, text: m[0], date: iso(+m[1], +m[2] - 1, +m[3]) });

  // Month name: "March 12", "Mar 12, 2026", "Sept 3rd"
  const monRe = /\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?\b/g;
  let mm;
  while ((mm = monRe.exec(str))) {
    const key = mm[1].slice(0, 3).toLowerCase();
    if (!(key in MONTHS)) continue;
    const month = MONTHS[key];
    const day = +mm[2];
    if (day < 1 || day > 31) continue;
    const year = resolveYear(mm[3] ? +mm[3] : null, month, day, now);
    candidates.push({ index: mm.index, text: mm[0], date: iso(year, month, day) });
  }

  // Numeric 3/12 or 3/12/2026
  const numRe = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g;
  let nm;
  while ((nm = numRe.exec(str))) {
    const month = +nm[1] - 1;
    const day = +nm[2];
    if (month < 0 || month > 11 || day < 1 || day > 31) continue;
    let year = nm[3] ? +nm[3] : null;
    if (year && year < 100) year += 2000;
    year = resolveYear(year, month, day, now);
    candidates.push({ index: nm.index, text: nm[0], date: iso(year, month, day) });
  }

  // Relative: today / tonight / tomorrow
  let rel = /\b(today|tonight)\b/i.exec(str);
  if (rel) {
    const d = startOfToday(now);
    candidates.push({ index: rel.index, text: rel[0], date: iso(d.getFullYear(), d.getMonth(), d.getDate()) });
  }
  rel = /\btomorrow\b/i.exec(str);
  if (rel) {
    const d = startOfToday(now);
    d.setDate(d.getDate() + 1);
    candidates.push({ index: rel.index, text: rel[0], date: iso(d.getFullYear(), d.getMonth(), d.getDate()) });
  }

  // Weekday name -> next occurrence (today counts)
  const wd = /\b(sun|mon|tue|wed|thu|fri|sat)[a-z]*\b/i.exec(str);
  if (wd) {
    const target = WEEKDAYS[wd[1].slice(0, 3).toLowerCase()];
    const d = startOfToday(now);
    const delta = (target - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + delta);
    candidates.push({ index: wd.index, text: wd[0], date: iso(d.getFullYear(), d.getMonth(), d.getDate()) });
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => a.index - b.index);
  return candidates[0];
}

function to24(h, min, ap) {
  let hour = h % 12;
  if (ap && ap.toLowerCase() === "pm") hour += 12;
  if (ap && ap.toLowerCase() === "am") hour = h % 12;
  if (!ap && h <= 23) hour = h; // already 24h
  return `${pad(hour)}:${pad(min || 0)}`;
}

// Extract a start (and optional end) time from a string.
// Returns { start, end, text } where text is the raw match (to strip from titles).
function findTime(str) {
  const range =
    /\b(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?\s*(?:-|–|—|to|until|till)\s*(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)\b/i.exec(
      str
    );
  if (range) {
    const endAp = range[6].replace(/\./g, "");
    const startAp = (range[3] || endAp).replace(/\./g, ""); // borrow am/pm from end
    return {
      start: to24(+range[1], +range[2] || 0, startAp),
      end: to24(+range[4], +range[5] || 0, endAp),
      text: range[0]
    };
  }
  const single = /\b(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)\b/i.exec(str);
  if (single) {
    return { start: to24(+single[1], +single[2] || 0, single[3].replace(/\./g, "")), end: "", text: single[0] };
  }
  const h24 = /\b([01]?\d|2[0-3]):([0-5]\d)\b/.exec(str);
  if (h24) return { start: to24(+h24[1], +h24[2], null), end: "", text: h24[0] };

  return { start: "", end: "", text: "" };
}

function findLocation(str) {
  let m = /(?:location|venue|where|place)\s*:?\s*(.+)/i.exec(str);
  if (m) return clean(m[1]);
  // "at [the|a] Science Museum" — capitalised place name, a few words max.
  m = /\bat\s+(?:the\s+|a\s+)?([A-Z][\w'’&\-]*(?:\s+[A-Z][\w'’&\-]*){0,4})/.exec(str);
  if (m) return clean(m[1]);
  // "in the school auditorium"
  m = /\bin\s+the\s+([a-z][\w'’&\- ]{2,}?)(?:[.,;!?]|$)/i.exec(str);
  if (m) return clean(m[1]);
  m = /@\s*([A-Za-z][\w'’.&\- ]{2,}?)(?:[.,;!?]|$)/.exec(str);
  if (m) return clean(m[1]);
  return "";
}

function findMember(str, members) {
  const lower = str.toLowerCase();
  const hit = members.find((mem) => new RegExp(`\\b${mem.name.toLowerCase()}\\b`).test(lower));
  return hit ? hit.id : "";
}

function clean(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function titleFrom(segment, dateText, timeText, location, subject) {
  let t = segment;
  if (dateText) t = t.replace(dateText, " ");
  if (timeText) t = t.replace(timeText, " ");
  if (location) t = t.replace(location, " ");
  t = clean(t)
    .replace(/\b(will be held|held|please|reminder|don'?t forget)\b/gi, " ")
    .replace(/\b(on|at|in|from|by|to|is|are|the|a|of|for)\b/gi, " ")
    .replace(/[•\-–—:.,!?]+/g, " ");
  t = clean(t).split(/\s+/).slice(0, 9).join(" ");
  if (t.length < 4) t = clean(subject) || "Untitled event";
  if (!t) t = "Untitled event";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Split into sentence/line segments so multi-event emails yield multiple events.
function segmentize(body) {
  return body
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map(clean)
    .filter(Boolean);
}

export function parseEmailText(text, members = [], now = new Date()) {
  if (!text || !text.trim()) return [];

  const lines = text.split(/\n+/).map(clean);
  const subjectLine = lines.find((l) => /^subject\s*:/i.test(l));
  const subject = subjectLine ? clean(subjectLine.replace(/^subject\s*:/i, "")) : "";
  const globalMember = findMember(text, members);

  const segments = segmentize(text.replace(subjectLine || "", ""));
  const anchors = [];
  for (const seg of segments) {
    const d = findDate(seg, now);
    if (d) anchors.push({ seg, d });
  }

  const candidates = [];
  const pushCandidate = (c) => {
    // Skip exact dup within this batch (same date+title+start).
    const dupe = candidates.some(
      (x) =>
        x.date === c.date &&
        x.start === c.start &&
        x.title.toLowerCase() === c.title.toLowerCase()
    );
    if (!dupe) candidates.push(c);
  };

  if (anchors.length) {
    for (const { seg, d } of anchors) {
      const time = findTime(seg);
      const location = findLocation(seg);
      const member = findMember(seg, members) || globalMember;
      pushCandidate({
        tempId: tempId(),
        title: titleFrom(seg, d.text, time.text, location, subject),
        date: d.date,
        start: time.start,
        end: time.end,
        location,
        memberId: member,
        notes: ""
      });
    }
  } else {
    // No date found anywhere — still offer one candidate to fill in manually.
    const time = findTime(text);
    pushCandidate({
      tempId: tempId(),
      title: subject || titleFrom(segments[0] || "", "", "", "", subject),
      date: "",
      start: time.start,
      end: time.end,
      location: findLocation(text),
      memberId: globalMember,
      notes: ""
    });
  }

  return candidates;
}

// Stubs — real extraction lands here later (see README roadmap).
function notReady(kind) {
  return () => {
    const err = new Error(`${kind} parsing coming soon`);
    err.code = "NOT_READY";
    throw err;
  };
}

export const PARSERS = {
  email: { id: "email", label: "Paste email text", cn: "粘贴邮件", ready: true, parse: parseEmailText },
  pdf: { id: "pdf", label: "Upload PDF", cn: "上传 PDF", ready: false, parse: notReady("PDF") },
  image: { id: "image", label: "Upload image / flyer", cn: "上传图片", ready: false, parse: notReady("Image") }
};

export const SAMPLE_EMAIL = `Subject: Spring Field Trip & Concert — Please Read

Hi families,

Liam's class field trip to the Science Museum is on March 12, 2026 from 9:00 AM to 2:30 PM. Please drop off at the main entrance by 8:45.

The Spring Concert will be held on Friday at 6:30 PM in the school auditorium. Emma has a piano solo!

Reminder: picture day is 3/20. Wear school colors.

Thank you,
Ms. Carter`;
