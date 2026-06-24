import React from "react";
import { toISODate, timeToMinutes, formatTime, sortEvents } from "../utils/calendar";
import { memberColor, memberById, memberAvatar } from "../data/familyData";

const WINDOW_MIN = 4 * 60; // show a 4-hour window: now ±2 hours

// The visible time window is centred on "now" (clamped to the day) so the
// timeline stays compact and leaves room for the panels below.
function computeWindow(now) {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let start = nowMin - WINDOW_MIN / 2;
  let end = nowMin + WINDOW_MIN / 2;
  if (start < 0) {
    end -= start;
    start = 0;
  }
  if (end > 1440) {
    start -= end - 1440;
    end = 1440;
  }
  return { start, end };
}

// Pack overlapping events into side-by-side lanes (standard interval-graph layout).
function layoutDay(events, startMin, endMin) {
  const items = events
    .filter((e) => {
      const es = timeToMinutes(e.start);
      const ee = e.end ? timeToMinutes(e.end) : es + 60;
      return ee > startMin && es < endMin; // only events overlapping the window
    })
    .map((e) => {
      const s = Math.max(timeToMinutes(e.start), startMin);
      const rawEnd = e.end ? timeToMinutes(e.end) : timeToMinutes(e.start) + 60;
      const en = Math.min(Math.max(rawEnd, s + 30), endMin);
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

export default function DayView({ date, now = new Date(), events, members, onEventClick, onSlotClick }) {
  const key = toISODate(date);
  const dayEvents = events.filter((e) => e.date === key);
  const allDay = sortEvents(dayEvents.filter((e) => e.allDay));

  const { start, end } = computeWindow(now);
  const range = end - start;
  const timed = layoutDay(dayEvents.filter((e) => !e.allDay), start, end);

  // Integer hour gridlines that fall inside the window.
  const firstHour = Math.ceil(start / 60);
  const lastHour = Math.floor(end / 60);
  const hours = [];
  for (let h = firstHour; h <= lastHour; h += 1) hours.push(h);

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
              style={{ top: `${((h * 60 - start) / range) * 100}%` }}
            >
              <span className="fh-hour-label">{formatTime(`${h}:00`)}</span>
              <span className="fh-hour-line" />
            </div>
          ))}

          <div
            className="fh-day-canvas"
            onClick={(e) => {
              // Tap an empty area to add an event at roughly that time.
              if (e.target !== e.currentTarget) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientY - rect.top) / rect.height;
              const minute = start + Math.round((ratio * range) / 30) * 30;
              const hh = String(Math.floor(minute / 60)).padStart(2, "0");
              const mm = String(minute % 60).padStart(2, "0");
              onSlotClick(key, `${hh}:${mm}`);
            }}
          >
            {timed.map(({ e, s, en, lane, cols }) => {
              const member = memberById(members, e.memberId);
              const color = member?.color ?? "#6b7280";
              const avatar = memberAvatar(e.memberId);
              return (
                <button
                  key={e.id}
                  type="button"
                  className="fh-event-block"
                  style={{
                    top: `${((s - start) / range) * 100}%`,
                    height: `${((en - s) / range) * 100}%`,
                    left: `${(lane / cols) * 100}%`,
                    width: `calc(${(1 / cols) * 100}% - 6px)`,
                    background: member?.soft ?? "#f3f4f6",
                    borderColor: color
                  }}
                  onClick={() => onEventClick(e)}
                >
                  {avatar ? (
                    <span
                      className="fh-event-avatar"
                      style={{ backgroundImage: `url(${avatar})` }}
                      aria-hidden="true"
                    />
                  ) : (
                    <span className="fh-event-bar" style={{ background: color }} />
                  )}
                  <span className="fh-event-body">
                    <strong style={{ color }}>{formatTime(e.start)}</strong>
                    <span className="fh-event-title">{e.title}</span>
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
