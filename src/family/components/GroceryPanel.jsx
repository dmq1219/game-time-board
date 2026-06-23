import React, { useState } from "react";

// Shared grocery list. Tapping an item marks it as "got".
export default function GroceryPanel({ grocery, onToggle, onAdd, onRemove }) {
  const [text, setText] = useState("");
  const remaining = grocery.filter((g) => !g.got).length;

  const submit = (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    onAdd(value);
    setText("");
  };

  return (
    <section className="fh-card fh-grocery">
      <div className="fh-panel-head">
        <h3>Grocery 🛒</h3>
        <span>{remaining} left · 采购</span>
      </div>
      <ul className="fh-list">
        {grocery.map((g) => (
          <li key={g.id} className={`fh-list-row${g.got ? " done" : ""}`}>
            <button type="button" className="fh-list-check" onClick={() => onToggle(g.id)}>
              <span className="fh-check" aria-hidden>
                {g.got ? "✓" : ""}
              </span>
              <span className="fh-list-text">{g.name}</span>
              {g.qty && <span className="fh-qty">{g.qty}</span>}
            </button>
            <button
              type="button"
              className="fh-list-del"
              onClick={() => onRemove(g.id)}
              aria-label="Remove"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <form className="fh-add-row" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an item…"
          aria-label="New grocery item"
        />
        <button type="submit" className="fh-mini-btn">
          Add
        </button>
      </form>
    </section>
  );
}
