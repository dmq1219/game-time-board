import React from "react";
import { memberById } from "../data/familyData";

// Chores checklist. Completing a chore credits its stars to that member (see RewardsPanel).
export default function ChoresPanel({ chores, members, onToggle }) {
  const done = chores.filter((c) => c.done).length;

  return (
    <section className="fh-card fh-chores">
      <div className="fh-panel-head">
        <h3>Chores ⭐</h3>
        <span>
          {done}/{chores.length} · 家务
        </span>
      </div>
      <ul className="fh-chore-list">
        {chores.map((c) => {
          const member = memberById(members, c.memberId);
          const color = member?.color ?? "#6b7280";
          return (
            <li key={c.id}>
              <button
                type="button"
                className={`fh-chore${c.done ? " done" : ""}`}
                onClick={() => onToggle(c.id)}
                style={{ "--member": color }}
              >
                <span className="fh-check" aria-hidden>
                  {c.done ? "✓" : ""}
                </span>
                <span className="fh-chore-text">{c.title}</span>
                <span className="fh-chore-who" style={{ color }}>
                  {member?.name}
                </span>
                <span className="fh-chore-stars">{"⭐".repeat(c.stars)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
