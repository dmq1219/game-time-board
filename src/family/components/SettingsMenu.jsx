import React, { useEffect, useRef, useState } from "react";

const PAGES = [
  { id: "dashboard", label: "Dashboard", cn: "首页" },
  { id: "meals", label: "Meal Plan", cn: "餐食" },
  { id: "import", label: "邮件导入", cn: "学校邮件" },
  { id: "photos", label: "Photos", cn: "照片" }
];

// Gear button + dropdown that holds page navigation and the kiosk actions
// (rename / photo mode / reset) — replaces the old nav row and footer to
// reclaim screen space.
export default function SettingsMenu({
  page,
  onChangePage,
  importCount = 0,
  onRename,
  onPhotoMode,
  onReset
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (id) => {
    onChangePage(id);
    setOpen(false);
  };
  const run = (fn) => {
    setOpen(false);
    fn();
  };

  return (
    <div className="fh-gear" ref={ref}>
      <button
        type="button"
        className="fh-gear-btn"
        aria-label="Menu · 菜单"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path
            fill="currentColor"
            d="M19.14 12.94a7.49 7.49 0 0 0 .05-.94 7.49 7.49 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.34 8.2a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.05.62-.05.94 0 .32.02.63.05.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.31.6.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.2.09.47.01.6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"
          />
        </svg>
      </button>

      {open && (
        <div className="fh-gear-menu" role="menu">
          <div className="fh-gear-section">页面 · Pages</div>
          {PAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              role="menuitem"
              className={`fh-gear-item${page === p.id ? " active" : ""}`}
              onClick={() => pick(p.id)}
            >
              <span>
                {p.label} <em>{p.cn}</em>
              </span>
              {p.id === "import" && importCount > 0 && (
                <span className="fh-gear-item-badge">{importCount}</span>
              )}
            </button>
          ))}

          <div className="fh-gear-divider" />
          <div className="fh-gear-section">设置 · Settings</div>
          <button type="button" role="menuitem" className="fh-gear-item" onClick={() => run(onRename)}>
            <span>Rename family <em>改名</em></span>
          </button>
          <button type="button" role="menuitem" className="fh-gear-item" onClick={() => run(onPhotoMode)}>
            <span>Photo mode <em>屏保</em></span>
          </button>
          <button type="button" role="menuitem" className="fh-gear-item" onClick={() => run(onReset)}>
            <span>Reset demo <em>重置</em></span>
          </button>
        </div>
      )}
    </div>
  );
}
