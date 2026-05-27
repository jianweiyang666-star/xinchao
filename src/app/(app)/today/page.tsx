"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Activity, Apple, Bell, CalendarDays, Check, ChevronLeft, ChevronRight, Droplets, Dumbbell, Heart, Moon, Plus } from "lucide-react";
import { FloatingIsland } from "@/components/innertide/floating-island";
import { ChaoFab } from "@/components/innertide/chao-fab";
import { BgmToggle } from "@/components/innertide/bgm-toggle";
import { DailyTips } from "@/components/innertide/daily-tips";
import { useInnertideStore, type JournalEntry, type StatusTagCategory } from "@/lib/store";
import { computeCycleState, getPeriodPrediction, PHASE_LABELS, type CyclePhase } from "@/lib/cycle/phases";
import { getDailyRecommendation } from "@/data/daily-recommendations";
import { STATUS_TAG_GROUPS } from "@/data/knowledge-tags";

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

const STATUS_GROUPS = STATUS_TAG_GROUPS;

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
  const [calendarMode, setCalendarMode] = useState<"preview" | "period">("preview");
  const [statusPanelOpen, setStatusPanelOpen] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [activeStatusGroup, setActiveStatusGroup] = useState<StatusTagCategory>("mood");
  const [calendarDraftKey, setCalendarDraftKey] = useState(() => formatDateKey(startOfDay(new Date())));
  const [calendarMonthKey, setCalendarMonthKey] = useState(() => formatDateKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const statusScrollerRef = useRef<HTMLDivElement | null>(null);

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayKeyValue = formatDateKey(today);
  const previewDate = dateFromKey(previewDateKey);
  const calendarDraftDate = dateFromKey(calendarDraftKey);
  const calendarMonthDate = dateFromKey(calendarMonthKey);
  const isPreviewingToday = previewDateKey === formatDateKey(today);
  const isPreviewFuture = previewDate.getTime() > today.getTime();
  const isCalendarDraftFuture = calendarDraftDate.getTime() > today.getTime();
  const last = store.lastPeriodStart ? new Date(store.lastPeriodStart) : null;
  const cycle = computeCycleState(last, store.cycleLength, 5, previewDate);
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
  const isPreviewPeriodStart = periodStartKeys.has(previewDateKey);
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
  const painEntries = journalEntries.filter(([, entry]) => entry.pain);
  const maxPain = painEntries.reduce((max, [, entry]) => Math.max(max, entry.pain?.level ?? 0), 0);
  const strongestPainEntry = painEntries.reduce<[string, JournalEntry] | null>((strongest, current) => {
    if (!strongest) return current;
    return (current[1].pain?.level ?? 0) > (strongest[1].pain?.level ?? 0) ? current : strongest;
  }, null);
  const hasInsightReport = reportableEntries.length >= 3 || Boolean(strongestPainEntry) || Boolean(store.onboardingAnswers) || (activePhase === "menstrual" && cycle.cycleDay >= 5);

  const getPeriodCalendarState = (date: Date): "actual" | "predicted" | "buffer" | null => {
    const cursor = startOfDay(date);
    const cursorKey = formatDateKey(cursor);
    const periodLength = cycle.periodLength;
    const starts = Array.from(periodStartKeys)
      .map(dateFromKey)
      .sort((a, b) => a.getTime() - b.getTime());

    for (const start of starts) {
      const end = addDays(start, periodLength - 1);
      const buffer = addDays(start, periodLength);

      if (cursor.getTime() >= start.getTime() && cursor.getTime() <= end.getTime()) {
        return cursor.getTime() <= today.getTime() ? "actual" : "predicted";
      }

      if (cursorKey === formatDateKey(buffer) && cursor.getTime() > today.getTime()) {
        return "buffer";
      }
    }

    if (todayPrediction) {
      const predictedStart = dateFromKey(todayPrediction.nextPeriodStartKey);
      const predictedEnd = addDays(predictedStart, periodLength - 1);
      const predictedBuffer = addDays(predictedStart, periodLength);

      if (cursor.getTime() >= predictedStart.getTime() && cursor.getTime() <= predictedEnd.getTime()) {
        return cursor.getTime() <= today.getTime() ? "actual" : "predicted";
      }

      if (cursorKey === formatDateKey(predictedBuffer) && cursor.getTime() > today.getTime()) {
        return "buffer";
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
    ? "先设置上次月经"
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

  const togglePeriodStart = (dateKey: string) => {
    const targetDate = dateFromKey(dateKey);
    if (targetDate.getTime() > today.getTime()) {
      setToast("未来日期先做预览，不能记录");
      return;
    }

    const isPeriodStart = periodStartKeys.has(dateKey);

    if (isPeriodStart) {
      const nextJournal = {
        ...store.journal,
        [dateKey]: {
          ...store.journal[dateKey],
          periodStarted: false,
          mode: store.appMode,
        }
      };

      const remainingStarts = (Object.entries(nextJournal) as [string, JournalEntry][])
        .filter(([, entry]) => entry.periodStarted)
        .map(([key]) => key)
        .filter((key) => dateFromKey(key).getTime() <= today.getTime())
        .sort();

      const currentLastKey = store.lastPeriodStart ? formatDateKey(startOfDay(new Date(store.lastPeriodStart))) : null;
      const shouldClearCurrentBase = currentLastKey === dateKey;
      const fallbackStartKey = remainingStarts[remainingStarts.length - 1] || null;

      update({
        lastPeriodStart: shouldClearCurrentBase
          ? fallbackStartKey
            ? dateFromKey(fallbackStartKey).toISOString()
            : null
          : store.lastPeriodStart,
        periodReminder: {
          ...store.periodReminder,
          lastNotifiedPeriodKey: null,
        },
        journal: nextJournal,
      });
      setToast(`已取消 ${formatMonthDay(targetDate)} 的月经记录`);
      return;
    }

    update({
      lastPeriodStart: targetDate.toISOString(),
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
    setCalendarMode("period");
    setCalendarDraftKey(previewDateKey);
    const date = dateFromKey(previewDateKey);
    setCalendarMonthKey(formatDateKey(new Date(date.getFullYear(), date.getMonth(), 1)));
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

    if (groupKey === "sexual") {
      if (tag === "无" && !selected) nextTags = ["无"];
      if (tag === "有" && !selected) nextTags = currentTags.filter((item) => item !== "无");
      if (tag === "不想记录细节" && !selected) nextTags = ["不想记录细节"];
    }

    if (groupKey === "symptom") {
      if (tag === "一切正常" && !selected) {
        nextTags = ["一切正常"];
      } else if (tag !== "一切正常" && !selected) {
        nextTags = nextTags.filter((item) => item !== "一切正常");
      }
    }
    if (groupKey === "diet") {
      if (tag === "正常" && !selected) {
        nextTags = ["正常"];
      } else if (tag !== "正常" && !selected) {
        nextTags = nextTags.filter((item) => item !== "正常");
      }
    }
    if (groupKey === "exercise") {
      if (tag === "没运动" && !selected) {
        nextTags = ["没运动"];
      } else if (tag !== "没运动" && !selected) {
        nextTags = nextTags.filter((item) => item !== "没运动");
      }
    }

    const nextStatusTags = {
      ...currentEntry.statusTags,
      [groupKey]: nextTags,
    };

    const hasSexualActivity = groupKey === "sexual"
      ? nextTags.length > 0 && !nextTags.includes("无") && !nextTags.includes("不想记录细节")
      : Boolean(currentEntry.sexualActivity);

    update({
      journal: {
        ...store.journal,
        [previewDateKey]: {
          ...currentEntry,
          statusTags: nextStatusTags,
          sexualActivity: hasSexualActivity
            ? currentEntry.sexualActivity ?? { recordedAt: new Date().toISOString() }
            : undefined,
          mode: store.appMode,
        }
      }
    });
    setToast(selected ? `已取消 ${tag}` : `已记录 ${tag}`);
  };

  const selectStatusGroup = (groupKey: StatusTagCategory) => {
    setActiveStatusGroup(groupKey);
    const index = STATUS_GROUPS.findIndex((group) => group.key === groupKey);
    const scroller = statusScrollerRef.current;
    if (scroller && index >= 0) {
      scroller.scrollTo({ left: scroller.clientWidth * index, behavior: "smooth" });
    }
  };

  const closeStatusPanel = () => {
    setStatusPanelOpen(false);
  };

  const handleStatusScroll = () => {
    const scroller = statusScrollerRef.current;
    if (!scroller) return;

    const index = Math.round(scroller.scrollLeft / scroller.clientWidth);
    const nextGroup = STATUS_GROUPS[index];
    if (nextGroup && nextGroup.key !== activeStatusGroup) {
      setActiveStatusGroup(nextGroup.key);
    }
  };

  const getStatusIcon = (groupKey: StatusTagCategory) => {
    if (groupKey === "mood") return <Moon className="h-5 w-5" />;
    if (groupKey === "symptom") return <Activity className="h-5 w-5" />;
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
    window.setTimeout(() => {
      statusScrollerRef.current?.scrollTo({ left: 0 });
    }, 0);
  };

  const openCalendarPanel = () => {
    setCalendarMode("preview");
    setCalendarDraftKey(previewDateKey);
    const date = dateFromKey(previewDateKey);
    setCalendarMonthKey(formatDateKey(new Date(date.getFullYear(), date.getMonth(), 1)));
    setCalendarOpen(true);
  };

  const confirmCalendarDate = () => {
    if (calendarMode === "period") {
      togglePeriodStart(calendarDraftKey);
      setCalendarOpen(false);
      return;
    }

    setPreviewDateKey(calendarDraftKey);
    setCalendarOpen(false);
    setToast(`正在预览 ${formatMonthDay(calendarDraftDate)}`);
  };

  const shiftCalendarMonth = (months: number) => {
    const nextMonth = addMonths(calendarMonthDate, months);
    setCalendarMonthKey(formatDateKey(nextMonth));
  };

  const selectCalendarDate = (dateKey: string) => {
    setCalendarDraftKey(dateKey);
    if (calendarMode === "preview") {
      const date = dateFromKey(dateKey);
      setPreviewDateKey(dateKey);
      setCalendarOpen(false);
      setToast(`正在预览 ${formatMonthDay(date)}`);
    }
  };

  const observationTargetGroup = getObservationTargetGroup();
  const observationTargetLabel = STATUS_GROUPS.find((group) => group.key === observationTargetGroup)?.label ?? "状态";
  const hasDietRecord = reportableEntries.some(([, entry]) => (entry.statusTags?.diet?.length ?? 0) > 0);
  const hasExerciseRecord = reportableEntries.some(([, entry]) => (entry.statusTags?.exercise?.length ?? 0) > 0);
  const hasMoodRecord = reportableEntries.some(([, entry]) => (entry.statusTags?.mood?.length ?? 0) > 0);
  const hasSymptomRecord = reportableEntries.some(([, entry]) => (entry.statusTags?.symptom?.length ?? 0) > 0 || entry.pain);
  const strongestPainText = strongestPainEntry
    ? `${strongestPainEntry[1].pain?.level ?? 0} 分`
    : "7 分";
  const hardestMomentText = strongestPainEntry
    ? `${formatMonthDay(dateFromKey(strongestPainEntry[0]))}`
    : store.onboardingAnswers?.painTiming ?? "月经第 1 天上午";
  const painRecordCountText = painEntries.length > 0 ? `${painEntries.length} 次` : "4 次";
  const maxPainText = maxPain > 0 ? `${maxPain} 分` : "7 分";
  const insightMetrics = [
    {
      label: "疼痛记录",
      current: `${painRecordCountText} · 最高 ${maxPainText}`,
      compare: "比上周期低 1 分",
      note: "集中在经前 2 天到月经第 2 天",
    },
    {
      label: "运动记录",
      current: "2 次 · 轻中强度",
      compare: "比上周期多 1 次",
      note: "散步和拉伸后，不适感记录更少",
    },
    {
      label: "情绪波动",
      current: "3 次",
      compare: "略多",
      note: "主要出现在月经前 3 天",
    },
    {
      label: "疲惫记录",
      current: "3 次",
      compare: "接近上周期",
      note: "熬夜后的第二天更明显",
    },
  ];
  const insightClues = [
    hasDietRecord ? "饮食记录已经出现了，后面可以继续看冰饮、辛辣和腹胀痛感是不是一起变化。" : "经前 3 天记录了 2 次冰饮，其中 1 次后出现腹胀。",
    hasExerciseRecord ? "运动记录开始累积了，可以继续观察轻运动后身体会不会更舒服。" : "经前一周运动 2 次，本次最高痛感比上周期低 1 分。",
    hasMoodRecord || hasSymptomRecord ? "情绪和症状记录放在一起看，会更容易分辨压力和身体不适的先后关系。" : "熬夜后的第二天，疲惫和烦躁记录更明显。",
  ].filter(Boolean).slice(0, 3);

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
              {isPreviewingToday ? "今天" : "预览"} · 第 {cycle.cycleDay} 天
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
            <span>{PHASE_LABELS[activePhase].medical}</span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#8C7B77]/45 text-[10px] text-[#8C7B77]">i</span>
          </div>
          <div className="mt-2 text-[12px] tracking-[0.12em] text-[#8C7B77]">
            {PHASE_LABELS[activePhase].subtitle}
          </div>

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
            label={isPreviewPeriodStart ? "取消月经期" : "记录月经期"}
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
                  onClick={() => setInsightOpen(true)}
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
                  {calendarMode === "period" ? "记录月经期" : "选择日期"}
                </div>
                <div className="mt-1 text-lg font-medium text-[#221A18]">{formatMonthDay(calendarDraftDate)}</div>
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
                  aria-label="上个月"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-[16px] font-medium text-[#221A18]">{formatMonthTitle(calendarMonthDate)}</div>
                <button
                  type="button"
                  onClick={() => shiftCalendarMonth(1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1E6DF] text-[#6E625F]"
                  aria-label="下个月"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] text-[#8C7B77]">
                {["日", "一", "二", "三", "四", "五", "六"].map(day => (
                  <div key={day} className="py-1">{day}</div>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-7 gap-1">
                {monthCells.map((date, index) => {
                  if (!date) return <div key={`empty-${index}`} className="h-[52px]" />;

                  const dateKey = formatDateKey(date);
                  const isDraft = dateKey === calendarDraftKey;
                  const isToday = dateKey === todayKeyValue;
                  const periodState = getPeriodCalendarState(date);
                  const isMarkedPeriod = periodState === "actual" || periodState === "predicted";

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => selectCalendarDate(dateKey)}
                      className={`flex h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl transition active:scale-95 ${
                        isDraft ? "ring-2 ring-[#221A18]/70 ring-offset-2 ring-offset-white/70" : "hover:bg-[#F8EFE8]"
                      }`}
                    >
                      <span className={`text-[14px] leading-none ${
                        periodState === "actual" || periodState === "predicted"
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
                        periodState === "actual"
                          ? "border border-[#FF4F79] bg-[#FF4F79] text-white shadow-sm"
                          : periodState === "predicted"
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
                  <span>已记录 / 已发生的月经日</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-dotted border-[#FF4F79] text-[#FF4F79]">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                  <span>根据周期预测的本次经期持续日</span>
                </div>
              </div>
            </div>

            {calendarMode === "period" && (
              <button
                type="button"
                onClick={confirmCalendarDate}
                disabled={isCalendarDraftFuture}
                className="mt-4 flex-none rounded-full bg-[#221A18] px-5 py-4 text-[14px] font-medium text-white transition disabled:opacity-30 active:scale-[0.98]"
              >
                {periodStartKeys.has(calendarDraftKey)
                  ? "取消这天的月经记录"
                  : "记录为月经开始日"}
              </button>
            )}
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
                        你离了解自己更近了一点
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-[#8C7B77]">
                        根据过去两周的记录生成，当前是月经第 {cycle.cycleDay} 天。
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#F8EFE8] px-3 py-1 text-[11px] text-[#8C7B77]">
                      示例报告
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-[#FFF9F4] p-3">
                      <div className="text-[11px] text-[#8C7B77]">本周期最高痛感</div>
                      <div className="mt-1 text-[18px] font-semibold text-[#221A18]">{strongestPainText}</div>
                    </div>
                    <div className="rounded-2xl bg-[#FFF9F4] p-3">
                      <div className="text-[11px] text-[#8C7B77]">最难受时间</div>
                      <div className="mt-1 text-[18px] font-semibold text-[#221A18]">{hardestMomentText}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] bg-white/70 p-4">
                  <div className="text-[14px] font-medium text-[#221A18]">关键要素</div>
                  <div className="mt-3 overflow-hidden rounded-[18px] border border-[#F1E6DF]">
                    {insightMetrics.map((metric, index) => (
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
                    {insightClues.map((line) => (
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
                    先不用改变所有习惯。下个周期可以试着在经前 3 天减少冰饮，并保持 2 次轻运动，看看痛感和腹胀有没有变化。
                  </p>
                  <p className="mt-3 rounded-2xl bg-[#FFF9F4] px-3 py-2 text-[11px] leading-relaxed text-[#8C7B77]">
                    目前记录还不多，这些只是帮助你观察自己的线索，不代表确定因果，建议继续记录 1-2 个周期。
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
                  可以先从今天的疼痛、饮食、运动或情绪开始，记录不用很完整，顺手就好。
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

            <div className="mt-5 grid grid-cols-5 gap-2">
              {STATUS_GROUPS.map((group) => {
                const active = group.key === activeStatusGroup;
                const count = getSelectedTags(group.key).length;
                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => selectStatusGroup(group.key)}
                    className={`relative flex min-h-[66px] flex-col items-center justify-center gap-1 rounded-2xl px-1 transition active:scale-95 ${
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

            <div
              ref={statusScrollerRef}
              onScroll={handleStatusScroll}
              className="mt-5 flex overflow-x-auto scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {STATUS_GROUPS.map((group) => (
                <section key={group.key} className="min-w-full snap-center px-0.5">
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
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex flex-1 justify-center gap-1.5">
                {STATUS_GROUPS.map((group) => (
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
