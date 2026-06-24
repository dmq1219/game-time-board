import React from "react";
import WeatherIcon from "./WeatherIcon";
import SettingsMenu from "./SettingsMenu";
import MemberAvatarStrip from "./MemberAvatarStrip";
import { formatLongDate, formatClock, formatTime } from "../utils/calendar";
import { memberById } from "../data/familyData";

// Header band: brand + gear menu (left), next-up event (centre),
// live weather + clock with the date tucked under it (right).
export default function TopBar({
  now,
  familyName,
  weather,
  nextEvt,
  members,
  page,
  onChangePage,
  importCount,
  onRename,
  onPhotoMode,
  onReset,
  onAddForMember
}) {
  const { time, period } = formatClock(now);
  const member = nextEvt ? memberById(members, nextEvt.memberId) : null;

  return (
    <header className="fh-topbar">
      <div className="fh-topbar-left">
        <div className="fh-brand">
          <p className="fh-eyebrow">Family Hub · 家庭中控</p>
          <h1 className="fh-family-name">{familyName}</h1>
        </div>
        <SettingsMenu
          page={page}
          onChangePage={onChangePage}
          importCount={importCount}
          onRename={onRename}
          onPhotoMode={onPhotoMode}
          onReset={onReset}
        />
      </div>

      {nextEvt ? (
        <div className="fh-nextup" style={{ "--member": member?.color ?? "#2f6fed" }}>
          <span className="fh-nextup-label">Next up · 下一件事</span>
          <span className="fh-nextup-body">
            <strong>{nextEvt.title}</strong>
            <em>
              {nextEvt.allDay ? "All day" : formatTime(nextEvt.start)}
              {member ? ` · ${member.name}` : ""}
            </em>
          </span>
        </div>
      ) : (
        <div className="fh-nextup fh-nextup-empty">
          <span className="fh-nextup-body">
            <strong>Free today 🎉</strong>
            <em>暂无安排</em>
          </span>
        </div>
      )}

      <MemberAvatarStrip members={members} date={now} onAddForMember={onAddForMember} />

      <div className="fh-topbar-right">
        <div className="fh-weather">
          <WeatherIcon icon={weather.icon} size={56} />
          <div className="fh-weather-text">
            <strong>{weather.tempF}°F</strong>
            <span>
              {weather.condition} · {weather.city}
            </span>
          </div>
        </div>
        <div className="fh-clock-wrap">
          <div className="fh-clock" aria-label="Current time">
            <span className="fh-clock-time">{time}</span>
            <span className="fh-clock-period">{period}</span>
          </div>
          <p className="fh-clock-date">{formatLongDate(now)}</p>
        </div>
      </div>
    </header>
  );
}
