import { toISODate, timeToMinutes } from "./calendar";

// The soonest upcoming event from `from` (default now), across all members.
// All-day events count from the start of their day. Returns null if none ahead.
export function nextEvent(events, from = new Date()) {
  const todayKey = toISODate(from);
  const nowMin = from.getHours() * 60 + from.getMinutes();

  const upcoming = events
    .map((e) => {
      const startMin = e.allDay ? 0 : timeToMinutes(e.start);
      return { e, startMin };
    })
    .filter(({ e, startMin }) => {
      if (e.date > todayKey) return true;
      if (e.date < todayKey) return false;
      return e.allDay || startMin >= nowMin;
    })
    .sort((a, b) => {
      if (a.e.date !== b.e.date) return a.e.date < b.e.date ? -1 : 1;
      return a.startMin - b.startMin;
    });

  return upcoming.length ? upcoming[0].e : null;
}

// Same day + same title (case-insensitive) + same start time => likely duplicate.
export function findDuplicate(events, candidate) {
  const title = (candidate.title || "").trim().toLowerCase();
  return events.find(
    (e) =>
      e.date === candidate.date &&
      (e.title || "").trim().toLowerCase() === title &&
      (e.start || "") === (candidate.start || "")
  );
}
