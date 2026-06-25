import React, { useEffect, useState } from "react";

// Add / edit event dialog. `draft` may be a partial (new) or full (existing) event.
export default function EventModal({ draft, members, onSave, onDelete, onClose }) {
  const isEdit = Boolean(draft?.id);
  const [form, setForm] = useState(() => ({
    title: draft?.title ?? "",
    memberId: draft?.memberId ?? members[0]?.id,
    date: draft?.date ?? "",
    allDay: draft?.allDay ?? false,
    start: draft?.start ?? "09:00",
    end: draft?.end ?? "10:00",
    location: draft?.location ?? ""
  }));

  // Close on Escape for keyboard / external-keyboard kiosks.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      ...draft,
      title: form.title.trim(),
      memberId: form.memberId,
      date: form.date,
      allDay: form.allDay,
      start: form.allDay ? null : form.start,
      end: form.allDay ? null : form.end,
      location: form.location.trim()
    });
  };

  return (
    <div className="fh-modal-backdrop" onClick={onClose}>
      <div
        className="fh-modal"
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit event" : "Add event"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fh-modal-head">
          <h3>{isEdit ? "Edit Event" : "Add Event"}</h3>
          <button type="button" className="fh-modal-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="fh-modal-body" onSubmit={submit}>
          <label className="fh-field">
            <span>Title 标题</span>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="e.g. Soccer practice"
            />
          </label>

          <label className="fh-field">
            <span>Who 成员</span>
            <div className="fh-member-pick">
              {members.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  className={`fh-pick${form.memberId === m.id ? " active" : ""}`}
                  style={{ "--member": m.color }}
                  onClick={() => set({ memberId: m.id })}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </label>

          <div className="fh-field-row">
            <label className="fh-field">
              <span>Date 日期</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set({ date: e.target.value })}
              />
            </label>
            <label className="fh-field fh-allday-toggle">
              <span>All day 全天</span>
              <input
                type="checkbox"
                checked={form.allDay}
                onChange={(e) => set({ allDay: e.target.checked })}
              />
            </label>
          </div>

          {!form.allDay && (
            <div className="fh-field-row">
              <label className="fh-field">
                <span>Start 开始</span>
                <input
                  type="time"
                  value={form.start}
                  onChange={(e) => set({ start: e.target.value })}
                />
              </label>
              <label className="fh-field">
                <span>End 结束</span>
                <input
                  type="time"
                  value={form.end}
                  onChange={(e) => set({ end: e.target.value })}
                />
              </label>
            </div>
          )}

          <label className="fh-field">
            <span>Location 地点</span>
            <input
              value={form.location}
              onChange={(e) => set({ location: e.target.value })}
              placeholder="Optional"
            />
          </label>

          <div className="fh-modal-actions">
            {isEdit && (
              <button
                type="button"
                className="fh-btn-danger"
                onClick={() => onDelete(draft.id)}
              >
                Delete
              </button>
            )}
            <div className="fh-modal-actions-right">
              <button type="button" className="fh-btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="fh-btn-primary">
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
