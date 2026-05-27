export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export const PHASE_LABELS: Record<CyclePhase, { medical: string; subtitle: string }> = {
  menstrual: { medical: "月经期", subtitle: "蛰伏与释放" },
  follicular: { medical: "卵泡期", subtitle: "苏醒与升起" },
  ovulatory: { medical: "排卵期", subtitle: "盛放与巅峰" },
  luteal: { medical: "黄体期", subtitle: "沉淀与内省" },
};

export const DEFAULT_PERIOD_LENGTH = 7;

export function parsePeriodStart(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : atLocalStartOfDay(parsed);
}

export function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function computeCycleState(lastStart: Date | null, cycleLength = 28, periodLength = DEFAULT_PERIOD_LENGTH, cursorDate = new Date()) {
  if (!lastStart) return { phase: "follicular" as CyclePhase, cycleDay: 10, periodLength, cycleLength };

  const diffTime = atLocalStartOfDay(cursorDate).getTime() - atLocalStartOfDay(lastStart).getTime();
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
    nextPeriodStartKey: formatLocalDateKey(nextPeriodStart),
    reminderDateKey: formatLocalDateKey(reminderDate),
    daysUntilPeriod,
    daysUntilReminder,
    isReminderWindow,
  };
}
