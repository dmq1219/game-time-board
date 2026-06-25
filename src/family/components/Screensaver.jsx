import React, { useEffect, useState } from "react";
import { formatClock, formatLongDate, formatTime } from "../utils/calendar";
import { memberById } from "../data/familyData";

// Full-screen digital photo frame. Auto-rotates the family photo list and
// overlays the time, date, and the next important event. Tap anywhere to exit.
export default function Screensaver({ now, photos, members, nextEvt, onWake }) {
  const [index, setIndex] = useState(0);
  const { time, period } = formatClock(now);

  // Favorites first, then the rest; fall back to a gradient if empty.
  const ordered = [...photos].sort((a, b) => Number(b.favorite) - Number(a.favorite));
  const count = ordered.length;

  useEffect(() => {
    if (count <= 1) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 8000);
    return () => clearInterval(id);
  }, [count]);

  const safeIndex = count ? index % count : 0;
  const member = nextEvt ? memberById(members, nextEvt.memberId) : null;

  return (
    <div
      className="fh-screensaver"
      role="button"
      tabIndex={0}
      aria-label="Tap to return"
      onClick={onWake}
      onTouchStart={onWake}
    >
      {count === 0 && <div className="fh-slide active fh-slide-fallback" />}
      {ordered.map((p, i) => (
        <div
          key={p.id}
          // kb0..3 give each photo a different slow zoom/pan direction.
          className={`fh-slide kb${i % 4}${i === safeIndex ? " active" : ""}`}
          style={{ backgroundImage: `url(${p.src})` }}
        />
      ))}

      <div className="fh-saver-scrim" />

      <div className="fh-saver-overlay">
        <div className="fh-saver-clock">
          <span className="fh-saver-time">{time}</span>
          <span className="fh-saver-period">{period}</span>
        </div>
        <p className="fh-saver-date">{formatLongDate(now)}</p>

        {nextEvt && (
          <div className="fh-saver-next">
            <span className="fh-saver-next-label">Next up · 下一件事</span>
            <div className="fh-saver-next-row">
              <span
                className="fh-saver-dot"
                style={{ background: member?.color ?? "#fff" }}
              />
              <strong>{nextEvt.title}</strong>
              <em>
                {nextEvt.allDay ? "All day" : formatTime(nextEvt.start)}
                {member ? ` · ${member.name}` : ""}
              </em>
            </div>
          </div>
        )}

        <p className="fh-saver-hint">Tap anywhere to return · 轻触返回</p>
      </div>
    </div>
  );
}
