import type {
  DietPrefs,
  ExercisePrefs,
  JournalEntry,
  ObservationGoal,
  OnboardingAnswers,
  StatusTagCategory
} from "@/lib/store";

type MemoryStore = {
  lastPeriodStart: string | null;
  journal: Record<string, JournalEntry>;
  onboardingAnswers: OnboardingAnswers | null;
  observationGoal: ObservationGoal | null;
  dietPreferences: DietPrefs;
  exercisePreferences: ExercisePrefs;
};

const CATEGORY_LABELS: Record<Exclude<StatusTagCategory, "sexual">, string> = {
  mood: "心情",
  symptom: "身体",
  period: "月经期",
  diet: "饮食",
  exercise: "运动"
};

const MAX_MEMORY_CHARS = 1200;

export function buildUserMemoryContext(store: MemoryStore, now = new Date()): string {
  const lines: string[] = [
    "使用方式：这是用户在本地记录中的轻量记忆，只能温和参考。可以说“最近/上次你记录过…”，不要说得像监控；不要把少量记录当成确定规律。"
  ];

  const observationGoal = store.observationGoal?.title || store.onboardingAnswers?.customObservationGoal || store.onboardingAnswers?.observationGoal;
  if (observationGoal) {
    lines.push(`本周期观察目标：${observationGoal}`);
  }

  const preferenceLine = buildPreferenceLine(store.dietPreferences, store.exercisePreferences);
  if (preferenceLine) {
    lines.push(`偏好/禁忌：${preferenceLine}`);
  }

  const onboardingLine = buildOnboardingLine(store.onboardingAnswers);
  if (onboardingLine) {
    lines.push(`问卷线索：${onboardingLine}`);
  }

  const lastPeriodLine = buildLastPeriodLine(store.lastPeriodStart);
  if (lastPeriodLine) {
    lines.push(lastPeriodLine);
  }

  const recentLines = buildRecentJournalLines(store.journal, now);
  if (recentLines.length > 0) {
    lines.push("最近记录：", ...recentLines);
  } else {
    lines.push("最近记录：暂无。");
  }

  return truncate(lines.join("\n"), MAX_MEMORY_CHARS);
}

function buildPreferenceLine(diet: DietPrefs, exercise: ExercisePrefs): string {
  const dietPrefs = [
    ...diet.allergies,
    ...diet.religion,
    ...diet.healthGoals,
    ...diet.avoid,
    diet.dietMode && diet.dietMode !== "无限制" ? diet.dietMode : "",
    diet.spicy && diet.spicy !== "不辣" ? diet.spicy : "",
    diet.oil && diet.oil !== "正常" ? diet.oil : ""
  ].filter(Boolean);

  const exercisePrefs = [
    ...exercise.conditions,
    ...exercise.goals,
    ...exercise.environment,
    ...exercise.avoiding.map(item => `避免${item}`)
  ].filter(Boolean);

  return unique([...dietPrefs, ...exercisePrefs]).slice(0, 12).join("、");
}

function buildOnboardingLine(answers: OnboardingAnswers | null): string {
  if (!answers) return "";

  const parts = [
    answers.concerns.length ? `困扰：${answers.concerns.slice(0, 3).join("、")}` : "",
    answers.painLevel ? `痛经程度：${answers.painLevel}` : "",
    answers.suspectedTriggers.length ? `怀疑影响因素：${answers.suspectedTriggers.slice(0, 4).join("、")}` : "",
    answers.painTiming ? `痛感常见时间：${answers.painTiming}` : ""
  ].filter(Boolean);

  return parts.join("；");
}

function buildLastPeriodLine(lastPeriodStart: string | null): string {
  if (!lastPeriodStart) return "";
  const date = parseDateKey(lastPeriodStart.slice(0, 10));
  if (!date) return "";
  return `最近一次月经开始：${formatDateShort(date)}。`;
}

function buildRecentJournalLines(journal: Record<string, JournalEntry>, now: Date): string[] {
  const recent = Object.entries(journal)
    .filter(([date]) => isWithinDays(date, now, 21))
    .sort(([a], [b]) => b.localeCompare(a));

  if (recent.length === 0) return [];

  const lines: string[] = [];
  const periodStarts = recent.filter(([, entry]) => entry.periodStarted).map(([date]) => formatDateKey(date));
  if (periodStarts.length) {
    lines.push(`- 月经记录：${periodStarts.slice(0, 3).join("、")} 有记录。`);
  }

  const painEntries = recent
    .map(([date, entry]) => ({ date, pain: entry.pain }))
    .filter((item): item is { date: string; pain: NonNullable<JournalEntry["pain"]> } => Boolean(item.pain));

  if (painEntries.length) {
    const maxPain = painEntries.reduce((max, item) => item.pain.level > max.pain.level ? item : max, painEntries[0]);
    const locations = maxPain.pain.locations.length ? `，位置：${maxPain.pain.locations.join("、")}` : "";
    lines.push(`- 最高痛感 ${maxPain.pain.level} 分，出现在 ${formatDateKey(maxPain.date)}${locations}。`);
  }

  const tagLines = buildTagLines(recent);
  lines.push(...tagLines);

  const notes = recent
    .map(([date, entry]) => entry.note ? `${formatDateKey(date)}：${entry.note}` : "")
    .filter(Boolean)
    .slice(0, 2);
  if (notes.length) {
    lines.push(`- 备注：${notes.join("；")}`);
  }

  return lines.slice(0, 7);
}

function buildTagLines(entries: Array<[string, JournalEntry]>): string[] {
  const lines: string[] = [];
  (Object.keys(CATEGORY_LABELS) as Array<Exclude<StatusTagCategory, "sexual">>).forEach(category => {
    const counts = new Map<string, number>();
    entries.forEach(([, entry]) => {
      entry.statusTags?.[category]?.forEach(tag => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });

    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 4);

    if (top.length) {
      const text = top.map(([tag, count]) => `${tag}${count > 1 ? `${count}次` : ""}`).join("、");
      lines.push(`- 常见${CATEGORY_LABELS[category]}记录：${text}。`);
    }
  });

  return lines;
}

function isWithinDays(dateKey: string, now: Date, days: number): boolean {
  const date = parseDateKey(dateKey);
  if (!date) return false;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const diff = start.getTime() - date.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function parseDateKey(dateKey: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateKey(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return date ? formatDateShort(date) : dateKey;
}

function formatDateShort(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function unique(items: string[]): string[] {
  return [...new Set(items.map(item => item.trim()).filter(Boolean))];
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}
