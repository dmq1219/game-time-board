import React, { useEffect, useState } from "react";
import { formatClock, formatLongDate, formatTime } from "../utils/calendar";
import { memberById } from "../data/familyData";

// Full-screen digital photo frame. Auto-rotates the family photo list and
// overlays the time, date, and the next important event. Tap anywhere to exit.
export default function Screensaver({ now, photos, members, nextEvt, onWake, places }) {
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

  // 5s after the screensaver opens, go fullscreen (hides the browser chrome).
  // Browsers only allow this with a recent user gesture, so it works when the
  // saver was opened via the "Photo mode" button; on idle it may be blocked.
  useEffect(() => {
    const t = setTimeout(() => {
      if (document.fullscreenElement || document.webkitFullscreenElement) return;
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) {
        try {
          Promise.resolve(req.call(el)).catch(() => {});
        } catch {
          /* fullscreen blocked (no user gesture) — ignore */
        }
      }
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  const safeIndex = count ? index % count : 0;
  const member = nextEvt ? memberById(members, nextEvt.memberId) : null;
  const activePhoto = count ? ordered[safeIndex] : null;
  const place = activePhoto ? activePhoto.place || places?.[activePhoto.id] : null;

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
        // A real <img object-fit:cover> instead of a CSS background — some
        // tablet browsers mis-render background-size:cover (leaving the photo
        // at natural size with black bars). kb0..3 vary the zoom/pan direction.
        <img
          key={p.id}
          className={`fh-slide kb${i % 4}${i === safeIndex ? " active" : ""}`}
          src={p.src}
          alt=""
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

      </div>

      {place && (place.en || place.zh) && (
        <div className="fh-saver-place">
          <span className="fh-saver-place-pin" aria-hidden="true">📍</span>
          <span className="fh-saver-place-text">
            {place.en && <span>{place.en}</span>}
            {place.zh && place.zh !== place.en && <span>{place.zh}</span>}
          </span>
        </div>
      )}
    </div>
  );
}
