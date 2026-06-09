import React from "react";
import { stopAlarm } from "../utils/sound";

export default function DeviceReturnStatus({ record, updateRecord }) {
  const needsReturn = record.timerStatus === "expired" && !record.deviceReturned;
  const statusText = record.deviceReturned
    ? "已归还"
    : needsReturn
      ? "归还"
      : record.timerStatus === "running"
        ? "计时中"
        : "未到归还时间";

  function confirmReturned() {
    stopAlarm();
    updateRecord((current) => ({
      ...current,
      deviceReturned: true,
      timerStatus: "done",
      endAt: null,
      remainingSeconds: 0
    }));
  }

  return (
    <div className={needsReturn ? "return-status needs-return" : "return-status"}>
      <div>
        <span>Device return status</span>
        <strong>{statusText}</strong>
      </div>
      {needsReturn && (
        <button type="button" className="primary" onClick={confirmReturned}>
          确认归还
        </button>
      )}
    </div>
  );
}
