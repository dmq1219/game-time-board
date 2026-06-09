import React from "react";
import { formatShortDate, getLastDays } from "../utils/date";

export default function WeeklySummary({ children, dailyRecords }) {
  const days = getLastDays(7);

  function recordFor(childId, date) {
    return dailyRecords.find((record) => record.childId === childId && record.date === date);
  }

  function isComplete(child, date) {
    const record = recordFor(child.id, date);
    if (!record) return false;
    const status = Array.from(
      { length: child.checklistItems.length },
      (_, index) => Boolean(record.checklistStatus?.[index])
    );
    return status.length > 0 && status.every(Boolean);
  }

  return (
    <section className="page weekly-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Past 7 days</p>
          <h2>Weekly Summary</h2>
        </div>
      </div>

      <div className="summary-table" role="table" aria-label="过去 7 天完成情况">
        <div className="summary-row summary-header" role="row">
          <div role="columnheader">孩子</div>
          {days.map((day) => (
            <div key={day} role="columnheader">
              {formatShortDate(day)}
            </div>
          ))}
          <div role="columnheader">完成天数</div>
        </div>

        {children.map((child) => {
          const completeDays = days.filter((day) => isComplete(child, day));
          return (
            <div key={child.id} className="summary-row" role="row">
              <div className="child-name-cell" role="cell">
                {child.name}
              </div>
              {days.map((day) => (
                <div key={day} role="cell">
                  <span
                    className={isComplete(child, day) ? "day-dot complete" : "day-dot"}
                    aria-label={isComplete(child, day) ? "完成" : "未完成"}
                  />
                </div>
              ))}
              <div className="days-count" role="cell">
                {completeDays.length} 天
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
