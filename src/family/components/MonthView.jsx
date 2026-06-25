import React from "react";
import {
  monthMatrix,
  toISODate,
  isSameDay,
  sortEvents,
  WEEKDAYS_SHORT,
  formatTime
} from "../utils/calendar";
import { memberColor } from "../data/familyData";

const MAX_CHIPS = 3;

// Full six-row month grid; each cell shows a few colour-coded event chips.
export default function MonthView({ date, events, members, onEventClick, onSlotClick }) {
  const matrix = monthMatrix(date.getFullYear(), date.getMonth());
  const month = date.getMonth();
  const today = new Date();

  return (
    <div className="fh-month">
      <div className="fh-month-dow">
        {WEEKDAYS_SHORT.map((d) => (
          <div key={d} className="fh-month-dow-cell">
            {d}
          </div>
        ))}
      </div>
      <div className="fh-month-grid">
        {matrix.flat().map((day) => {
          const key = toISODate(day);
          const inMonth = day.getMonth() === month;
          const isToday = isSameDay(day, today);
          const dayEvents = sortEvents(events.filter((e) => e.date === key));
          return (
            <div
              key={key}
              className={`fh-month-cell${inMonth ? "" : " is-out"}${isToday ? " is-today" : ""}`}
              onClick={(e) => {
                if (e.target === e.currentTarget) onSlotClick(key, "09:00");
              }}
            >
              <span className="fh-month-num">{day.getDate()}</span>
              <div className="fh-month-chips">
                {dayEvents.slice(0, MAX_CHIPS).map((e) => {
                  const color = memberColor(members, e.memberId);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      className="fh-month-chip"
                      style={{ background: color }}
                      onClick={() => onEventClick(e)}
                      title={`${e.allDay ? "" : formatTime(e.start) + " "}${e.title}`}
                    >
                      {!e.allDay && <span className="fh-month-dot" />}
                      {e.title}
                    </button>
                  );
                })}
                {dayEvents.length > MAX_CHIPS && (
                  <span className="fh-month-more">+{dayEvents.length - MAX_CHIPS} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
