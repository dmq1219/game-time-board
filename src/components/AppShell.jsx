import React from "react";

const NAV_ITEMS = [
  { id: "today", label: "Today" },
  { id: "timer", label: "Timer" },
  { id: "rules", label: "Rules" },
  { id: "weekly", label: "Weekly" },
  { id: "settings", label: "Settings" }
];

export default function AppShell({ activePage, onPageChange, children }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Offline family PWA</p>
          <h1>游戏时间看板</h1>
        </div>
        <nav className="nav-tabs" aria-label="主要页面">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activePage === item.id ? "active" : ""}
              onClick={() => onPageChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
