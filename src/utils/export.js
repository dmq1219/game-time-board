import { todayKey } from "./date";

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportJson({ children, dailyRecords, settings }) {
  const payload = {
    exportedAt: new Date().toISOString(),
    children,
    dailyRecords,
    settings
  };

  downloadFile(
    `game-time-board-${todayKey()}.json`,
    JSON.stringify(payload, null, 2),
    "application/json;charset=utf-8"
  );
}

export function exportCsv({ children, dailyRecords }) {
  const childNameById = new Map(children.map((child) => [child.id, child.name]));
  const header = [
    "date",
    "childId",
    "childName",
    "completedItems",
    "totalItems",
    "checklistStatus",
    "screenTimeMinutes",
    "deviceReturned"
  ];

  const rows = dailyRecords.map((record) => {
    const status = record.checklistStatus ?? [];
    return [
      record.date,
      record.childId,
      childNameById.get(record.childId) ?? "",
      status.filter(Boolean).length,
      status.length,
      status.map((item) => (item ? "1" : "0")).join(""),
      record.screenTimeMinutes,
      record.deviceReturned ? "true" : "false"
    ];
  });

  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");

  downloadFile(`game-time-board-${todayKey()}.csv`, csv, "text/csv;charset=utf-8");
}
