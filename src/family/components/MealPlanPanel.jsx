import React from "react";

// Weekly dinner plan. Today's row is highlighted. Tap to edit inline.
export default function MealPlanPanel({ meals, todayDow, onEdit }) {
  return (
    <section className="fh-card fh-meals">
      <div className="fh-panel-head">
        <h3>Meal Plan 🍽️</h3>
        <span>本周晚餐</span>
      </div>
      <ul className="fh-meal-list">
        {meals.map((m) => (
          <li key={m.day} className={`fh-meal-row${m.day === todayDow ? " is-today" : ""}`}>
            <span className="fh-meal-day">{m.label}</span>
            <button
              type="button"
              className="fh-meal-name"
              onClick={() => {
                const next = window.prompt(`Dinner for ${m.label}`, m.meal);
                if (next !== null) onEdit(m.day, next.trim());
              }}
            >
              {m.meal || "Tap to plan…"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
