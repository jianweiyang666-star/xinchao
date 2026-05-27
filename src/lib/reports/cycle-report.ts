import type { JournalEntry, ObservationGoal, OnboardingAnswers, StatusTagCategory } from "@/lib/store";

export interface CycleReportMetric {
  label: string;
  current: string;
  compare: string;
  note: string;
}

export interface CycleReport {
  source: "local" | "ai";
  hasEnoughData: boolean;
  title: string;
  summary: string;
  rangeLabel: string;
  highestPain: {
    label: string;
    value: string;
  };
  hardestMoment: {
    label: string;
    value: string;
  };
  metrics: CycleReportMetric[];
  clues: string[];
  nextExperiment: string;
  disclaimer: string;
}

export interface CycleReportInput {
  todayKey?: string;
  lastPeriodStart: string | null;
  cycleLength: number;
  journal: Record<string, JournalEntry>;
  observationGoal: ObservationGoal | null;
  onboardingAnswers: OnboardingAnswers | null;
}

type JournalPair = [string, JournalEntry];

const NEGATIVE_MOOD = /烦躁|焦虑|低落|伤心|抑郁|易怒|情绪波动|内疚|困惑|无感/;
const FATIGUE_TAG = /疲惫|疲倦|没力气|精神不振|乏力/;
const PAIN_TAG = /痛|疼|酸|痉挛/;
const COLD_DRINK_TAG = /冰|冷饮|生冷/;
const STIMULATING_FOOD_TAG = /辣|辛辣|咖啡|浓茶|甜|高糖|外卖|油/;
const ACTIVE_EXERCISE_TAG = /散步|拉伸|瑜伽|普拉提|慢跑|力量|骑行|游泳|运动|活动/;

export function buildCycleReport(input: CycleReportInput): CycleReport {
  const todayKey = input.todayKey || toDateKey(new Date());
  const today = parseDateKey(todayKey);
  const cycleStart = input.lastPeriodStart ? atStartOfDay(new Date(input.lastPeriodStart)) : null;
  const rangeEnd = today || new Date();
  const rangeStart = cycleStart ? addDays(cycleStart, -14) : addDays(rangeEnd, -14);
  const previousRangeStart = cycleStart ? addDays(rangeStart, -input.cycleLength) : addDays(rangeStart, -28);
  const previousRangeEnd = cycleStart ? addDays(rangeEnd, -input.cycleLength) : addDays(rangeEnd, -28);

  const entries = sortedEntries(input.journal);
  const currentEntries = entries.filter(([key]) => isBetween(key, rangeStart, rangeEnd));
  const previousEntries = entries.filter(([key]) => isBetween(key, previousRangeStart, previousRangeEnd));
  const currentStats = summarizeEntries(currentEntries);
  const previousStats = summarizeEntries(previousEntries);

  const hasEnoughData = currentStats.recordCount >= 3 || currentStats.maxPain > 0 || Boolean(input.onboardingAnswers);
  if (!hasEnoughData) {
    return {
      source: "local",
      hasEnoughData: false,
      title: "本周期复盘",
      summary: "再记录几次，心潮就能帮你看规律。",
      rangeLabel: "最近两周",
      highestPain: { label: "本周期最高痛感", value: "--" },
      hardestMoment: { label: "最难受时间", value: "暂无记录" },
      metrics: defaultMetrics(),
      clues: ["可以先从疼痛、饮食、运动或情绪里选一个顺手记录。"],
      nextExperiment: "这个周期先不用改变习惯，先把真实感受记下来就够了。",
      disclaimer: "目前记录还不多，先不做规律判断。",
    };
  }

  const hardestMoment = currentStats.maxPainEntry
    ? `${formatMonthDay(parseDateKey(currentStats.maxPainEntry[0]) || rangeEnd)}`
    : input.onboardingAnswers?.painTiming || "暂未记录";

  const clues = buildClues(currentStats);
  const nextExperiment = buildNextExperiment(input.observationGoal?.title || input.onboardingAnswers?.customObservationGoal || input.onboardingAnswers?.observationGoal || "", currentStats);

  return {
    source: "local",
    hasEnoughData,
    title: "本周期复盘",
    summary: "你离了解自己更近了一点。",
    rangeLabel: `根据 ${formatMonthDay(rangeStart)} 到 ${formatMonthDay(rangeEnd)} 的记录生成`,
    highestPain: {
      label: "本周期最高痛感",
      value: currentStats.maxPain > 0 ? `${currentStats.maxPain} 分` : "--",
    },
    hardestMoment: {
      label: "最难受时间",
      value: hardestMoment,
    },
    metrics: [
      {
        label: "疼痛记录",
        current: `${currentStats.painCount} 次 · 最高 ${currentStats.maxPain || "--"} 分`,
        compare: comparePain(currentStats.maxPain, previousStats.maxPain),
        note: currentStats.maxPainEntry
          ? `主要出现在 ${formatMonthDay(parseDateKey(currentStats.maxPainEntry[0]) || rangeEnd)}`
          : "暂时没有明确痛感记录",
      },
      {
        label: "运动记录",
        current: `${currentStats.exerciseCount} 次${currentStats.exerciseCount > 0 ? " · 轻中强度" : ""}`,
        compare: compareCount(currentStats.exerciseCount, previousStats.exerciseCount),
        note: currentStats.exerciseCount > 0 ? "以散步、拉伸或低负担活动为主" : "可以先从散步或拉伸开始记录",
      },
      {
        label: "情绪波动",
        current: `${currentStats.moodFluctuationCount} 次`,
        compare: compareCount(currentStats.moodFluctuationCount, previousStats.moodFluctuationCount),
        note: currentStats.moodFluctuationCount > 0 ? "可继续观察经前几天是否更明显" : "暂时没有明显情绪波动记录",
      },
      {
        label: "疲惫记录",
        current: `${currentStats.fatigueCount} 次`,
        compare: compareCount(currentStats.fatigueCount, previousStats.fatigueCount),
        note: currentStats.fatigueCount > 0 ? "疲惫可和睡眠、运动一起看" : "暂时没有疲惫相关记录",
      },
    ],
    clues,
    nextExperiment,
    disclaimer: "目前记录还不多，这些只是帮助你观察自己的线索，不代表确定因果，建议继续记录 1-2 个周期。",
  };
}

export function compactReportForPrompt(report: CycleReport) {
  return {
    hasEnoughData: report.hasEnoughData,
    summary: report.summary,
    rangeLabel: report.rangeLabel,
    highestPain: report.highestPain,
    hardestMoment: report.hardestMoment,
    metrics: report.metrics,
    clues: report.clues,
    nextExperiment: report.nextExperiment,
    disclaimer: report.disclaimer,
  };
}

function summarizeEntries(entries: JournalPair[]) {
  let maxPain = 0;
  let maxPainEntry: JournalPair | null = null;
  let painCount = 0;
  let exerciseCount = 0;
  let moodFluctuationCount = 0;
  let fatigueCount = 0;
  let coldDrinkCount = 0;
  let stimulantFoodCount = 0;
  let recordCount = 0;

  entries.forEach(([key, entry]) => {
    const tags = flattenTags(entry);
    const hasAnyRecord = tags.length > 0 || Boolean(entry.pain) || Boolean(entry.periodStarted) || Boolean(entry.note);
    if (hasAnyRecord) recordCount += 1;

    if (entry.pain) {
      painCount += 1;
      if (entry.pain.level > maxPain) {
        maxPain = entry.pain.level;
        maxPainEntry = [key, entry];
      }
    } else if (tags.some(tag => PAIN_TAG.test(tag))) {
      painCount += 1;
    }

    if (tags.some(tag => ACTIVE_EXERCISE_TAG.test(tag)) && !tags.includes("没运动")) exerciseCount += 1;
    if (entry.statusTags?.mood?.some(tag => NEGATIVE_MOOD.test(tag))) moodFluctuationCount += 1;
    if (tags.some(tag => FATIGUE_TAG.test(tag))) fatigueCount += 1;
    if (tags.some(tag => COLD_DRINK_TAG.test(tag))) coldDrinkCount += 1;
    if (tags.some(tag => STIMULATING_FOOD_TAG.test(tag))) stimulantFoodCount += 1;
  });

  return {
    recordCount,
    maxPain,
    maxPainEntry,
    painCount,
    exerciseCount,
    moodFluctuationCount,
    fatigueCount,
    coldDrinkCount,
    stimulantFoodCount,
  };
}

function buildClues(stats: ReturnType<typeof summarizeEntries>) {
  const clues: string[] = [];
  if (stats.coldDrinkCount > 0) {
    clues.push(`最近记录了 ${stats.coldDrinkCount} 次冰饮或生冷相关线索，可以继续观察它和腹胀、痛感是否一起出现。`);
  }
  if (stats.exerciseCount > 0) {
    clues.push(`运动记录已经有 ${stats.exerciseCount} 次，可以继续看轻运动后身体会不会更舒服。`);
  }
  if (stats.moodFluctuationCount > 0 || stats.fatigueCount > 0) {
    clues.push("情绪和疲惫记录可以放在一起看，后面更容易分辨压力、睡眠和身体不适的先后关系。");
  }
  if (stats.stimulantFoodCount > 0 && stats.coldDrinkCount === 0) {
    clues.push("饮食里已经出现刺激性或高负担线索，可以继续观察辛辣、咖啡、甜食和不适感是否同日出现。");
  }
  if (clues.length === 0) {
    clues.push("目前线索还比较少，可以先稳定记录疼痛、饮食和运动三类信息。");
  }
  return clues.slice(0, 3);
}

function buildNextExperiment(goal: string, stats: ReturnType<typeof summarizeEntries>) {
  if (/冷饮|冰|生冷/.test(goal) || stats.coldDrinkCount > 0) {
    return "下个周期先做一个小实验：经前 3 天尽量减少冰饮/冷饮，想喝甜的就选温热、小杯、少糖版本，再观察痛感和腹胀有没有变化。";
  }
  if (/运动|拉伸|走路|活动/.test(goal) || stats.exerciseCount > 0) {
    return "下个周期先不用增加很多运动，只保留 2 次轻运动，比如散步或拉伸，看看痛感和疲惫有没有变化。";
  }
  if (/熬夜|睡眠|压力|情绪/.test(goal) || stats.moodFluctuationCount > 0 || stats.fatigueCount > 0) {
    return "下个周期先观察睡眠和压力，不用追求自律，只试着在经前 3 天减少熬夜和高压沟通。";
  }
  return "下个周期先不用改变所有习惯，只选择一个最容易做到的小动作，坚持记录，看看身体有没有变化。";
}

function comparePain(current: number, previous: number) {
  if (current === 0 && previous === 0) return "暂无可比数据";
  if (previous === 0) return "上周期记录不足";
  const diff = current - previous;
  if (diff === 0) return "接近上周期";
  return diff > 0 ? `比上周期高 ${diff} 分` : `比上周期低 ${Math.abs(diff)} 分`;
}

function compareCount(current: number, previous: number) {
  if (current === 0 && previous === 0) return "暂无可比数据";
  if (previous === 0) return current > 0 ? "上周期记录不足" : "暂无可比数据";
  const diff = current - previous;
  if (diff === 0) return "接近上周期";
  return diff > 0 ? `比上周期多 ${diff} 次` : `比上周期少 ${Math.abs(diff)} 次`;
}

function defaultMetrics(): CycleReportMetric[] {
  return [
    { label: "疼痛记录", current: "0 次", compare: "暂无可比数据", note: "还没有痛感记录" },
    { label: "运动记录", current: "0 次", compare: "暂无可比数据", note: "还没有运动记录" },
    { label: "情绪波动", current: "0 次", compare: "暂无可比数据", note: "还没有情绪记录" },
    { label: "疲惫记录", current: "0 次", compare: "暂无可比数据", note: "还没有疲惫记录" },
  ];
}

function sortedEntries(journal: Record<string, JournalEntry>): JournalPair[] {
  return (Object.entries(journal) as JournalPair[]).sort(([a], [b]) => a.localeCompare(b));
}

function flattenTags(entry: JournalEntry) {
  const categories: Exclude<StatusTagCategory, "sexual">[] = ["mood", "symptom", "diet", "exercise"];
  return categories.flatMap(category => entry.statusTags?.[category] ?? []);
}

function isBetween(key: string, start: Date, end: Date) {
  const date = parseDateKey(key);
  if (!date) return false;
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

function parseDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function atStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}
