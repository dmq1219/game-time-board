import React, { useCallback, useMemo, useState } from "react";
import AppShell from "./components/AppShell";
import TodayDashboard from "./components/TodayDashboard";
import TimerPage from "./components/TimerPage";
import RulesPage from "./components/RulesPage";
import WeeklySummary from "./components/WeeklySummary";
import SettingsPage from "./components/SettingsPage";
import { DEFAULT_CHILDREN, DEFAULT_SETTINGS, createDailyRecord } from "./data/defaults";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { todayKey } from "./utils/date";

function normalizeStatus(status, length) {
  return Array.from({ length }, (_, index) => Boolean(status?.[index]));
}

export default function App() {
  const [activePage, setActivePage] = useState("today");
  const [children, setChildren] = useLocalStorage("gameTimeBoard.children", DEFAULT_CHILDREN);
  const [dailyRecords, setDailyRecords] = useLocalStorage("gameTimeBoard.dailyRecords", []);
  const [settings, setSettings] = useLocalStorage("gameTimeBoard.settings", DEFAULT_SETTINGS);

  const childrenById = useMemo(
    () => new Map(children.map((child) => [child.id, child])),
    [children]
  );

  const buildRecord = useCallback(
    (childId, date = todayKey()) => {
      const child = childrenById.get(childId);
      return createDailyRecord({
        date,
        childId,
        checklistLength: child?.checklistItems?.length ?? 5,
        defaultScreenTimeMinutes: settings.defaultScreenTimeMinutes
      });
    },
    [childrenById, settings.defaultScreenTimeMinutes]
  );

  const getRecord = useCallback(
    (childId, date = todayKey()) => {
      const child = childrenById.get(childId);
      const record =
        dailyRecords.find((item) => item.childId === childId && item.date === date) ??
        buildRecord(childId, date);

      return {
        ...record,
        checklistStatus: normalizeStatus(record.checklistStatus, child?.checklistItems?.length ?? 5),
        screenTimeMinutes: Number(record.screenTimeMinutes) || settings.defaultScreenTimeMinutes,
        remainingSeconds:
          Number(record.remainingSeconds) || (Number(record.screenTimeMinutes) || 60) * 60
      };
    },
    [buildRecord, childrenById, dailyRecords, settings.defaultScreenTimeMinutes]
  );

  const updateRecord = useCallback(
    (childId, update, date = todayKey()) => {
      setDailyRecords((records) => {
        const child = childrenById.get(childId);
        const index = records.findIndex((item) => item.childId === childId && item.date === date);
        const base = index >= 0 ? records[index] : buildRecord(childId, date);
        const changed = typeof update === "function" ? update(base) : { ...base, ...update };
        const normalized = {
          ...changed,
          checklistStatus: normalizeStatus(
            changed.checklistStatus,
            child?.checklistItems?.length ?? 5
          )
        };

        if (index >= 0) {
          return records.map((record, recordIndex) => (recordIndex === index ? normalized : record));
        }

        return [...records, normalized];
      });
    },
    [buildRecord, childrenById, setDailyRecords]
  );

  return (
    <AppShell activePage={activePage} onPageChange={setActivePage}>
      {activePage === "today" && (
        <TodayDashboard
          children={children}
          settings={settings}
          getRecord={getRecord}
          updateRecord={updateRecord}
        />
      )}
      {activePage === "timer" && <TimerPage />}
      {activePage === "rules" && <RulesPage />}
      {activePage === "weekly" && (
        <WeeklySummary children={children} dailyRecords={dailyRecords} getRecord={getRecord} />
      )}
      {activePage === "settings" && (
        <SettingsPage
          children={children}
          setChildren={setChildren}
          dailyRecords={dailyRecords}
          settings={settings}
          setSettings={setSettings}
        />
      )}
    </AppShell>
  );
}
