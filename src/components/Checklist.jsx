import React from "react";

export default function Checklist({ items, status, onChange }) {
  return (
    <div className="checklist" aria-label="今日清单">
      {items.map((item, index) => (
        <label key={`${item}-${index}`} className="check-row">
          <input
            type="checkbox"
            checked={Boolean(status[index])}
            onChange={(event) => onChange(index, event.target.checked)}
          />
          <span>{item}</span>
        </label>
      ))}
    </div>
  );
}
