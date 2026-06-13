import React from "react";

const TASK_BY_INDEX = ["room", "laundry", "cleanup", "study", "prep"];

function getTaskType(item, index) {
  const text = String(item ?? "").toLowerCase();

  if (/衣|洗衣|basket|laundry/.test(text)) return "laundry";
  if (/餐|垃圾|trash|dish|clean/.test(text)) return "cleanup";
  if (/读|阅读|作业|homework|book|read/.test(text)) return "study";
  if (/明天|准备|用品|书包|prep|bag/.test(text)) return "prep";
  if (/房间|整理|room|tidy|bed/.test(text)) return "room";

  return TASK_BY_INDEX[index % TASK_BY_INDEX.length];
}

function RoomIllustration() {
  return (
    <>
      <rect className="task-fill task-fill-soft" x="12" y="39" width="72" height="18" rx="6" />
      <rect className="task-fill task-fill-main" x="16" y="30" width="30" height="13" rx="4" />
      <path className="task-line" d="M16 55V29M80 55V36" />
      <path className="task-line" d="M52 31h20v18H52z" />
      <path className="task-line" d="M58 37h8M58 43h8" />
      <path className="task-line task-line-check" d="m65 21 5 5 10-13" />
      <circle className="task-dot" cx="27" cy="23" r="5" />
    </>
  );
}

function LaundryIllustration() {
  return (
    <>
      <path className="task-fill task-fill-soft" d="M52 35h30l-5 25H57z" />
      <path className="task-line" d="M52 35h30l-5 25H57zM58 42h20M60 49h16" />
      <path className="task-fill task-fill-main" d="M17 24 28 16l8 7 8-7 11 8-7 10-5-3v23H29V31l-5 3z" />
      <path className="task-line" d="M17 24 28 16l8 7 8-7 11 8-7 10-5-3v23H29V31l-5 3z" />
      <path className="task-line task-arrow" d="M37 14c12 0 24 5 31 16m0 0-9-1m9 1-2-9" />
    </>
  );
}

function CleanupIllustration() {
  return (
    <>
      <circle className="task-fill task-fill-soft" cx="25" cy="42" r="17" />
      <circle className="task-line" cx="25" cy="42" r="17" />
      <circle className="task-line" cx="25" cy="42" r="7" />
      <path className="task-fill task-fill-main" d="M58 31h24l-4 29H62z" />
      <path className="task-line" d="M56 31h28M61 31l3 29h14l3-29M64 24h14M67 39v14M74 39v14" />
      <path className="task-line task-arrow" d="M35 20c9-6 19-5 27 1m0 0-8 2m8-2-3-7" />
    </>
  );
}

function StudyIllustration() {
  return (
    <>
      <path className="task-fill task-fill-soft" d="M15 25c11-5 21-4 31 2v31c-10-6-20-7-31-2z" />
      <path className="task-fill task-fill-main" d="M81 25c-11-5-21-4-31 2v31c10-6 20-7 31-2z" />
      <path className="task-line" d="M15 25c11-5 21-4 31 2v31c-10-6-20-7-31-2zM81 25c-11-5-21-4-31 2v31c10-6 20-7 31-2zM48 27v31" />
      <path className="task-line" d="M23 35h14M23 43h14M58 35h14M58 43h14" />
      <path className="task-line task-line-check" d="m57 18 5 5 10-13" />
    </>
  );
}

function PrepIllustration() {
  return (
    <>
      <path className="task-fill task-fill-main" d="M25 25h38c7 0 13 6 13 13v24H12V38c0-7 6-13 13-13z" />
      <path className="task-line" d="M25 25h38c7 0 13 6 13 13v24H12V38c0-7 6-13 13-13zM32 25v-5c0-5 5-9 12-9s12 4 12 9v5M28 42h32" />
      <rect className="task-fill task-fill-soft" x="56" y="13" width="28" height="29" rx="5" />
      <path className="task-line" d="M56 20h28M63 13v8M77 13v8M63 29h4M73 29h4M63 36h4" />
      <path className="task-line task-line-check" d="m25 47 5 5 11-14" />
    </>
  );
}

export default function TaskIllustration({ item, index, completed }) {
  const taskType = getTaskType(item, index);
  const Illustration =
    taskType === "laundry"
      ? LaundryIllustration
      : taskType === "cleanup"
        ? CleanupIllustration
        : taskType === "study"
          ? StudyIllustration
          : taskType === "prep"
            ? PrepIllustration
            : RoomIllustration;

  return (
    <span className={completed ? "task-visual done" : "task-visual"} aria-hidden="true">
      <svg viewBox="0 0 96 72" focusable="false">
        <Illustration />
      </svg>
    </span>
  );
}
