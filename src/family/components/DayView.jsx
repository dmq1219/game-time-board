import React from "react";
import { toISODate, timeToMinutes, formatTime, sortEvents } from "../utils/calendar";
import { memberColor, memberById } from "../data/familyData";

const DAY_START = 6; // 6 AM
const DAY_END = 22; // 10 PM
const RANGE_MIN = (DAY_END - DAY_START) * 60;

// Pack overlapping events into side-by-side lanes (standard interval-graph layout).
function layoutDay(events) {
  const items = events
    .map((e) => {
      const s = Math.max(timeToMinutes(e.start), DAY_START * 60);
      const rawEnd = e.end ? timeToMinutes(e.end) : timeToMinutes(e.start) + 60;
      const en = Math.min(Math.max(rawEnd, s + 30), DAY_END * 60);
      return { e, s, en };
    })
    .sort((a, b) => a.s - b.s || a.en - b.en);

  const out = [];
  let cluster = [];
  let clusterEnd = -1;

  const flush = () => {
    const lanes = [];
    cluster.forEach((it) => {
      let lane = lanes.findIndex((end) => end <= it.s);
      if (lane === -1) {
        lane = lanes.length;
        lanes.push(it.en);
      } else {
        lanes[lane] = it.en;
      }
      it.lane = lane;
    });
    cluster.forEach((it) => {
      it.cols = lanes.length;
      out.push(it);
    });
    cluster = [];
  };

  items.forEach((it) => {
    if (cluster.length && it.s >= clusterEnd) {
      flush();
      clusterEnd = -1;
    }
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.en);
  });
  if (cluster.length) flush();
  return out;
}

export default function DayView({ date, events, members, onEventClick, onSlotClick }) {
  const key = toISODate(date);
  const dayEvents = events.filter((e) => e.date === key);
  const allDay = sortEvents(dayEvents.filter((e) => e.allDay));
  const timed = layoutDay(dayEvents.filter((e) => !e.allDay));

  const hours = Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i);

  return (
    <div className="fh-day">
      {allDay.length > 0 && (
        <div className="fh-allday">
          <span className="fh-allday-label">All day</span>
          <div className="fh-allday-chips">
            {allDay.map((e) => (
              <button
                key={e.id}
                type="button"
                className="fh-chip"
                style={{ background: memberColor(members, e.memberId) }}
                onClick={() => onEventClick(e)}
              >
                {e.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="fh-day-grid">
        <div className="fh-day-hours">
          {hours.map((h) => (
            <div
              key={h}
              className="fh-hour-row"
              style={{ top: `${((h - DAY_START) * 60) / RANGE_MIN * 100}%` }}
            >
              <span className="fh-hour-label">{formatTime(`${h}:00`)}</span>
              <span className="fh-hour-line" />
            </div>
          ))}

          <div
            className="fh-day-canvas"
            onClick={(e) => {
              // Tap an empty area to add an event at roughly that hour.
              if (e.target !== e.currentTarget) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientY - rect.top) / rect.height;
              const minute = DAY_START * 60 + Math.round((ratio * RANGE_MIN) / 30) * 30;
              const hh = String(Math.floor(minute / 60)).padStart(2, "0");
              const mm = String(minute % 60).padStart(2, "0");
              onSlotClick(key, `${hh}:${mm}`);
            }}
          >
            {timed.map(({ e, s, en, lane, cols }) => {
              const member = memberById(members, e.memberId);
              const color = member?.color ?? "#6b7280";
              return (
                <button
                  key={e.id}
                  type="button"
                  className="fh-event-block"
                  style={{
                    top: `${((s - DAY_START * 60) / RANGE_MIN) * 100}%`,
                    height: `${((en - s) / RANGE_MIN) * 100}%`,
                    left: `${(lane / cols) * 100}%`,
                    width: `calc(${(1 / cols) * 100}% - 6px)`,
                    background: member?.soft ?? "#f3f4f6",
                    borderColor: color
                  }}
                  onClick={() => onEventClick(e)}
                >
                  <span className="fh-event-bar" style={{ background: color }} />
                  <span className="fh-event-body">
                    <strong style={{ color }}>{formatTime(e.start)}</strong>
                    <span className="fh-event-title">{e.title}</span>
                    {e.location && <span className="fh-event-loc">{e.location}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
