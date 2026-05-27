export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export const PHASE_LABELS: Record<CyclePhase, { medical: string; subtitle: string }> = {
  menstrual: { medical: "月经期", subtitle: "蛰伏与释放" },
  follicular: { medical: "卵泡期", subtitle: "苏醒与升起" },
  ovulatory: { medical: "排卵期", subtitle: "盛放与巅峰" },
  luteal: { medical: "黄体期", subtitle: "沉淀与内省" },
};

export function computeCycleState(lastStart: Date | null, cycleLength = 28, periodLength = 5, cursorDate = new Date()) {
  if (!lastStart) return { phase: "follicular" as CyclePhase, cycleDay: 10, periodLength, cycleLength };
  
  const diffTime = cursorDate.getTime() - lastStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  let cycleDay = (diffDays % cycleLength) + 1;
  if (cycleDay <= 0) cycleDay += cycleLength;
  
  let phase: CyclePhase = "follicular";
  if (cycleDay <= periodLength) phase = "menstrual";
  else if (cycleDay <= 13) phase = "follicular";
  else if (cycleDay <= 16) phase = "ovulatory";
  else phase = "luteal";
  
  return { phase, cycleDay, periodLength, cycleLength };
}

function atLocalStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getPeriodPrediction(
  lastStart: Date | null,
  cycleLength = 28,
  reminderDaysBefore = 3,
  cursorDate = new Date()
) {
  if (!lastStart) {
    return null;
  }

  const today = atLocalStartOfDay(cursorDate);
  const start = atLocalStartOfDay(lastStart);
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const cyclesElapsed = Math.max(0, Math.floor(diffDays / cycleLength) + 1);
  const nextPeriodStart = addDays(start, cyclesElapsed * cycleLength);
  const reminderDate = addDays(nextPeriodStart, -reminderDaysBefore);
  const daysUntilPeriod = Math.ceil((nextPeriodStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilReminder = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isReminderWindow = daysUntilPeriod >= 0 && daysUntilPeriod <= reminderDaysBefore;

  return {
    nextPeriodStart,
    reminderDate,
    nextPeriodStartKey: formatDate(nextPeriodStart),
    reminderDateKey: formatDate(reminderDate),
    daysUntilPeriod,
    daysUntilReminder,
    isReminderWindow,
  };
}
