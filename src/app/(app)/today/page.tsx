"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Activity, Apple, Bell, CalendarDays, Check, ChevronLeft, ChevronRight, Droplets, Dumbbell, Heart, Moon, Plus } from "lucide-react";
import { FloatingIsland } from "@/components/innertide/floating-island";
import { ChaoFab } from "@/components/innertide/chao-fab";
import { BgmToggle } from "@/components/innertide/bgm-toggle";
import { DailyTips } from "@/components/innertide/daily-tips";
import { useInnertideStore, type JournalEntry, type StatusTagCategory } from "@/lib/store";
import { computeCycleState, DEFAULT_PERIOD_LENGTH, getPeriodPrediction, parsePeriodStart, PHASE_LABELS, type CyclePhase } from "@/lib/cycle/phases";
import { getDailyRecommendation } from "@/data/daily-recommendations";
import { PERIOD_PAIN_LEVEL_TAGS, PERIOD_PAIN_LOCATION_TAGS, STATUS_TAG_GROUPS } from "@/data/knowledge-tags";
import { buildCycleReport, type CycleReport } from "@/lib/reports/cycle-report";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatMonthTitle(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function getWeekday(date: Date) {
  return ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
}

function sanitizeJournalForCycleReport(journal: Record<string, JournalEntry>) {
  return Object.fromEntries(
    Object.entries(journal).map(([date, entry]) => {
      const { sexualActivity: _sexualActivity, statusTags, ...safeEntry } = entry;
      const { sexual: _sexual, ...safeStatusTags } = statusTags ?? {};
      return [date, { ...safeEntry, statusTags: safeStatusTags }];
    })
  ) as Record<string, JournalEntry>;
}

const STATUS_GROUPS = STATUS_TAG_GROUPS;
const PERIOD_PAIN_LEVELS: Record<string, number> = {
  没有疼痛: 0,
  轻微疼痛: 1,
  中度疼痛: 3,
  严重疼痛: 4,
  难以忍受: 5,
};

const RESONANCE_CONTENT: Record<CyclePhase, {
  count: string;
  daily: {
    diet: string;
    exercise: string;
    work: string;
  };
}> = {
  menstrual: {
    count: "12,504",
    daily: {
      diet: "很多人经期前两天会更想吃热食，温热汤粥会更舒服。",
      exercise: "很多人经期前几天会安排轻松的活动。",
      work: "经期前两天，不少人会把高消耗沟通往后放一放。",
    },
  },
  follicular: {
    count: "9,816",
    daily: {
      diet: "不少人在卵泡期会重新找回胃口，清爽高蛋白更容易坚持。",
      exercise: "很多人会在这个阶段从散步慢慢恢复到轻中强度运动。",
      work: "这几天适合重新整理计划，但不用一口气把日程填满。",
    },
  },
  ovulatory: {
    count: "8,273",
    daily: {
      diet: "排卵期附近，很多人会更需要补水和稳定蛋白。",
      exercise: "不少人在这个阶段运动状态更好，但排卵痛明显时会主动降强度。",
      work: "很多人会把展示、沟通和对外表达安排在精力更高的几天。",
    },
  },
  luteal: {
    count: "11,269",
    daily: {
      diet: "超过 56% 的人说：快来月经的时候食欲会变好。",
      exercise: "很多人经前几天会把高强度训练换成散步或拉伸。",
      work: "很多人经前会突然怀疑关系，这通常会在月经开始后缓解。",
    },
  },
};

export default function TodayPage() {
  const { store, loaded, update } = useInnertideStore();
  const [toast, setToast] = useState("");
  const [previewDateKey, setPreviewDateKey] = useState(() => formatDateKey(startOfDay(new Date())));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarYearView, setCalendarYearView] = useState(false);
  const [statusPanelOpen, setStatusPanelOpen] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [cycleReport, setCycleReport] = useState<CycleReport | null>(null);
  const [cycleReportLoading, setCycleReportLoading] = useState(false);
  const [cycleReportError, setCycleReportError] = useState("");
  const [activeStatusGroup, setActiveStatusGroup] = useState<StatusTagCategory>("mood");
  const [calendarDraftKey, setCalendarDraftKey] = useState<string | null>(null);
  const [calendarRemovedKey, setCalendarRemovedKey] = useState<string | null>(null);
  const [calendarMonthKey, setCalendarMonthKey] = useState(() => formatDateKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayKeyValue = formatDateKey(today);
  const previewDate = dateFromKey(previewDateKey);
  const calendarDraftDate = calendarDraftKey ? dateFromKey(calendarDraftKey) : null;
  const calendarMonthDate = dateFromKey(calendarMonthKey);
  const isPreviewingToday = previewDateKey === formatDateKey(today);
  const isPreviewFuture = previewDate.getTime() > today.getTime();
  const isCalendarDraftFuture = Boolean(calendarDraftDate && calendarDraftDate.getTime() > today.getTime());
  const last = parsePeriodStart(store.lastPeriodStart);
  const cycle = computeCycleState(last, store.cycleLength, DEFAULT_PERIOD_LENGTH, previewDate);
  const prediction = getPeriodPrediction(
    last,
    store.cycleLength,
    store.periodReminder.daysBefore,
    previewDate
  );
  const todayPrediction = getPeriodPrediction(
    last,
    store.cycleLength,
    store.periodReminder.daysBefore,
    today
  );
  const activePhase = cycle.phase;
  const recommendation = getDailyRecommendation(activePhase, cycle.cycleDay);
  const resonance = RESONANCE_CONTENT[activePhase];
  const previewEntry = store.journal[previewDateKey] ?? {};
  const periodStartKeys = useMemo(() => {
    const keys = new Set<string>();
    if (last) keys.add(formatDateKey(startOfDay(last)));
    (Object.entries(store.journal) as [string, JournalEntry][]).forEach(([key, entry]) => {
      if (entry.periodStarted) keys.add(key);
    });
    return keys;
  }, [store.lastPeriodStart, store.journal]);
  const journalEntries = useMemo(() => {
    return (Object.entries(store.journal) as [string, JournalEntry][])
      .filter(([key]) => dateFromKey(key).getTime() <= today.getTime())
      .sort(([a], [b]) => a.localeCompare(b));
  }, [store.journal, today]);
  const reportableEntries = journalEntries.filter(([, entry]) => {
    const tagGroups = Object.values(entry.statusTags ?? {}) as string[][];
    const tagCount = tagGroups.reduce((sum, tags) => sum + tags.length, 0);
    return tagCount > 0 || Boolean(entry.pain) || Boolean(entry.periodStarted);
  });
  const reportPayload = useMemo(() => ({
    todayKey: todayKeyValue,
    lastPeriodStart: store.lastPeriodStart,
    cycleLength: store.cycleLength,
    journal: sanitizeJournalForCycleReport(store.journal),
    observationGoal: store.observationGoal,
    onboardingAnswers: store.onboardingAnswers,
  }), [todayKeyValue, store.lastPeriodStart, store.cycleLength, store.journal, store.observationGoal, store.onboardingAnswers]);
  const localCycleReport = useMemo(() => buildCycleReport(reportPayload), [reportPayload]);
  const painEntries = journalEntries.filter(([, entry]) => entry.pain);
  const strongestPainEntry = painEntries.reduce<[string, JournalEntry] | null>((strongest, current) => {
    if (!strongest) return current;
    return (current[1].pain?.level ?? 0) > (strongest[1].pain?.level ?? 0) ? current : strongest;
  }, null);
  const hasInsightReport = localCycleReport.hasEnoughData || reportableEntries.length >= 3 || Boolean(strongestPainEntry) || Boolean(store.onboardingAnswers) || (activePhase === "menstrual" && cycle.cycleDay >= 5);

  const getPeriodCalendarState = (date: Date): "actual" | "predicted" | "buffer" | "draft-start" | "draft-range" | null => {
    const cursor = startOfDay(date);
    const periodLength = DEFAULT_PERIOD_LENGTH;

    if (calendarDraftDate) {
      const daysFromDraft = Math.round((cursor.getTime() - startOfDay(calendarDraftDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysFromDraft === 0) return "draft-start";
      if (daysFromDraft > 0 && daysFromDraft < DEFAULT_PERIOD_LENGTH) return "draft-range";
    }
    const starts = Array.from(periodStartKeys)
      .filter((key) => key !== calendarRemovedKey)
      .map(dateFromKey)
      .sort((a, b) => a.getTime() - b.getTime());

    for (const start of starts) {
      const end = addDays(start, periodLength - 1);

      if (cursor.getTime() >= start.getTime() && cursor.getTime() <= end.getTime()) {
        return cursor.getTime() <= today.getTime() ? "actual" : null;
      }
    }

    return null;
  };

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => addDays(today, index - 1));
  }, [today]);

  const monthCells = useMemo(() => {
    const firstDay = new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth(), 1);
    const daysInMonth = new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() + 1, 0).getDate();
    const leadingEmpty = firstDay.getDay();
    return [
      ...Array.from({ length: leadingEmpty }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth(), index + 1))
    ];
  }, [calendarMonthKey]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!loaded || !todayPrediction || !store.periodReminder.enabled || !store.periodReminder.browserNotification) return;
    if (!todayPrediction.isReminderWindow || store.periodReminder.lastNotifiedPeriodKey === todayPrediction.nextPeriodStartKey) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const body = todayPrediction.daysUntilPeriod === 0
      ? "预计今天进入月经期，可以把今天安排得松一点。"
      : `预计还有 ${todayPrediction.daysUntilPeriod} 天进入月经期，可以提前准备热饮和卫生用品。`;

    new Notification("心潮月经预测提醒", { body });
    update({
      periodReminder: {
        ...store.periodReminder,
        lastNotifiedPeriodKey: todayPrediction.nextPeriodStartKey,
      }
    });
  }, [loaded, todayPrediction?.nextPeriodStartKey, store.periodReminder.enabled, store.periodReminder.browserNotification]);

  if (!loaded) return null;

  const daysUntilPeriod = prediction?.daysUntilPeriod ?? null;
  const isCurrentlyMenstrual = activePhase === "menstrual";
  const distanceTitle = !prediction
    ? "距离经期还有"
    : isCurrentlyMenstrual
      ? "当前处于经期"
      : daysUntilPeriod === 0
      ? "预计今天进入经期"
      : daysUntilPeriod > 0
        ? "距离经期还有"
        : "当前处于经期";
  const distanceValue = !prediction
    ? "--"
    : isCurrentlyMenstrual
      ? String(cycle.cycleDay)
      : daysUntilPeriod <= 0
      ? String(Math.abs(daysUntilPeriod) + 1)
      : String(daysUntilPeriod);
  const distanceUnit = !prediction
    ? "天"
    : daysUntilPeriod <= 0
      ? "天"
      : "天";
  const visibleStatusGroups = isCurrentlyMenstrual
    ? STATUS_GROUPS
    : STATUS_GROUPS.filter((group) => group.key !== "period");

  const savePeriodStart = (dateKey: string) => {
    const targetDate = dateFromKey(dateKey);
    if (targetDate.getTime() > today.getTime()) {
      setToast("未来日期先做预览，不能记录");
      return;
    }

    update({
      lastPeriodStart: dateKey,
      periodReminder: {
        ...store.periodReminder,
        lastNotifiedPeriodKey: null,
      },
      journal: {
        ...store.journal,
        [dateKey]: {
          ...store.journal[dateKey],
          periodStarted: true,
          mode: store.appMode,
        }
      }
    });
    setToast(`已记录 ${formatMonthDay(targetDate)} 为月经开始日`);
  };

  const openPeriodCalendar = () => {
    setCalendarDraftKey(null);
    setCalendarRemovedKey(null);
    const date = dateFromKey(previewDateKey);
    setCalendarMonthKey(formatDateKey(new Date(date.getFullYear(), date.getMonth(), 1)));
    setCalendarYearView(false);
    setCalendarOpen(true);
  };

  const updateStatusTags = (groupKey: StatusTagCategory, tag: string) => {
    if (isPreviewFuture) {
      setToast("未来日期先做预览，不能记录");
      return;
    }

    const currentEntry = store.journal[previewDateKey] ?? {};
    const currentTags = currentEntry.statusTags?.[groupKey] ?? [];
    const selected = currentTags.includes(tag);
    let nextTags = selected
      ? currentTags.filter((item) => item !== tag)
      : [...currentTags, tag];
    const secondarySection = STATUS_GROUPS
      .find((group) => group.key === groupKey)
      ?.secondarySections?.find((section) => section.tags.includes(tag));

    if (secondarySection?.selection === "single" && !selected) {
      nextTags = [...currentTags.filter((item) => !secondarySection.tags.includes(item)), tag];
    }

    if (groupKey === "sexual") {
      if (tag === "没有性行为" && !selected) nextTags = ["没有性行为"];
      if (tag === "发生了性行为" && !selected) nextTags = currentTags.filter((item) => item !== "没有性行为");
      if (tag === "不记录细节" && !selected) nextTags = ["不记录细节"];
    }

    if (groupKey === "symptom") {
      if (tag === "一切正常" && !selected) {
        nextTags = ["一切正常"];
      } else if (tag !== "一切正常" && !selected) {
        nextTags = nextTags.filter((item) => item !== "一切正常");
      }
    }
    if (groupKey === "diet") {
      if (tag === "正常吃饭" && !selected) {
        nextTags = ["正常吃饭"];
      } else if (tag !== "正常吃饭" && !selected) {
        nextTags = nextTags.filter((item) => item !== "正常吃饭");
      }
    }
    if (groupKey === "exercise") {
      if (tag === "没有锻炼" && !selected) {
        nextTags = ["没有锻炼"];
      } else if (tag !== "没有锻炼" && !selected) {
        nextTags = nextTags.filter((item) => item !== "没有锻炼");
      }
    }

    const nextStatusTags = {
      ...currentEntry.statusTags,
      [groupKey]: nextTags,
    };

    const hasSexualActivity = groupKey === "sexual"
      ? nextTags.length > 0 && !nextTags.includes("没有性行为") && !nextTags.includes("不记录细节")
      : Boolean(currentEntry.sexualActivity);
    let nextPain = currentEntry.pain;
    if (groupKey === "period") {
      const levelTag = nextTags.find((item) => PERIOD_PAIN_LEVEL_TAGS.includes(item));
      const locations = nextTags.filter((item) => PERIOD_PAIN_LOCATION_TAGS.includes(item));
      if (levelTag) {
        nextPain = { level: PERIOD_PAIN_LEVELS[levelTag], locations };
      } else if (PERIOD_PAIN_LEVEL_TAGS.includes(tag)) {
        nextPain = undefined;
      } else if (nextPain) {
        nextPain = { ...nextPain, locations };
      }
    }
    const exerciseMinutes = groupKey === "exercise" && nextTags.includes("没有锻炼")
      ? undefined
      : currentEntry.exerciseMinutes;

    update({
      journal: {
        ...store.journal,
        [previewDateKey]: {
          ...currentEntry,
          statusTags: nextStatusTags,
          pain: nextPain,
          exerciseMinutes,
          sexualActivity: hasSexualActivity
            ? currentEntry.sexualActivity ?? { recordedAt: new Date().toISOString() }
            : undefined,
          mode: store.appMode,
        }
      }
    });
    setToast(selected ? `已取消 ${tag}` : `已记录 ${tag}`);
  };

  const updateExerciseMinutes = (value: string) => {
    if (isPreviewFuture) {
      setToast("未来日期先做预览，不能记录");
      return;
    }
    const currentEntry = store.journal[previewDateKey] ?? {};
    const activities = currentEntry.statusTags?.exercise ?? [];
    if (!activities.some((tag) => tag !== "没有锻炼")) {
      setToast("请先选择已经完成的运动");
      return;
    }
    const minutes = value === "" ? undefined : Math.max(1, Math.min(600, Number(value)));
    update({
      journal: {
        ...store.journal,
        [previewDateKey]: {
          ...currentEntry,
          exerciseMinutes: minutes !== undefined && Number.isFinite(minutes) ? minutes : undefined,
          mode: store.appMode,
        },
      },
    });
  };

  const selectStatusGroup = (groupKey: StatusTagCategory) => {
    setActiveStatusGroup(groupKey);
  };

  const closeStatusPanel = () => {
    setStatusPanelOpen(false);
  };

  const getStatusIcon = (groupKey: StatusTagCategory) => {
    if (groupKey === "mood") return <Moon className="h-5 w-5" />;
    if (groupKey === "symptom") return <Activity className="h-5 w-5" />;
    if (groupKey === "period") return <Droplets className="h-5 w-5" />;
    if (groupKey === "diet") return <Apple className="h-5 w-5" />;
    if (groupKey === "exercise") return <Dumbbell className="h-5 w-5" />;
    return <Heart className="h-5 w-5" />;
  };

  const getObservationTargetGroup = (): StatusTagCategory => {
    const title = store.observationGoal?.title ?? "";
    if (/运动|活动|拉伸|走路/.test(title)) return "exercise";
    if (/痛|疼|腹胀|不舒服/.test(title)) return "symptom";
    if (/冷饮|冰|咖啡|浓茶|饮食|清淡|吃/.test(title)) return "diet";
    if (/压力|烦躁|情绪|关系|熬夜/.test(title)) return "mood";
    return "symptom";
  };

  const openObservationRecord = () => {
    const targetGroup = getObservationTargetGroup();
    openStatusPanel();
    window.setTimeout(() => selectStatusGroup(targetGroup), 0);
  };

  const getSelectedTags = (groupKey: StatusTagCategory) => {
    return previewEntry.statusTags?.[groupKey] ?? [];
  };

  const getStatusDescription = (groupKey: StatusTagCategory, fallback: string) => {
    const selected = getSelectedTags(groupKey);
    if (selected.length === 0) return fallback;
    return selected.slice(0, 3).join("、") + (selected.length > 3 ? ` 等 ${selected.length} 项` : "");
  };

  const openStatusPanel = () => {
    setActiveStatusGroup("mood");
    setStatusPanelOpen(true);
  };

  const openCalendarPanel = () => {
    setCalendarDraftKey(null);
    setCalendarRemovedKey(null);
    const date = dateFromKey(previewDateKey);
    setCalendarMonthKey(formatDateKey(new Date(date.getFullYear(), date.getMonth(), 1)));
    setCalendarYearView(true);
    setCalendarOpen(true);
  };

  const confirmCalendarDate = () => {
    if (calendarRemovedKey) {
      const currentEntry = store.journal[calendarRemovedKey] ?? {};
      const { periodStarted: _periodStarted, ...entryWithoutPeriodStart } = currentEntry;
      const nextJournal: Record<string, JournalEntry> = { ...store.journal, [calendarRemovedKey]: entryWithoutPeriodStart };
      const remainingPeriodStarts = Object.entries(nextJournal)
        .filter(([, entry]) => entry.periodStarted)
        .map(([key]) => key)
        .sort();
      const nextLastPeriodStart = store.lastPeriodStart?.slice(0, 10) === calendarRemovedKey
        ? remainingPeriodStarts[remainingPeriodStarts.length - 1] ?? null
        : store.lastPeriodStart;

      update({
        lastPeriodStart: nextLastPeriodStart,
        journal: nextJournal,
      });
      setToast(`已取消 ${formatMonthDay(dateFromKey(calendarRemovedKey))} 的月经开始日记录`);
      setCalendarOpen(false);
      return;
    }
    if (!calendarDraftKey) return;
    savePeriodStart(calendarDraftKey);
    setPreviewDateKey(calendarDraftKey);
    setCalendarOpen(false);
  };

  const shiftCalendarMonth = (months: number) => {
    const nextMonth = addMonths(calendarMonthDate, calendarYearView ? months * 12 : months);
    setCalendarMonthKey(formatDateKey(nextMonth));
  };

  const selectCalendarDate = (dateKey: string) => {
    if (dateFromKey(dateKey).getTime() > today.getTime()) {
      setToast("未来日期不能记录");
      return;
    }
    if (calendarRemovedKey === dateKey) {
      setCalendarRemovedKey(null);
      return;
    }
    if (periodStartKeys.has(dateKey)) {
      setCalendarDraftKey(null);
      setCalendarRemovedKey(dateKey);
      return;
    }
    setCalendarRemovedKey(null);
    setCalendarDraftKey((current) => current === dateKey ? null : dateKey);
  };

  const openInsightReport = async () => {
    setInsightOpen(true);
    setCycleReport(localCycleReport);
    setCycleReportError("");

    if (!localCycleReport.hasEnoughData) return;

    setCycleReportLoading(true);
    try {
      const res = await fetch("/api/cycle-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportPayload),
      });
      if (!res.ok) throw new Error("Failed to generate cycle report");
      const data = await res.json();
      setCycleReport(data);
    } catch (error) {
      console.error(error);
      setCycleReport(localCycleReport);
      setCycleReportError("已使用本地统计生成");
    } finally {
      setCycleReportLoading(false);
    }
  };

  const observationTargetGroup = getObservationTargetGroup();
  const observationTargetLabel = STATUS_GROUPS.find((group) => group.key === observationTargetGroup)?.label ?? "状态";
  const displayedCycleReport = cycleReport ?? localCycleReport;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#FAF6F2] text-[#221A18]">
      <BgmToggle phase={activePhase} />

      <div className="pointer-events-none absolute inset-x-0 top-[7.25rem] z-0 flex justify-center opacity-[0.42] blur-[0.85px] saturate-[0.96]">
        <div className="w-[86vw] max-w-[390px]">
          <FloatingIsland phase={activePhase} mode="healing" />
        </div>
      </div>

      <main className="relative z-10 mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pt-7 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <header className="flex items-center justify-between">
          <Link
            href="/about"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8C63E7] text-[14px] font-semibold text-white shadow-sm"
            aria-label="关于我"
          >
            心
          </Link>

          <div className="text-center">
            <div className="text-[20px] font-medium tracking-normal">{formatMonthDay(previewDate)}</div>
            <div className="mt-1 text-[11px] text-[#8C7B77]">
              {!last ? "今天 · 周期未设置" : `${isPreviewingToday ? "今天" : "预览"} · 第 ${cycle.cycleDay} 天`}
            </div>
          </div>

          <button
            type="button"
            onClick={openCalendarPanel}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/45 text-[#221A18] shadow-sm backdrop-blur-md"
            aria-label="打开日期选择"
          >
            <CalendarDays className="h-5 w-5" />
          </button>
        </header>

        <section className="mt-4 grid grid-cols-7 gap-1">
          {days.map((date) => {
            const isToday = formatDateKey(date) === todayKeyValue;
            const dateKey = formatDateKey(date);
            const isPreview = dateKey === previewDateKey;
            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setPreviewDateKey(dateKey)}
                className="flex flex-col items-center gap-2 rounded-2xl py-1 transition active:scale-95"
              >
                <div className={`text-[11px] ${isToday ? "font-medium text-[#221A18]" : "text-[#8C7B77]"}`}>
                  {isToday ? "今天" : getWeekday(date)}
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-[19px] transition ${
                  isPreview
                    ? "bg-[#D8D0CC] font-semibold shadow-sm"
                    : "text-[#221A18]"
                }`}>
                  {date.getDate()}
                </div>
              </button>
            );
          })}
        </section>

        <section className="relative z-10 mt-24 flex flex-1 flex-col items-center justify-center text-center">
          <div className="text-[18px] font-semibold text-[#221A18]">{distanceTitle}</div>
          <div className="mt-5 flex items-end justify-center gap-2">
            <span className="text-[64px] font-semibold leading-none tracking-normal text-black">{distanceValue}</span>
            <span className="mb-2 text-[24px] font-semibold text-black">{distanceUnit}</span>
          </div>

          <div className="mt-8 flex items-center gap-2 text-[16px] text-[#6E625F]">
            <span>{last ? PHASE_LABELS[activePhase].medical : "设置后显示周期阶段"}</span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#8C7B77]/45 text-[10px] text-[#8C7B77]">i</span>
          </div>
          <div className="mt-2 text-[12px] tracking-[0.12em] text-[#8C7B77]">
            {last ? PHASE_LABELS[activePhase].subtitle : "记录一次月经开始日即可开始预测"}
          </div>

          {!prediction && (
            <Link
              href="/about"
              className="mt-6 rounded-full border border-white/70 bg-white/52 px-5 py-3 text-[13px] font-medium text-[#6E625F] shadow-sm backdrop-blur-md"
            >
              去我的页面设置周期
            </Link>
          )}

          {store.periodReminder.enabled && prediction?.isReminderWindow && (
            <div className="mt-7 w-full rounded-[24px] border border-white/60 bg-white/42 p-4 text-left shadow-sm backdrop-blur-md">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F8EFE8] text-[#D4A373]">
                  <Bell className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[12px] font-medium tracking-[0.12em] text-[#8C7B77]">月经预测提醒</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#4A3E3B]/80">
                    {prediction.daysUntilPeriod === 0
                      ? "预计今天进入月经期，今天可以把安排放松一点。"
                      : `预计还有 ${prediction.daysUntilPeriod} 天进入月经期，可以提前准备热饮和卫生用品。`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {toast && (
            <div className="fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded-full bg-[#221A18]/78 px-4 py-2 text-[12px] text-white shadow-lg backdrop-blur-md">
              {toast}
            </div>
          )}
        </section>

        <section className="relative z-20 mt-3 grid grid-cols-2 gap-5 pb-3">
          <ActionButton
            label="记录月经期"
            tone="period"
            icon={<Droplets className="h-6 w-6" />}
            onClick={openPeriodCalendar}
          />
          <ActionButton
            label="记录状态"
            tone="soft"
            icon={<Plus className="h-8 w-8" />}
            onClick={openStatusPanel}
          />
        </section>

        <section className="relative z-10 mt-6 space-y-3">
          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] font-medium tracking-[0.22em] text-[#8C7B77]/78">
              我们与你同在 · WE ARE WITH YOU
            </div>
            <div className="rounded-full border border-white/70 bg-white/45 px-4 py-2 text-[13px] text-[#6E625F] shadow-sm backdrop-blur-md">
              此刻有 <span className="font-semibold text-[#D4A373]">{resonance.count}</span> 位女性正在共同渡过
            </div>
          </div>

          {store.observationGoal && (
            <div className="w-full rounded-[22px] border border-white/60 bg-white/34 p-3 text-left shadow-sm backdrop-blur-md">
              <div className="text-[11px] font-medium tracking-[0.14em] text-[#8C7B77]">本周期观察目标</div>
              <p className="mt-1 text-[14px] font-medium leading-relaxed text-[#4A3E3B]">
                {store.observationGoal.title}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={openObservationRecord}
                  className="rounded-[18px] bg-white/72 px-3 py-3 text-left shadow-sm transition active:scale-[0.98]"
                >
                  <span className="block text-[13px] font-medium text-[#221A18]">记录相关状态</span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-[#8C7B77]">进入{observationTargetLabel}</span>
                </button>
                <button
                  type="button"
                  onClick={openInsightReport}
                  className="rounded-[18px] bg-[#221A18] px-3 py-3 text-left text-white shadow-sm transition active:scale-[0.98]"
                >
                  <span className="block text-[13px] font-medium">查看洞察报告</span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-white/68">本周期复盘</span>
                </button>
              </div>
            </div>
          )}
        </section>

        <ChaoFab variant="care">
          <DailyTips
            recommendation={recommendation}
            dietPrefs={store.dietPreferences}
            exercisePrefs={store.exercisePreferences}
            journalEntry={previewEntry}
            observationGoal={store.observationGoal}
            onboardingAnswers={store.onboardingAnswers}
            resonance={resonance.daily}
          />
        </ChaoFab>
      </main>

      {calendarOpen && (
        <div className="fixed inset-0 z-[70] flex items-end bg-[#221A18]/20 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm">
          <div className="mx-auto flex max-h-[82dvh] w-full max-w-md flex-col overflow-hidden rounded-[32px] bg-[#FFF9F4] p-4 shadow-[0_24px_80px_rgba(80,55,45,0.22)]">
            <div className="flex flex-none items-center justify-between">
              <div>
                <div className="text-[12px] uppercase tracking-[0.16em] text-[#8C7B77]">
                  记录月经期
                </div>
                <div className="mt-1 text-lg font-medium text-[#221A18]">
                  {calendarDraftDate
                    ? formatMonthDay(calendarDraftDate)
                    : calendarRemovedKey
                      ? "已取消选择，保存后生效"
                      : "选择开始日期"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCalendarOpen(false)}
                className="rounded-full bg-[#F1E6DF] px-4 py-2 text-[12px] text-[#6E625F]"
              >
                取消
              </button>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-[24px] bg-white/70 p-3 [-webkit-overflow-scrolling:touch]">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => shiftCalendarMonth(-1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1E6DF] text-[#6E625F]"
                  aria-label={calendarYearView ? "上一年" : "上个月"}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarYearView((current) => !current)}
                  className="rounded-full px-3 py-2 text-[16px] font-medium text-[#221A18] transition hover:bg-[#F8EFE8]"
                >
                  {calendarYearView ? `${calendarMonthDate.getFullYear()}年` : formatMonthTitle(calendarMonthDate)}
                  <span className="ml-2 text-[11px] font-normal text-[#8C7B77]">
                    {calendarYearView ? "查看月历" : "查看全年"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => shiftCalendarMonth(1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1E6DF] text-[#6E625F]"
                  aria-label={calendarYearView ? "下一年" : "下个月"}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {calendarYearView ? (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {Array.from({ length: 12 }, (_, month) => {
                    const monthDate = new Date(calendarMonthDate.getFullYear(), month, 1);
                    const cells = Array.from({ length: new Date(calendarMonthDate.getFullYear(), month + 1, 0).getDate() }, (_, index) =>
                      new Date(calendarMonthDate.getFullYear(), month, index + 1)
                    );
                    return (
                      <button
                        key={month}
                        type="button"
                        onClick={() => {
                          setCalendarMonthKey(formatDateKey(monthDate));
                          setCalendarYearView(false);
                        }}
                        className="rounded-2xl bg-[#FFF9F4] p-2 text-left transition active:scale-[0.98]"
                      >
                        <div className="mb-1.5 text-[12px] font-medium text-[#6E625F]">{month + 1} 月</div>
                        <div className="grid grid-cols-7 gap-[2px]">
                          {cells.map((date) => {
                            const state = getPeriodCalendarState(date);
                            return (
                              <span
                                key={formatDateKey(date)}
                                className={`h-1.5 w-1.5 rounded-full ${
                                  state === "actual" || state === "draft-start"
                                    ? "bg-[#FF4F79]"
                                    : state === "predicted" || state === "draft-range"
                                      ? "border border-[#FF4F79]"
                                      : "bg-[#EDE4DE]"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] text-[#8C7B77]">
                    {["日", "一", "二", "三", "四", "五", "六"].map(day => (
                      <div key={day} className="py-1">{day}</div>
                    ))}
                  </div>

                  <div className="mt-1 grid grid-cols-7 gap-1">
                    {monthCells.map((date, index) => {
                      if (!date) return <div key={`empty-${index}`} className="h-[52px]" />;

                      const dateKey = formatDateKey(date);
                      const isToday = dateKey === todayKeyValue;
                      const periodState = getPeriodCalendarState(date);
                      const isMarkedPeriod = periodState === "actual" || periodState === "predicted" || periodState === "draft-start" || periodState === "draft-range";

                      return (
                        <button
                          key={dateKey}
                          type="button"
                          onClick={() => selectCalendarDate(dateKey)}
                          className="flex h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl transition active:scale-95 hover:bg-[#F8EFE8]"
                        >
                          <span className={`text-[14px] leading-none ${
                            isMarkedPeriod
                              ? "font-medium text-[#E94B73]"
                              : periodState === "buffer"
                                ? "text-[#AAA09D]"
                                : isToday
                                  ? "font-semibold text-[#221A18]"
                                  : "text-[#221A18]"
                          }`}>
                            {date.getDate()}
                          </span>
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
                            periodState === "actual" || periodState === "draft-start"
                              ? "border border-[#FF4F79] bg-[#FF4F79] text-white shadow-sm"
                              : periodState === "predicted" || periodState === "draft-range"
                                ? "border-2 border-dotted border-[#FF4F79] bg-white/65 text-[#FF4F79]"
                                : periodState === "buffer"
                                  ? "border-2 border-dotted border-[#B8B0AE] bg-white/45 text-[#B8B0AE]"
                                  : isToday
                                    ? "border border-[#D8D0CC] bg-[#D8D0CC]/70"
                                    : "border-2 border-[#B8B0AE] bg-white/35"
                          }`}>
                            {isMarkedPeriod && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 grid gap-2 text-[11px] text-[#8C7B77]">
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FF4F79] text-white">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                      <span>选择的月经开始日 / 已记录日期</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-dotted border-[#FF4F79] text-[#FF4F79]">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                      <span>含开始日在内，共 7 天的经期范围</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={confirmCalendarDate}
              disabled={(!calendarDraftKey && !calendarRemovedKey) || isCalendarDraftFuture}
              className="mt-4 flex-none rounded-full bg-[#221A18] px-5 py-4 text-[14px] font-medium text-white transition disabled:opacity-30 active:scale-[0.98]"
            >
              {calendarRemovedKey ? "保存取消" : "保存记录"}
            </button>
          </div>
        </div>
      )}

      {insightOpen && (
        <div className="fixed inset-0 z-[74] flex items-end bg-[#221A18]/20 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm">
          <div className="mx-auto flex max-h-[82dvh] w-full max-w-md flex-col overflow-hidden rounded-[32px] bg-[#FFF9F4] p-4 shadow-[0_24px_80px_rgba(80,55,45,0.22)]">
            <div className="flex flex-none items-center justify-between">
              <div>
                <div className="text-[12px] uppercase tracking-[0.16em] text-[#8C7B77]">洞察报告</div>
                <div className="mt-1 text-lg font-medium text-[#221A18]">本周期复盘</div>
              </div>
              <button
                type="button"
                onClick={() => setInsightOpen(false)}
                className="rounded-full bg-[#F1E6DF] px-4 py-2 text-[12px] text-[#6E625F]"
              >
                关闭
              </button>
            </div>

            {hasInsightReport ? (
              <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
                <div className="rounded-[24px] bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[16px] font-medium leading-relaxed text-[#221A18]">
                        {displayedCycleReport.summary}
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-[#8C7B77]">
                        {displayedCycleReport.rangeLabel}，当前是月经第 {cycle.cycleDay} 天。
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#F8EFE8] px-3 py-1 text-[11px] text-[#8C7B77]">
                      {cycleReportLoading ? "生成中" : displayedCycleReport.source === "ai" ? "AI 润色" : "本地统计"}
                    </span>
                  </div>
                  {cycleReportError && (
                    <div className="mt-3 rounded-2xl bg-[#FFF9F4] px-3 py-2 text-[11px] leading-relaxed text-[#8C7B77]">
                      {cycleReportError}
                    </div>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-[#FFF9F4] p-3">
                      <div className="text-[11px] text-[#8C7B77]">{displayedCycleReport.highestPain.label}</div>
                      <div className="mt-1 text-[18px] font-semibold text-[#221A18]">{displayedCycleReport.highestPain.value}</div>
                    </div>
                    <div className="rounded-2xl bg-[#FFF9F4] p-3">
                      <div className="text-[11px] text-[#8C7B77]">{displayedCycleReport.hardestMoment.label}</div>
                      <div className="mt-1 text-[18px] font-semibold text-[#221A18]">{displayedCycleReport.hardestMoment.value}</div>
                    </div>
                  </div>
                  {displayedCycleReport.periodComparison && (
                    <div className="mt-3 rounded-2xl bg-[#FFF9F4] p-3">
                      <div className="text-[11px] text-[#8C7B77]">月经开始日对比</div>
                      <div className="mt-2 flex items-center justify-between text-[13px] text-[#4A3E3B]">
                        <span>本次 {displayedCycleReport.periodComparison.current}</span>
                        <span className="text-[#8C7B77]">{displayedCycleReport.periodComparison.interval}</span>
                        <span>上次 {displayedCycleReport.periodComparison.previous}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-[24px] bg-white/70 p-4">
                  <div className="text-[14px] font-medium text-[#221A18]">关键要素</div>
                  <div className="mt-3 overflow-hidden rounded-[18px] border border-[#F1E6DF]">
                    {displayedCycleReport.metrics.map((metric, index) => (
                      <div
                        key={metric.label}
                        className={`grid grid-cols-[0.9fr_1.25fr_1fr] gap-2 px-3 py-3 text-left ${
                          index === 0 ? "bg-[#FFF9F4]" : "bg-white/54 border-t border-[#F1E6DF]"
                        }`}
                      >
                        <div>
                          <div className="text-[12px] font-medium text-[#221A18]">{metric.label}</div>
                          <div className="mt-1 text-[10px] leading-relaxed text-[#8C7B77]">{metric.note}</div>
                        </div>
                        <div className="text-[12px] font-medium leading-relaxed text-[#4A3E3B]">{metric.current}</div>
                        <div className="text-[12px] leading-relaxed text-[#8C7B77]">{metric.compare}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] bg-white/70 p-4">
                  <div className="text-[14px] font-medium text-[#221A18]">这一周期可能的规律</div>
                  <div className="mt-3 space-y-2">
                    {displayedCycleReport.clues.map((line) => (
                      <div key={line} className="flex gap-2 text-[13px] leading-relaxed text-[#6E625F]">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4A373]" />
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] bg-white/70 p-4">
                  <div className="text-[14px] font-medium text-[#221A18]">下个周期小实验</div>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#6E625F]">
                    {displayedCycleReport.nextExperiment}
                  </p>
                  <p className="mt-3 rounded-2xl bg-[#FFF9F4] px-3 py-2 text-[11px] leading-relaxed text-[#8C7B77]">
                    {displayedCycleReport.disclaimer}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-[24px] bg-white/70 p-5 text-center [-webkit-overflow-scrolling:touch]">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F8EFE8] text-[#D4A373]">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="mt-4 text-[16px] font-medium text-[#221A18]">再记录几次，心潮就能帮你看规律</div>
                <p className="mt-2 text-[13px] leading-relaxed text-[#8C7B77]">
                  可以先从今天的疼痛、饮食、体力活动或心情开始，记录不用很完整，顺手就好。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInsightOpen(false);
                    openObservationRecord();
                  }}
                  className="mt-5 w-full rounded-full bg-[#221A18] px-5 py-4 text-[14px] font-medium text-white transition active:scale-[0.98]"
                >
                  去记录相关状态
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {statusPanelOpen && (
        <div className="fixed inset-0 z-[72] flex items-end bg-[#221A18]/20 px-4 pb-4 backdrop-blur-sm">
          <div className="mx-auto flex max-h-[82dvh] w-full max-w-md flex-col rounded-[32px] bg-[#FFF9F4] p-5 shadow-[0_24px_80px_rgba(80,55,45,0.22)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] uppercase tracking-[0.16em] text-[#8C7B77]">记录状态</div>
                <div className="mt-1 text-xl font-medium text-[#221A18]">{formatMonthDay(previewDate)}</div>
              </div>
              <button
                type="button"
                onClick={closeStatusPanel}
                className="rounded-full bg-[#F1E6DF] px-4 py-2 text-[12px] text-[#6E625F]"
              >
                取消
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {visibleStatusGroups.map((group) => {
                const active = group.key === activeStatusGroup;
                const count = getSelectedTags(group.key).length;
                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => selectStatusGroup(group.key)}
                    className={`relative flex min-h-[66px] flex-col items-center justify-center gap-1 rounded-2xl px-1 active:scale-95 ${
                      active
                        ? "bg-[#221A18] text-white shadow-sm"
                        : "bg-white/72 text-[#6E625F] hover:bg-[#F8EFE8]"
                    }`}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      active ? "bg-white/16 text-white" : "bg-[#F8EFE8] text-[#D4A373]"
                    }`}>
                      {getStatusIcon(group.key)}
                    </span>
                    <span className="text-[11px] font-medium leading-none">{group.label}</span>
                    {count > 0 && (
                      <span className={`absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] ${
                        active ? "bg-white text-[#221A18]" : "bg-[#221A18] text-white"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 min-h-0 flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch]">
              {visibleStatusGroups.filter((group) => group.key === activeStatusGroup).map((group) => (
                <section key={group.key} className="px-0.5">
                  <div className="rounded-[24px] bg-white/62 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[17px] font-medium text-[#221A18]">{group.label}</div>
                        <p className="mt-1 text-[12px] leading-relaxed text-[#8C7B77]">
                          {getStatusDescription(group.key, group.description)}。点一下记录，再点一下取消。
                        </p>
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F8EFE8] text-[#D4A373]">
                        {getStatusIcon(group.key)}
                      </span>
                    </div>

                    {group.key === "period" && (
                      <p className="mt-4 rounded-2xl bg-[#FDF0F1] px-3 py-2 text-[12px] leading-relaxed text-[#9C5F66]">
                        该板块仅在月经期出现，可补充经量与疼痛情况。
                      </p>
                    )}
                    {group.tags.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {group.tags.map((tag) => {
                          const active = getSelectedTags(group.key).includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => updateStatusTags(group.key, tag)}
                              className={`min-h-11 rounded-2xl px-3 py-2 text-[13px] transition active:scale-95 ${
                                active
                                  ? "bg-[#221A18] text-white shadow-sm"
                                  : "bg-[#FFF9F4] text-[#4A3E3B] hover:bg-[#F8EFE8]"
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {group.secondarySections?.map((section) => (
                      <div key={section.label} className="mt-4 border-t border-[#EADCD1]/60 pt-4">
                        <div className="mb-2 text-[12px] font-medium text-[#8C7B77]">
                          {section.label}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {section.tags.map((tag) => {
                            const active = getSelectedTags(group.key).includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => updateStatusTags(group.key, tag)}
                                className={`min-h-11 rounded-2xl px-3 py-2 text-[13px] transition active:scale-95 ${
                                  active
                                    ? "bg-[#221A18] text-white shadow-sm"
                                    : "bg-[#FFF9F4] text-[#4A3E3B] hover:bg-[#F8EFE8]"
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {group.key === "exercise" && (
                      <div className="mt-4 border-t border-[#EADCD1]/60 pt-4">
                        <label htmlFor="exercise-minutes" className="mb-2 block text-[12px] font-medium text-[#8C7B77]">
                          运动时间
                        </label>
                        <div className="flex items-center gap-2 rounded-2xl bg-[#FFF9F4] px-4 py-3">
                          <input
                            id="exercise-minutes"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={600}
                            placeholder="填写"
                            value={previewEntry.exerciseMinutes ?? ""}
                            onChange={(event) => updateExerciseMinutes(event.target.value)}
                            className="w-full bg-transparent text-[16px] text-[#221A18] outline-none placeholder:text-[#B8AAA4]"
                          />
                          <span className="shrink-0 text-[13px] text-[#8C7B77]">分钟</span>
                        </div>
                        <p className="mt-2 text-[11px] text-[#A3918B]">选择已完成的运动后填写时长。</p>
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex flex-1 justify-center gap-1.5">
                {visibleStatusGroups.map((group) => (
                  <span
                    key={group.key}
                    className={`h-1.5 rounded-full transition-all ${
                      group.key === activeStatusGroup ? "w-5 bg-[#221A18]" : "w-1.5 bg-[#D8D0CC]"
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={closeStatusPanel}
                className="rounded-full bg-[#F1E6DF] px-5 py-3 text-[13px] font-medium text-[#6E625F] transition active:scale-[0.98]"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ActionButton({
  label,
  icon,
  tone,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  tone: "period" | "soft";
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-3">
      <span className={`flex h-16 w-16 items-center justify-center rounded-full shadow-[0_12px_32px_rgba(80,55,45,0.12)] ${
        tone === "period" ? "bg-[#FF4F79] text-white" : "bg-white text-[#221A18]"
      }`}>
        {icon}
      </span>
      <span className="text-[14px] font-medium text-[#221A18]">{label}</span>
    </button>
  );
}

function StatusOption({
  label,
  description,
  icon,
  count,
  onClick,
}: {
  label: string;
  description: string;
  icon: ReactNode;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-white/76 p-4 text-left transition active:scale-[0.99]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F8EFE8] text-[#D4A373]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[15px] font-medium text-[#221A18]">
          {label}
          {Boolean(count) && (
            <span className="rounded-full bg-[#221A18]/8 px-2 py-0.5 text-[11px] font-normal text-[#8C7B77]">
              {count}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-[12px] text-[#8C7B77]">{description}</span>
      </span>
    </button>
  );
}
