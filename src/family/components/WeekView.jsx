import React from "react";
import {
  weekDates,
  toISODate,
  isSameDay,
  formatTime,
  sortEvents,
  WEEKDAYS_SHORT
} from "../utils/calendar";
import { memberColor } from "../data/familyData";

// Seven day columns; each lists that day's events as colour-coded chips.
export default function WeekView({ date, events, members, onEventClick, onSlotClick }) {
  const days = weekDates(date);
  const today = new Date();

  return (
    <div className="fh-week">
      {days.map((day) => {
        const key = toISODate(day);
        const dayEvents = sortEvents(events.filter((e) => e.date === key));
        const isToday = isSameDay(day, today);
        return (
          <div key={key} className={`fh-week-col${isToday ? " is-today" : ""}`}>
            <button
              type="button"
              className="fh-week-head"
              onClick={() => onSlotClick(key, "09:00")}
              title="Add event"
            >
              <span className="fh-week-dow">{WEEKDAYS_SHORT[day.getDay()]}</span>
              <span className="fh-week-num">{day.getDate()}</span>
            </button>
            <div className="fh-week-events">
              {dayEvents.length === 0 && <p className="fh-week-empty">—</p>}
              {dayEvents.map((e) => {
                const color = memberColor(members, e.memberId);
                return (
                  <button
                    key={e.id}
                    type="button"
                    className="fh-week-chip"
                    style={{ borderLeftColor: color }}
                    onClick={() => onEventClick(e)}
                  >
                    <span className="fh-week-time" style={{ color }}>
                      {e.allDay ? "All day" : formatTime(e.start)}
                    </span>
                    <span className="fh-week-title">{e.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
