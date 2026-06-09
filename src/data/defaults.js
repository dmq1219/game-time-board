import { todayKey } from "../utils/date";

export const DEFAULT_CHECKLIST_ITEMS = [
  "房间整理完成",
  "衣服放进洗衣篮",
  "餐具和垃圾清理",
  "阅读或作业完成",
  "明天用品准备好"
];

export const DEFAULT_CHILDREN = [
  {
    id: "child-1",
    name: "Child 1",
    checklistItems: DEFAULT_CHECKLIST_ITEMS
  },
  {
    id: "child-2",
    name: "Child 2",
    checklistItems: DEFAULT_CHECKLIST_ITEMS
  },
  {
    id: "child-3",
    name: "Child 3",
    checklistItems: DEFAULT_CHECKLIST_ITEMS
  },
  {
    id: "child-4",
    name: "Child 4",
    checklistItems: DEFAULT_CHECKLIST_ITEMS
  }
];

export const DEFAULT_SETTINGS = {
  deviceReturnTime: "20:30",
  defaultScreenTimeMinutes: 60
};

export function createDailyRecord({
  date = todayKey(),
  childId,
  checklistLength = 5,
  defaultScreenTimeMinutes = 60
}) {
  return {
    date,
    childId,
    checklistStatus: Array.from({ length: checklistLength }, () => false),
    screenTimeMinutes: defaultScreenTimeMinutes,
    deviceReturned: false,
    timerStatus: "idle",
    endAt: null,
    remainingSeconds: defaultScreenTimeMinutes * 60
  };
}
