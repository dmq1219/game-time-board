import React from "react";

const RULES = [
  "No food trash in rooms.",
  "Devices return on time.",
  "Clothes not in basket will not be washed."
];

export default function RulesPage() {
  return (
    <section className="page rules-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Family baseline</p>
          <h2>Rules Page</h2>
        </div>
      </div>

      <ol className="rules-list">
        {RULES.map((rule, index) => (
          <li key={rule}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{rule}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}
