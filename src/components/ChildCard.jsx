import React from "react";
import Checklist from "./Checklist";
import DeviceReturnStatus from "./DeviceReturnStatus";
import ScreenTimeTimer from "./ScreenTimeTimer";

export default function ChildCard({ child, record, defaultMinutes, updateRecord }) {
  const completedCount = record.checklistStatus.filter(Boolean).length;
  const totalCount = child.checklistItems.length;
  const isChecklistDone = totalCount > 0 && completedCount === totalCount;

  function handleChecklistChange(index, checked) {
    updateRecord((current) => {
      const nextStatus = Array.from(
        { length: child.checklistItems.length },
        (_, itemIndex) => Boolean(current.checklistStatus?.[itemIndex])
      );
      nextStatus[index] = checked;

      return {
        ...current,
        checklistStatus: nextStatus
      };
    });
  }

  return (
    <article className={isChecklistDone ? "child-card timer-ready" : "child-card"}>
      <div className="child-card-header">
        <div>
          <p className="eyebrow">Child</p>
          <h3>{child.name}</h3>
        </div>
        <div className={isChecklistDone ? "count-pill complete" : "count-pill"}>
          {completedCount}/{totalCount}
        </div>
      </div>

      <Checklist
        items={child.checklistItems}
        status={record.checklistStatus}
        onChange={handleChecklistChange}
      />

      {isChecklistDone ? (
        <ScreenTimeTimer
          record={record}
          defaultMinutes={defaultMinutes}
          updateRecord={updateRecord}
        />
      ) : (
        <div className="locked-timer">
          <span>完成 5 项后显示游戏时间</span>
        </div>
      )}

      <DeviceReturnStatus record={record} updateRecord={updateRecord} />
    </article>
  );
}
