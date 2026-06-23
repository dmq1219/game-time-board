import React from "react";
import WeatherIcon from "./WeatherIcon";
import { formatLongDate, formatClock } from "../utils/calendar";

// Header band: family name, today's date, big clock, and weather.
export default function TopBar({ now, familyName, weather }) {
  const { time, period } = formatClock(now);

  return (
    <header className="fh-topbar">
      <div className="fh-topbar-left">
        <p className="fh-eyebrow">Family Hub · 家庭中控</p>
        <h1 className="fh-family-name">{familyName}</h1>
        <p className="fh-today-date">{formatLongDate(now)}</p>
      </div>

      <div className="fh-topbar-right">
        <div className="fh-weather">
          <WeatherIcon icon={weather.icon} size={64} />
          <div className="fh-weather-text">
            <strong>{weather.tempF}°F</strong>
            <span>
              {weather.condition} · {weather.city}
            </span>
          </div>
        </div>
        <div className="fh-clock" aria-label="Current time">
          <span className="fh-clock-time">{time}</span>
          <span className="fh-clock-period">{period}</span>
        </div>
      </div>
    </header>
  );
}
