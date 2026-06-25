import React from "react";
import DayView from "./DayView";
import WeekView from "./WeekView";
import MonthView from "./MonthView";
import {
  addDays,
  weekDates,
  formatLongDate,
  MONTHS_LONG,
  toISODate
} from "../utils/calendar";

const VIEWS = [
  { id: "today", label: "Today", cn: "今天" },
  { id: "week", label: "Week", cn: "本周" },
  { id: "month", label: "Month", cn: "本月" }
];

function rangeTitle(view, date) {
  if (view === "today") return formatLongDate(date);
  if (view === "week") {
    const days = weekDates(date);
    const a = days[0];
    const b = days[6];
    const left = `${MONTHS_LONG[a.getMonth()].slice(0, 3)} ${a.getDate()}`;
    const right =
      a.getMonth() === b.getMonth()
        ? `${b.getDate()}`
        : `${MONTHS_LONG[b.getMonth()].slice(0, 3)} ${b.getDate()}`;
    return `${left} – ${right}`;
  }
  return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

export default function CalendarPanel({
  view,
  onViewChange,
  cursor,
  onCursorChange,
  now,
  events,
  members,
  onEventClick,
  onAddEvent
}) {
  const step = (dir) => {
    if (view === "today") onCursorChange(addDays(cursor, dir));
    else if (view === "week") onCursorChange(addDays(cursor, dir * 7));
    else onCursorChange(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
  };

  // Open the modal with a pre-filled date/time slot.
  const handleSlot = (dateKey, start) => onAddEvent({ date: dateKey, start });

  return (
    <section className="fh-calendar">
      <div className="fh-cal-header">
        <div className="fh-view-switch" role="tablist" aria-label="Calendar view">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={view === v.id}
              className={`fh-view-tab${view === v.id ? " active" : ""}`}
              onClick={() => onViewChange(v.id)}
            >
              {v.label}
              <em>{v.cn}</em>
            </button>
          ))}
        </div>

        <div className="fh-cal-nav">
          <button type="button" className="fh-nav-btn" onClick={() => step(-1)} aria-label="Previous">
            ‹
          </button>
          <h2 className="fh-cal-title">{rangeTitle(view, cursor)}</h2>
          <button type="button" className="fh-nav-btn" onClick={() => step(1)} aria-label="Next">
            ›
          </button>
          <button
            type="button"
            className="fh-today-btn"
            onClick={() => onCursorChange(new Date())}
          >
            Today
          </button>
          <button
            type="button"
            className="fh-add-btn"
            onClick={() => onAddEvent({ date: toISODate(cursor), start: "09:00" })}
          >
            + Add
          </button>
        </div>
      </div>

      <div className="fh-cal-body">
        {view === "today" && (
          <DayView
            date={cursor}
            now={now}
            events={events}
            members={members}
            onEventClick={onEventClick}
            onSlotClick={handleSlot}
          />
        )}
        {view === "week" && (
          <WeekView
            date={cursor}
            events={events}
            members={members}
            onEventClick={onEventClick}
            onSlotClick={handleSlot}
          />
        )}
        {view === "month" && (
          <MonthView
            date={cursor}
            events={events}
            members={members}
            onEventClick={onEventClick}
            onSlotClick={handleSlot}
          />
        )}
      </div>
    </section>
  );
}
