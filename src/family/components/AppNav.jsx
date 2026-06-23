import React from "react";
import { formatTime } from "../utils/calendar";
import { memberById } from "../data/familyData";

const TABS = [
  { id: "dashboard", label: "Dashboard", cn: "首页" },
  { id: "meals", label: "Meal Plan", cn: "餐食" },
  { id: "import", label: "Import", cn: "导入" },
  { id: "photos", label: "Photos", cn: "照片" }
];

// Page tabs + an always-visible "next important event" pill.
export default function AppNav({ page, onChange, nextEvt, members }) {
  const member = nextEvt ? memberById(members, nextEvt.memberId) : null;

  return (
    <nav className="fh-nav" aria-label="Sections">
      <div className="fh-nav-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`fh-nav-tab${page === t.id ? " active" : ""}`}
            onClick={() => onChange(t.id)}
          >
            {t.label}
            <em>{t.cn}</em>
          </button>
        ))}
      </div>

      {nextEvt && (
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
      )}
    </nav>
  );
}
