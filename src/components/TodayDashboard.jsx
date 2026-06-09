import React from "react";
import ChildCard from "./ChildCard";
import { todayKey } from "../utils/date";

export default function TodayDashboard({ children, settings, getRecord, updateRecord }) {
  const date = todayKey();

  return (
    <section className="page today-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{date}</p>
          <h2>Today Dashboard</h2>
        </div>
        <div className="return-time">
          <span>设备交回时间</span>
          <strong>{settings.deviceReturnTime}</strong>
        </div>
      </div>

      <div className="children-grid">
        {children.map((child) => (
          <ChildCard
            key={child.id}
            child={child}
            record={getRecord(child.id, date)}
            defaultMinutes={settings.defaultScreenTimeMinutes}
            updateRecord={(update) => updateRecord(child.id, update, date)}
          />
        ))}
      </div>
    </section>
  );
}
