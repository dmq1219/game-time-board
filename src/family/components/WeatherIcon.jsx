import React from "react";

// Simple, bold weather glyphs — readable from across the room.
export default function WeatherIcon({ icon = "sun", size = 56 }) {
  const common = { width: size, height: size, viewBox: "0 0 64 64", "aria-hidden": true };

  if (icon === "cloud") {
    return (
      <svg {...common}>
        <path
          className="wx-cloud"
          d="M20 44h26a10 10 0 0 0 1-20 14 14 0 0 0-27 3 9 9 0 0 0 0 17z"
        />
      </svg>
    );
  }
  if (icon === "rain") {
    return (
      <svg {...common}>
        <path className="wx-cloud" d="M20 38h26a10 10 0 0 0 1-20 14 14 0 0 0-27 3 9 9 0 0 0 0 17z" />
        <g className="wx-rain">
          <line x1="24" y1="46" x2="21" y2="55" />
          <line x1="34" y1="46" x2="31" y2="55" />
          <line x1="44" y1="46" x2="41" y2="55" />
        </g>
      </svg>
    );
  }
  if (icon === "partly") {
    return (
      <svg {...common}>
        <circle className="wx-sun" cx="24" cy="24" r="11" />
        <g className="wx-rays">
          <line x1="24" y1="5" x2="24" y2="11" />
          <line x1="9" y1="24" x2="15" y2="24" />
          <line x1="11" y1="11" x2="15" y2="15" />
        </g>
        <path className="wx-cloud" d="M26 46h22a9 9 0 0 0 1-18 12 12 0 0 0-23 2 8 8 0 0 0 0 16z" />
      </svg>
    );
  }
  // default: sun
  return (
    <svg {...common}>
      <circle className="wx-sun" cx="32" cy="32" r="13" />
      <g className="wx-rays">
        <line x1="32" y1="6" x2="32" y2="14" />
        <line x1="32" y1="50" x2="32" y2="58" />
        <line x1="6" y1="32" x2="14" y2="32" />
        <line x1="50" y1="32" x2="58" y2="32" />
        <line x1="13" y1="13" x2="19" y2="19" />
        <line x1="45" y1="45" x2="51" y2="51" />
        <line x1="51" y1="13" x2="45" y2="19" />
        <line x1="19" y1="45" x2="13" y2="51" />
      </g>
    </svg>
  );
}
