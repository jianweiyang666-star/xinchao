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
