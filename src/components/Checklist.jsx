import React from "react";
import TaskIllustration from "./TaskIllustration";

export default function Checklist({ items, status, onChange }) {
  return (
    <div className="checklist" aria-label="今日清单">
      {items.map((item, index) => {
        const completed = Boolean(status[index]);

        return (
          <label key={`${item}-${index}`} className="check-row">
            <input
              type="checkbox"
              checked={completed}
              onChange={(event) => onChange(index, event.target.checked)}
            />
            <TaskIllustration item={item} index={index} completed={completed} />
            <span className="check-text">{item}</span>
          </label>
        );
      })}
    </div>
  );
}
