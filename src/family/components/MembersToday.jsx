import React from "react";
import { toISODate, formatTime, sortEvents } from "../utils/calendar";
import { memberAvatar } from "../data/familyData";

// Right rail: one compact row per family member showing their NEXT thing today.
// Full per-member detail lives in the calendar (Today view, colour-coded), so
// the rail stays one screen-height with no scrolling across all iPad sizes.
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
          const next = list[0];
          const extra = list.length - 1;
          return (
            <div className="fh-member" key={m.id} style={{ "--member": m.color, "--member-soft": m.soft }}>
              {memberAvatar(m.id) ? (
                <img className="fh-member-avatar fh-member-avatar-img" src={memberAvatar(m.id)} alt={m.name} />
              ) : (
                <span className="fh-member-avatar">{m.name.charAt(0)}</span>
              )}
              <button
                type="button"
                className="fh-member-name"
                onClick={() => next && onEventClick(next)}
                disabled={!next}
              >
                <strong>{m.name}</strong>
                <em className="fh-member-next">
                  {next ? (
                    <>
                      <span className="fh-member-next-time">
                        {next.allDay ? "All day" : formatTime(next.start)}
                      </span>
                      {" "}
                      {next.title}
                      {extra > 0 ? ` · +${extra}` : ""}
                    </>
                  ) : (
                    "Free today 🎉"
                  )}
                </em>
              </button>
              <button
                type="button"
                className="fh-member-add"
                onClick={() => onAddForMember(m.id, key)}
                aria-label={`Add event for ${m.name}`}
              >
                +
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
