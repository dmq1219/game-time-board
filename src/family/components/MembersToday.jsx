import React from "react";
import { toISODate, formatTime, sortEvents } from "../utils/calendar";

// Right rail: one row per family member with their schedule for the selected day.
export default function MembersToday({ date, members, events, onEventClick, onAddForMember }) {
  const key = toISODate(date);

  return (
    <aside className="fh-members">
      <div className="fh-panel-head">
        <h3>Who's doing what</h3>
        <span>今日成员安排</span>
      </div>
      <div className="fh-members-list">
        {members.map((m) => {
          const list = sortEvents(events.filter((e) => e.date === key && e.memberId === m.id));
          return (
            <div className="fh-member" key={m.id} style={{ "--member": m.color, "--member-soft": m.soft }}>
              <div className="fh-member-top">
                <span className="fh-member-avatar">{m.name.charAt(0)}</span>
                <div className="fh-member-name">
                  <strong>{m.name}</strong>
                  <em>{m.role}</em>
                </div>
                <button
                  type="button"
                  className="fh-member-add"
                  onClick={() => onAddForMember(m.id, key)}
                  aria-label={`Add event for ${m.name}`}
                >
                  +
                </button>
              </div>
              <div className="fh-member-events">
                {list.length === 0 && <p className="fh-member-free">Free day 🎉</p>}
                {list.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className="fh-member-event"
                    onClick={() => onEventClick(e)}
                  >
                    <span className="fh-member-time">
                      {e.allDay ? "All day" : formatTime(e.start)}
                    </span>
                    <span className="fh-member-title">{e.title}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
