import React, { useEffect, useState } from "react";
import { formatClock, formatLongDate } from "../utils/calendar";

// Mock "photos" — gradient slides so the prototype works fully offline.
// Drop real <img> sources into SLIDES (e.g. /photos/01.jpg) to use family pictures.
const SLIDES = [
  { bg: "linear-gradient(135deg,#ff9a9e,#fad0c4)", caption: "Beach day, last summer ☀️" },
  { bg: "linear-gradient(135deg,#a1c4fd,#c2e9fb)", caption: "First day of school 🎒" },
  { bg: "linear-gradient(135deg,#84fab0,#8fd3f4)", caption: "Grandma's birthday 🎂" },
  { bg: "linear-gradient(135deg,#fbc2eb,#a6c1ee)", caption: "Snow trip ❄️" },
  { bg: "linear-gradient(135deg,#ffecd2,#fcb69f)", caption: "Soccer champions ⚽" }
];

export default function Screensaver({ now, onWake }) {
  const [index, setIndex] = useState(0);
  const { time, period } = formatClock(now);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="fh-screensaver"
      role="button"
      tabIndex={0}
      aria-label="Tap to return"
      onClick={onWake}
      onTouchStart={onWake}
    >
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`fh-slide${i === index ? " active" : ""}`}
          style={{ background: slide.bg }}
        />
      ))}
      <div className="fh-saver-overlay">
        <div className="fh-saver-clock">
          <span className="fh-saver-time">{time}</span>
          <span className="fh-saver-period">{period}</span>
        </div>
        <p className="fh-saver-date">{formatLongDate(now)}</p>
        <p className="fh-saver-caption">{SLIDES[index].caption}</p>
        <p className="fh-saver-hint">Tap anywhere to return · 轻触返回</p>
      </div>
    </div>
  );
}
