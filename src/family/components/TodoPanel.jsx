import React, { useState } from "react";

// Simple family to-do list with quick add.
export default function TodoPanel({ todos, onToggle, onAdd, onRemove }) {
  const [text, setText] = useState("");
  const submit = (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    onAdd(value);
    setText("");
  };

  return (
    <section className="fh-card fh-todo">
      <div className="fh-panel-head">
        <h3>To-Do ✅</h3>
        <span>待办</span>
      </div>
      <ul className="fh-list">
        {todos.map((t) => (
          <li key={t.id} className={`fh-list-row${t.done ? " done" : ""}`}>
            <button type="button" className="fh-list-check" onClick={() => onToggle(t.id)}>
              <span className="fh-check" aria-hidden>
                {t.done ? "✓" : ""}
              </span>
              <span className="fh-list-text">{t.title}</span>
            </button>
            <button
              type="button"
              className="fh-list-del"
              onClick={() => onRemove(t.id)}
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
          placeholder="Add a task…"
          aria-label="New task"
        />
        <button type="submit" className="fh-mini-btn">
          Add
        </button>
      </form>
    </section>
  );
}
