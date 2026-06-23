import React from "react";

// Dashboard meal summary: tonight's dinner, tomorrow's breakfast, shopping count.
// Full editing lives on the Meal Plan page (onOpenPlanner).
export default function MealPlanPanel({ meals, todayDow, tomorrowDow, groceryRemaining, onOpenPlanner }) {
  const today = meals.find((m) => m.day === todayDow);
  const tomorrow = meals.find((m) => m.day === tomorrowDow);

  return (
    <section className="fh-card fh-meals">
      <div className="fh-panel-head">
        <h3>Meals 🍽️</h3>
        <button type="button" className="fh-link-btn" onClick={onOpenPlanner}>
          Plan week →
        </button>
      </div>
      <div className="fh-meal-summary">
        <div className="fh-meal-now">
          <span className="fh-meal-tag">Tonight · 今晚</span>
          <strong>{today?.dinner?.name || "Tap to plan"}</strong>
        </div>
        <div className="fh-meal-next">
          <span className="fh-meal-tag">Tomorrow AM · 明早</span>
          <strong>{tomorrow?.breakfast?.name || "—"}</strong>
        </div>
        <button type="button" className="fh-shop-pill" onClick={onOpenPlanner}>
          🛒 {groceryRemaining} to buy · 待购
        </button>
      </div>
    </section>
  );
}
