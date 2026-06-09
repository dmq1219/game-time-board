import React from "react";
import { exportCsv, exportJson } from "../utils/export";

const SCREEN_TIME_OPTIONS = [30, 60, 90];

export default function SettingsPage({
  children,
  setChildren,
  dailyRecords,
  settings,
  setSettings
}) {
  function updateChildName(childId, name) {
    setChildren((current) =>
      current.map((child) => (child.id === childId ? { ...child, name } : child))
    );
  }

  function updateChecklistItem(childId, index, value) {
    setChildren((current) =>
      current.map((child) => {
        if (child.id !== childId) return child;
        const checklistItems = child.checklistItems.map((item, itemIndex) =>
          itemIndex === index ? value : item
        );
        return { ...child, checklistItems };
      })
    );
  }

  function updateSettings(partial) {
    setSettings((current) => ({
      ...current,
      ...partial
    }));
  }

  return (
    <section className="page settings-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Local settings</p>
          <h2>Settings</h2>
        </div>
      </div>

      <div className="settings-grid">
        <section className="settings-panel">
          <div className="panel-heading">
            <h3>孩子名字</h3>
            <span>4 位</span>
          </div>
          <div className="field-stack">
            {children.map((child) => (
              <label key={child.id} className="field">
                <span>{child.id}</span>
                <input
                  type="text"
                  value={child.name}
                  onChange={(event) => updateChildName(child.id, event.target.value)}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="settings-panel wide">
          <div className="panel-heading">
            <h3>Checklist</h3>
            <span>每人 5 项</span>
          </div>
          <div className="checklist-editor">
            {children.map((child) => (
              <div key={child.id} className="checklist-edit-group">
                <strong>{child.name}</strong>
                {child.checklistItems.map((item, index) => (
                  <label key={`${child.id}-${index}`} className="field compact">
                    <span>{index + 1}</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(event) =>
                        updateChecklistItem(child.id, index, event.target.value)
                      }
                    />
                  </label>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="settings-panel">
          <div className="panel-heading">
            <h3>时间设置</h3>
            <span>本机保存</span>
          </div>
          <div className="field-stack">
            <label className="field">
              <span>设备交回时间</span>
              <input
                type="time"
                value={settings.deviceReturnTime}
                onChange={(event) => updateSettings({ deviceReturnTime: event.target.value })}
              />
            </label>
            <label className="field">
              <span>默认游戏时间</span>
              <select
                value={settings.defaultScreenTimeMinutes}
                onChange={(event) =>
                  updateSettings({ defaultScreenTimeMinutes: Number(event.target.value) })
                }
              >
                {SCREEN_TIME_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} min
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="settings-panel">
          <div className="panel-heading">
            <h3>导出</h3>
            <span>JSON / CSV</span>
          </div>
          <div className="export-actions">
            <button
              type="button"
              className="primary"
              onClick={() => exportJson({ children, dailyRecords, settings })}
            >
              导出 JSON
            </button>
            <button type="button" onClick={() => exportCsv({ children, dailyRecords })}>
              导出 CSV
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
