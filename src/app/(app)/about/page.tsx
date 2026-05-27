"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bell, ChevronLeft, X } from "lucide-react";
import { useInnertideStore, type DietPrefs, type ExercisePrefs } from "@/lib/store";
import { getPeriodPrediction } from "@/lib/cycle/phases";
import {
  DIET_ALLERGY_TAGS,
  DIET_HEALTH_GOAL_TAGS,
  DIET_OIL_TAGS,
  DIET_SENSITIVITY_TAGS,
  DIET_SPICY_TAGS,
  DIET_TYPE_TAGS,
  EXERCISE_AVOIDING_TAGS,
  EXERCISE_BASELINE_TAGS,
  EXERCISE_LOCATION_TAGS,
  EXERCISE_PERIOD_ACCEPTANCE_TAGS,
} from "@/data/knowledge-tags";

export default function AboutPage() {
  const { store, loaded, update } = useInnertideStore();
  const [dietPanelOpen, setDietPanelOpen] = useState(false);
  const [exercisePanelOpen, setExercisePanelOpen] = useState(false);

  // Local state for preferences
  const [localDiet, setLocalDiet] = useState<DietPrefs>(store.dietPreferences);
  const [localExercise, setLocalExercise] = useState<ExercisePrefs>(store.exercisePreferences);

  if (!loaded) return <div className="min-h-screen bg-void-bg" />;

  const handleOpenDiet = () => {
    setLocalDiet(store.dietPreferences);
    setDietPanelOpen(true);
  };

  const handleOpenExercise = () => {
    setLocalExercise(store.exercisePreferences);
    setExercisePanelOpen(true);
  };

  const saveDiet = () => {
    update({ dietPreferences: localDiet });
    setDietPanelOpen(false);
  };

  const saveExercise = () => {
    update({ exercisePreferences: localExercise });
    setExercisePanelOpen(false);
  };

  const lastStart = store.lastPeriodStart ? new Date(store.lastPeriodStart) : null;
  const prediction = getPeriodPrediction(
    lastStart,
    store.cycleLength,
    store.periodReminder.daysBefore
  );

  const updateLocalDiet = (key: keyof DietPrefs, val: any) => {
    setLocalDiet(prev => ({ ...prev, [key]: val }));
  };

  const toggleLocalDietArray = (key: 'allergies' | 'religion' | 'healthGoals' | 'avoid', val: string) => {
    const list = localDiet[key];
    const newList = list.includes(val) ? list.filter(t => t !== val) : [...list, val];
    updateLocalDiet(key, newList);
  };

  const updateLocalExercise = (key: keyof ExercisePrefs, val: any) => {
    setLocalExercise(prev => ({ ...prev, [key]: val }));
  };

  const toggleLocalExerciseArray = (key: 'conditions' | 'goals' | 'environment' | 'avoiding', val: string) => {
    const list = localExercise[key];
    const newList = list.includes(val) ? list.filter((t: string) => t !== val) : [...list, val];
    updateLocalExercise(key, newList);
  };

  return (
    <div className="relative min-h-screen animate-phase-fade bg-[#FAF6F2] text-[#4A3E3B]">
      <header className="flex items-center px-5 pt-12 pb-2">
        <Link
          href="/today"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#8C7B77] transition hover:bg-[#EADCD1]/50"
          aria-label="返回"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </header>

      <main className="mx-auto max-w-md space-y-8 px-8 py-12 animate-ink-rise">
        <h1 className="font-serif italic text-3xl font-light tracking-[0.1em]">关于我</h1>

        {/* Name */}
        <Field label="我的名字">
          <input
            type="text"
            value={store.nickname ?? ""}
            onChange={(e) => update({ nickname: e.target.value })}
            placeholder="还没告诉我"
            className="w-full border-b border-[#DECEC1] bg-transparent py-2 text-base text-[#4A3E3B] placeholder:text-[#8C7B77] focus:outline-none"
          />
        </Field>

        {/* Last Period */}
        <Field label="上次月经第一天">
          <input
            type="date"
            value={store.lastPeriodStart?.slice(0, 10) ?? ""}
            onChange={(e) =>
              update({
                lastPeriodStart: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : null,
              })
            }
            className="w-full border-b border-[#DECEC1] bg-transparent py-2 text-base text-[#4A3E3B] focus:outline-none"
          />
        </Field>

        <Field label="周期长度">
          <div className="flex items-center justify-between border-b border-[#DECEC1] py-2">
            <input
              type="number"
              min={21}
              max={45}
              value={store.cycleLength}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (!Number.isFinite(next)) return;
                update({ cycleLength: Math.min(45, Math.max(21, next)) });
              }}
              className="w-24 bg-transparent text-base text-[#4A3E3B] focus:outline-none"
            />
            <span className="text-sm text-[#8C7B77]">天</span>
          </div>
        </Field>

        <PeriodReminderCard
          prediction={prediction}
          enabled={store.periodReminder.enabled}
          daysBefore={store.periodReminder.daysBefore}
          browserNotification={store.periodReminder.browserNotification}
          onToggle={(enabled) => update({
            periodReminder: { ...store.periodReminder, enabled }
          })}
          onDaysBeforeChange={(daysBefore) => update({
            periodReminder: { ...store.periodReminder, daysBefore }
          })}
          onBrowserNotificationChange={(browserNotification) => update({
            periodReminder: { ...store.periodReminder, browserNotification }
          })}
        />

        {/* Preferences Buttons */}
        <div className="pt-4 space-y-2">
          <button 
            onClick={handleOpenDiet}
            className="w-full flex items-center justify-between text-left border-b border-[#DECEC1] py-5 focus:outline-none"
          >
            <span className="text-[14px]">饮食偏好设置</span>
            <ChevronLeft className="h-4 w-4 rotate-180 text-[#8C7B77]" />
          </button>
          <button 
            onClick={handleOpenExercise}
            className="w-full flex items-center justify-between text-left border-b border-[#DECEC1] py-5 focus:outline-none"
          >
            <span className="text-[14px]">运动偏好设置</span>
            <ChevronLeft className="h-4 w-4 rotate-180 text-[#8C7B77]" />
          </button>
        </div>

      </main>

      {/* Diet Preferences Sliding Panel */}
      <div 
        className={`fixed inset-0 z-50 bg-[#FDFBF9] text-[#4A3E3B] transition-transform duration-500 flex flex-col ${
           dietPanelOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="flex-none px-6 pt-12 pb-6 relative border-b border-[#DECEC1]/20">
          <button 
            onClick={() => setDietPanelOpen(false)}
            className="absolute top-12 right-6 p-2 text-[#4A3E3B] opacity-50 hover:opacity-100 transition-opacity z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-serif text-[#4A3E3B]">饮食偏好</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-md mx-auto">
            <DietSuggestionPanel prefs={localDiet} />

            {/* 1. 硬性禁忌 */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-xl text-[#BFA5D4]">1.</span>
                <h2 className="text-lg font-medium">硬性禁忌</h2>
                <span className="text-[10px] bg-[#FFE0E0] text-[#FF5A5A] px-2 py-0.5 rounded-full">严格</span>
              </div>
              <p className="text-[12px] text-[#8C7B77] -mt-4">一票否决，AI 推荐会严格排除</p>
              
              <div className="space-y-4">
                <div className="text-[13px] text-[#8C7B77]">过敏原</div>
                <div className="flex flex-wrap gap-2">
                   {DIET_ALLERGY_TAGS.map(tag => (
                     <TagButton 
                       key={tag} label={tag} active={localDiet.allergies.includes(tag)}
                       onClick={() => toggleLocalDietArray('allergies', tag)}
                     />
                   ))}
                   <CustomTagInput
                     placeholder="其他过敏原"
                     onSubmit={(tag) => {
                       if (!localDiet.allergies.includes(tag)) {
                         updateLocalDiet("allergies", [...localDiet.allergies, tag]);
                       }
                     }}
                   />
                </div>

                <div className="text-[13px] text-[#8C7B77] pt-2">硬性饮食禁忌</div>
                <div className="flex flex-wrap gap-2">
                   {["清真"].map(tag => (
                     <TagButton 
                       key={tag} label={tag} active={localDiet.religion.includes(tag)}
                       onClick={() => toggleLocalDietArray('religion', tag)}
                     />
                   ))}
                   <CustomTagInput
                     placeholder="其他禁忌"
                     onSubmit={(tag) => {
                       if (!localDiet.religion.includes(tag)) {
                         updateLocalDiet("religion", [...localDiet.religion, tag]);
                       }
                     }}
                   />
                </div>
              </div>
            </div>

            {/* 2. 饮食模式 */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-xl text-[#BFA5D4]">2.</span>
                <h2 className="text-lg font-medium">饮食模式</h2>
              </div>
              <p className="text-[12px] text-[#8C7B77] -mt-4">长期习惯，只能选一种</p>
              
              <div className="flex flex-wrap gap-2">
                 {DIET_TYPE_TAGS.map(tag => (
                   <TagButton 
                     key={tag} label={tag} 
                     active={localDiet.dietMode === tag}
                     onClick={() => updateLocalDiet('dietMode', tag)}
                     radio
                   />
                 ))}
              </div>
            </div>

            {/* 3. 健康管理目标 */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-xl text-[#BFA5D4]">3.</span>
                <h2 className="text-lg font-medium">健康管理目标</h2>
              </div>
              <p className="text-[12px] text-[#8C7B77] -mt-4">与生理状态独立，可同时选多个</p>
              
              <div className="flex flex-wrap gap-2">
                 {DIET_HEALTH_GOAL_TAGS.map(tag => (
                   <TagButton 
                     key={tag} label={tag} 
                     active={localDiet.healthGoals.includes(tag)}
                     onClick={() => toggleLocalDietArray('healthGoals', tag)}
                   />
                 ))}
              </div>
            </div>

            {/* 4. 口味与软偏好 */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-xl text-[#BFA5D4]">4.</span>
                <h2 className="text-lg font-medium">口味与软偏好</h2>
                <span className="text-[10px] bg-[#E0F0FF] text-[#5A9BFF] px-2 py-0.5 rounded-full">软偏好</span>
              </div>
              <p className="text-[12px] text-[#8C7B77] -mt-4">软性过滤，优先推荐但不严格排除</p>
              
              <div className="space-y-4">
                <div className="text-[13px] text-[#8C7B77]">辣度</div>
                <div className="flex flex-wrap gap-2">
                   {DIET_SPICY_TAGS.map(tag => (
                     <TagButton 
                       key={tag} label={tag} active={localDiet.spicy === tag}
                       onClick={() => updateLocalDiet('spicy', tag)} radio
                     />
                   ))}
                </div>

                <div className="text-[13px] text-[#8C7B77] pt-2">油量</div>
                <div className="flex flex-wrap gap-2">
                   {DIET_OIL_TAGS.map(tag => (
                     <TagButton 
                       key={tag} label={tag} active={localDiet.oil === tag}
                       onClick={() => updateLocalDiet('oil', tag)} radio
                     />
                   ))}
                </div>

                <div className="text-[13px] text-[#8C7B77] pt-2">敏感项（可多选）</div>
                <div className="flex flex-wrap gap-2">
                   {DIET_SENSITIVITY_TAGS.map(tag => (
                     <TagButton 
                       key={tag} label={tag} active={localDiet.avoid.includes(tag)}
                       onClick={() => toggleLocalDietArray('avoid', tag)}
                     />
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-none p-6 pt-2 pb-12 bg-white border-t border-[#DECEC1]/20">
          <div className="max-w-md mx-auto">
            <button 
              onClick={saveDiet}
              className="w-full bg-[#D4A373] text-white py-4 rounded-2xl shadow-xl shadow-[#D4A373]/20 font-medium tracking-widest text-[14px] active:scale-95 transition-all"
            >
              保存饮食偏好
            </button>
          </div>
        </div>
      </div>

      {/* Exercise Preferences Sliding Panel */}
      <div 
        className={`fixed inset-0 z-50 bg-[#FDFBF9] text-[#4A3E3B] transition-transform duration-500 flex flex-col ${
           exercisePanelOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="flex-none px-6 pt-12 pb-6 relative border-b border-[#DECEC1]/20">
          <button 
            onClick={() => setExercisePanelOpen(false)}
            className="absolute top-12 right-6 p-2 text-[#4A3E3B] opacity-50 hover:opacity-100 transition-opacity z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-serif text-[#4A3E3B]">运动偏好</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-md mx-auto">
            {/* 1. 身体状态 */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-xl text-[#D4A373]">1.</span>
                <h2 className="text-lg font-medium">运动频率</h2>
              </div>
              <p className="text-[12px] text-[#8C7B77] -mt-4">用于判断建议从多轻的强度开始</p>
              
              <div className="flex flex-wrap gap-2">
                 {EXERCISE_BASELINE_TAGS.map(tag => (
                   <TagButton 
                     key={tag} label={tag} active={localExercise.conditions.includes(tag)}
                     onClick={() => toggleLocalExerciseArray('conditions', tag)}
                   />
                 ))}
              </div>
            </div>

            {/* 2. 运动目标 */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-xl text-[#D4A373]">2.</span>
                <h2 className="text-lg font-medium">经期运动接受度</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                 {EXERCISE_PERIOD_ACCEPTANCE_TAGS.map(tag => (
                   <TagButton 
                     key={tag} label={tag} 
                     active={localExercise.goals.includes(tag)}
                     onClick={() => toggleLocalExerciseArray('goals', tag)}
                   />
                 ))}
              </div>
            </div>

            {/* 3. 运动场景 */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-xl text-[#D4A373]">3.</span>
                <h2 className="text-lg font-medium">运动场景</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                 {EXERCISE_LOCATION_TAGS.map(tag => (
                   <TagButton 
                     key={tag} label={tag} 
                     active={localExercise.environment.includes(tag)}
                     onClick={() => toggleLocalExerciseArray('environment', tag)}
                   />
                 ))}
              </div>
            </div>

            {/* 4. 重点关注/避坑 */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-xl text-[#D4A373]">4.</span>
                <h2 className="text-lg font-medium">重点关注/避坑</h2>
                <span className="text-[10px] bg-[#FFE0E0] text-[#FF5A5A] px-2 py-0.5 rounded-full">注意</span>
              </div>
              <div className="flex flex-wrap gap-2">
                 {EXERCISE_AVOIDING_TAGS.map(tag => (
                   <TagButton 
                     key={tag} label={tag} 
                     active={localExercise.avoiding.includes(tag)}
                     onClick={() => toggleLocalExerciseArray('avoiding', tag)}
                   />
                 ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-none p-6 pt-2 pb-12 bg-white border-t border-[#DECEC1]/20">
          <div className="max-w-md mx-auto">
            <button 
              onClick={saveExercise}
              className="w-full bg-[#D4A373] text-white py-4 rounded-2xl shadow-xl shadow-[#D4A373]/20 font-medium tracking-widest text-[14px] active:scale-95 transition-all"
            >
              保存运动偏好
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="text-[12px] uppercase tracking-[0.1em] opacity-50">
        {label}
      </div>
      {children}
    </div>
  );
}

function PeriodReminderCard({
  prediction,
  enabled,
  daysBefore,
  browserNotification,
  onToggle,
  onDaysBeforeChange,
  onBrowserNotificationChange,
}: {
  prediction: ReturnType<typeof getPeriodPrediction>;
  enabled: boolean;
  daysBefore: number;
  browserNotification: boolean;
  onToggle: (enabled: boolean) => void;
  onDaysBeforeChange: (daysBefore: number) => void;
  onBrowserNotificationChange: (enabled: boolean) => void;
}) {
  const [permissionText, setPermissionText] = useState(() => getNotificationPermissionText());

  const requestNotification = async () => {
    if (!("Notification" in window)) {
      setPermissionText("当前浏览器不支持");
      onBrowserNotificationChange(false);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionText(getNotificationPermissionText(permission));
      onBrowserNotificationChange(permission === "granted");
    } catch {
      setPermissionText("授权失败");
      onBrowserNotificationChange(false);
    }
  };

  const periodText = prediction
    ? prediction.daysUntilPeriod === 0
      ? "预计今天开始"
      : `预计还有 ${prediction.daysUntilPeriod} 天`
    : "先填写上次月经第一天";

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/45 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#F2ECE6] text-[#D4A373]">
            <Bell className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[12px] uppercase tracking-[0.16em] text-[#8C7B77]/70">月经预测</div>
            <h2 className="mt-1 text-lg font-medium">提醒我提前准备</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          className={`relative inline-block h-6 w-11 rounded-full transition-colors ${
            enabled ? "bg-[#FF85A2]" : "bg-[#DECEC1]"
          }`}
          aria-label="开启月经预测提醒"
        >
          <span
            className={`absolute top-0.5 block h-5 w-5 rounded-full bg-white transition-all ${
              enabled ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </div>

      <div className="mt-4 rounded-2xl bg-[#FDF8F3]/80 p-4">
        <div className="text-[13px] text-[#8C7B77]">下次月经</div>
        <div className="mt-1 text-2xl font-serif italic text-[#4A3E3B]">
          {prediction ? formatDisplayDate(prediction.nextPeriodStart) : "未设置"}
        </div>
        <div className="mt-1 text-[12px] text-[#8C7B77]">{periodText}</div>
      </div>

      <div className="mt-4 space-y-3">
        <label className="flex items-center justify-between gap-4 text-[13px] text-[#4A3E3B]">
          <span>提前提醒</span>
          <select
            value={daysBefore}
            onChange={(event) => onDaysBeforeChange(Number(event.target.value))}
            className="rounded-full border border-[#DECEC1] bg-[#F4ECE6] px-3 py-2 text-[13px] focus:outline-none"
          >
            {[1, 2, 3, 5, 7].map(day => (
              <option key={day} value={day}>{day} 天前</option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={requestNotification}
          className="w-full rounded-full border border-[#D4A373]/30 bg-[#F8EFE8] px-4 py-3 text-[13px] text-[#8C7B77] transition hover:bg-[#F2E5DC]"
        >
          {browserNotification ? "浏览器通知已开启" : "打开浏览器通知"}
          <span className="ml-2 opacity-60">{permissionText}</span>
        </button>

        <p className="text-[11px] leading-relaxed text-[#8C7B77]/75">
          提醒会保存在本机。浏览器通知只有在浏览器允许且页面被访问过时更可靠；正式 App 级后台提醒后续需要 PWA 或原生推送。
        </p>
      </div>
    </section>
  );
}

function getNotificationPermissionText(value?: NotificationPermission) {
  if (typeof window === "undefined" || !("Notification" in window)) return "不支持";
  const permission = value || Notification.permission;
  if (permission === "granted") return "已允许";
  if (permission === "denied") return "已拒绝";
  return "未授权";
}

function formatDisplayDate(date: Date) {
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

interface FoodSuggestion {
  title: string;
  reason: string;
  tags: string[];
}

function DietSuggestionPanel({ prefs }: { prefs: DietPrefs }) {
  const fallbackSuggestions = buildDietSuggestions(prefs);
  const [aiSuggestions, setAiSuggestions] = useState<FoodSuggestion[] | null>(null);
  const [aiReply, setAiReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const suggestions = aiSuggestions ?? fallbackSuggestions;
  const activeTags = [
    ...prefs.allergies.map(tag => `过敏：${tag}`),
    ...prefs.religion,
    prefs.dietMode !== "无限制" ? prefs.dietMode : null,
    ...prefs.healthGoals,
    ...prefs.avoid,
    prefs.spicy === "不辣" ? "不辣" : null,
    prefs.oil === "少油" ? "少油" : null,
  ].filter(Boolean) as string[];

  const generateWithModel = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: buildDietPrompt(prefs)
            }
          ],
          systemInstruction: [
            "你是心潮 App 的饮食推荐 Agent。",
            "请根据用户在“关于我”里选择的饮食标签，生成适合她今天执行的食物建议。",
            "这些标签等同于用户的提示词和约束条件：过敏原、宗教禁忌、饮食模式、健康目标、口味偏好和忌口必须被严格考虑。",
            "你不是医生，不做诊断，只给生活方式和饮食建议。",
            "输出必须是 JSON；recommendations 返回 3 到 4 项，每项包含 title、reason、tags。title 要是具体食物或饮品，不要泛泛而谈。",
            "如果有过敏或硬性禁忌，必须避开，并在 reason 里说明替代逻辑。"
          ].join("\n")
        })
      });

      if (!response.ok) {
        throw new Error("模型请求失败");
      }

      const data = await response.json();
      const recommendations = Array.isArray(data.recommendations)
        ? data.recommendations
            .filter((item: any) => item?.title && item?.reason)
            .map((item: any) => ({
              title: String(item.title),
              reason: String(item.reason),
              tags: Array.isArray(item.tags) ? item.tags.map(String).slice(0, 4) : ["AI 推荐"]
            }))
            .slice(0, 4)
        : [];

      if (recommendations.length === 0) {
        throw new Error("模型没有返回可用推荐");
      }

      setAiReply(typeof data.reply === "string" ? data.reply : "");
      setAiSuggestions(recommendations);
    } catch {
      setError("模型暂时没有返回，先显示本地兜底建议。");
      setAiSuggestions(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-12 rounded-[28px] border border-white/70 bg-white/45 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[12px] uppercase tracking-[0.18em] text-[#8C7B77]/70">根据标签推荐</div>
          <h2 className="mt-1 text-lg font-medium">更适合你的今日食物</h2>
        </div>
        <span className="rounded-full bg-[#F2ECE6] px-3 py-1 text-[10px] text-[#8C7B77]">
          AI
        </span>
      </div>

      {activeTags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {activeTags.slice(0, 8).map(tag => (
            <span key={tag} className="rounded-full bg-[#F8EFE8] px-2.5 py-1 text-[10px] text-[#8C7B77]">
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[12px] leading-relaxed text-[#8C7B77]">
          选择过敏、忌口或健康目标后，可以把这些标签交给大模型生成更贴合你的推荐。
        </p>
      )}

      <button
        type="button"
        onClick={generateWithModel}
        disabled={loading}
        className="mt-4 w-full rounded-full border border-[#D4A373]/30 bg-[#D4A373]/90 px-4 py-3 text-[13px] font-medium tracking-[0.16em] text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? "生成中..." : "根据我的标签生成推荐"}
      </button>

      {aiReply && (
        <p className="mt-3 rounded-2xl bg-white/55 p-3 text-[12px] leading-relaxed text-[#8C7B77]">
          {aiReply}
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-2xl bg-[#FFE0E0]/35 p-3 text-[12px] leading-relaxed text-[#B65A5A]">
          {error}
        </p>
      )}

      <div className="mt-4 grid gap-2.5">
        {suggestions.map(item => (
          <div key={item.title} className="rounded-2xl bg-[#FDF8F3]/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[14px] font-medium text-[#4A3E3B]">{item.title}</div>
                <div className="mt-1 text-[12px] leading-relaxed text-[#8C7B77]">{item.reason}</div>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.tags.map(tag => (
                <span key={tag} className="rounded-full bg-white/75 px-2 py-0.5 text-[10px] text-[#9B8177]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildDietPrompt(prefs: DietPrefs) {
  return [
    "请根据以下用户饮食标签，推荐今天适合她吃/喝的具体食物。",
    "",
    `过敏原：${prefs.allergies.length ? prefs.allergies.join("、") : "无"}`,
    `宗教/民俗禁忌：${prefs.religion.length ? prefs.religion.join("、") : "无"}`,
    `饮食模式：${prefs.dietMode}`,
    `健康管理目标：${prefs.healthGoals.length ? prefs.healthGoals.join("、") : "无"}`,
    `辣度偏好：${prefs.spicy}`,
    `油量偏好：${prefs.oil}`,
    `忌口：${prefs.avoid.length ? prefs.avoid.join("、") : "无"}`,
    "",
    "请给 3-4 个推荐，覆盖早餐/正餐/饮品或加餐。",
    "请严格避开过敏原和硬性禁忌；如果需要替代，请说明替代原因。",
    "请保持语气温柔、具体、像心潮 App 的饮食陪伴建议。"
  ].join("\n");
}

function CustomTagInput({ placeholder, onSubmit }: { placeholder: string; onSubmit: (tag: string) => void }) {
  const [value, setValue] = useState("");

  const submit = () => {
    const tag = value.trim();
    if (!tag) return;
    onSubmit(tag);
    setValue("");
  };

  return (
    <input
      value={value}
      placeholder={`${placeholder}，回车添加`}
      onChange={(event) => setValue(event.target.value)}
      onBlur={submit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          submit();
        }
      }}
      className="flex-1 min-w-[140px] bg-[#F4ECE6] border border-[#DECEC1] rounded-full px-4 py-2 text-[13px] focus:outline-none placeholder:text-[#8C7B77]/60"
    />
  );
}

function buildDietSuggestions(prefs: DietPrefs): FoodSuggestion[] {
  const allergies = prefs.allergies.join("|");
  const avoid = prefs.avoid.join("|");
  const healthGoals = prefs.healthGoals.join("|");
  const isVegan = prefs.dietMode === "纯素" || prefs.dietMode === "素食（纯素）";
  const isVegetarian = prefs.dietMode === "素食" || prefs.dietMode === "素食（蛋奶）" || isVegan;
  const noMilk = /乳糖不耐|牛奶|乳|奶/.test(allergies) || isVegan;
  const noEgg = /鸡蛋过敏|鸡蛋|蛋/.test(allergies) || isVegan;
  const noSeafood = /海鲜过敏|海鲜|虾|鱼|贝/.test(allergies) || /忌海鲜水产/.test(avoid) || isVegetarian;
  const noSoy = /豆类过敏|大豆|豆/.test(allergies) || /忌豆制品/.test(avoid);
  const noGluten = /麸质不耐|麸质/.test(allergies) || prefs.dietMode === "无麸质";
  const noRedMeat = /忌红肉/.test(avoid) || isVegetarian;
  const noSpicy = /辛辣敏感|忌辛辣/.test(avoid) || prefs.spicy === "不辣";
  const lowOil = prefs.oil === "少油" || /低脂|高糖高油敏感/.test(`${healthGoals}|${avoid}`);
  const controlSugar = /控糖/.test(healthGoals) || /忌甜食|高糖高油敏感/.test(avoid);
  const nourishBlood = /补气血/.test(healthGoals);
  const sootheStomach = /养胃/.test(healthGoals) || /低 FODMAP/.test(prefs.dietMode);

  const suggestions: FoodSuggestion[] = [];

  if (isVegan) {
    suggestions.push({
      title: noSoy ? "南瓜燕麦粥 + 清炒小油菜" : "南瓜燕麦粥 + 香菇豆腐",
      reason: "避开蛋奶和肉类，用温软主食、熟蔬菜和植物蛋白做轻负担补给。",
      tags: ["纯素", "温热", "轻负担"]
    });
  } else if (isVegetarian) {
    suggestions.push({
      title: noEgg ? "山药杂粮粥 + 热豆浆" : "番茄鸡蛋豆腐饭",
      reason: "适合蛋奶素模式，蛋白质来源清晰，口味也不会太重。",
      tags: ["蛋奶素", "高蛋白", "少油"]
    });
  } else if (noRedMeat) {
    suggestions.push({
      title: noSeafood ? "香菇鸡肉糙米饭" : "番茄鱼片豆腐汤",
      reason: "避开红肉，用鸡肉、鱼或豆腐补蛋白，适合日常稳定能量。",
      tags: ["忌红肉", "蛋白质", "正餐"]
    });
  } else {
    suggestions.push({
      title: "番茄牛肉饭 + 熟青菜",
      reason: "蛋白、主食和蔬菜比较完整，适合没有红肉禁忌时作为午餐基底。",
      tags: ["均衡", "饱腹", "熟食"]
    });
  }

  if (controlSugar) {
    suggestions.push({
      title: noMilk ? "无糖豆浆 + 鸡蛋/坚果替代" : "无糖酸奶 + 鸡蛋 + 小份莓果",
      reason: "优先蛋白和低糖水果，减少甜饮、甜点和大份精制主食带来的波动。",
      tags: ["控糖", "低甜", "早餐"]
    });
  } else if (nourishBlood) {
    suggestions.push({
      title: noRedMeat ? "红枣枸杞小米粥 + 鸡蛋" : "菠菜牛肉汤面",
      reason: "用温热汤粥和铁来源做恢复型补给，适合疲惫或经后恢复。",
      tags: ["补气血", "温热", "恢复"]
    });
  } else {
    suggestions.push({
      title: noMilk ? "热豆浆 + 全麦/燕麦主食" : "燕麦牛奶粥 + 水果",
      reason: "早餐更温和，能量释放稳定，不会一上来就太刺激。",
      tags: ["早餐", "稳定能量", "易执行"]
    });
  }

  if (sootheStomach || noSpicy) {
    suggestions.push({
      title: "山药鸡汤面 + 白灼青菜",
      reason: "减少辛辣、生冷和油炸刺激，温热汤面更适合胃敏感或经期前后。",
      tags: ["养胃", "不辣", "热食"]
    });
  } else if (lowOil) {
    suggestions.push({
      title: "清蒸鸡腿肉/鱼片 + 米饭 + 烫青菜",
      reason: "用蒸、煮、烫替代煎炸，保留饱腹感但减少油腻负担。",
      tags: ["少油", "晚餐", "清爽"]
    });
  } else {
    suggestions.push({
      title: noGluten ? "藜麦饭 + 鸡肉蔬菜碗" : "全麦鸡蛋三明治 + 热饮",
      reason: "适合日程比较满的时候，准备简单，蛋白和主食都不缺。",
      tags: ["便捷", "工作日", "均衡"]
    });
  }

  if (noSeafood) {
    suggestions.push({
      title: noSoy ? "鸡蛋羹 + 香菇青菜粥" : "肉末豆腐蒸蛋",
      reason: "已避开海鲜水产，用更安全的蛋白来源替代鱼虾类推荐。",
      tags: ["避开海鲜", "替代方案", "家常"]
    });
  }

  if (noMilk || noEgg || noSoy || noGluten) {
    const blocked = [
      noMilk ? "奶类" : null,
      noEgg ? "蛋类" : null,
      noSoy ? "豆制品" : null,
      noGluten ? "麸质" : null,
    ].filter(Boolean).join("、");

    suggestions.push({
      title: "先避开：" + blocked,
      reason: "这些属于硬性标签，首页和聊天推荐时应优先排除，再考虑口味偏好。",
      tags: ["安全优先", "硬性禁忌"]
    });
  }

  return suggestions.slice(0, 4);
}

function TagButton({ label, active, onClick, radio = false }: { 
  label: string; 
  active: boolean; 
  onClick: () => void; 
  radio?: boolean;
  key?: React.Key;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-[13px] transition-all border ${
        active 
          ? (radio ? 'bg-[#D4A373] text-white border-[#D4A373]' : 'bg-[#F2ECE6] border-[#D4A373]/50 text-[#4A3E3B] shadow-sm') 
          : 'bg-[#F4ECE6] text-[#8C7B77] border-[#DECEC1] hover:border-[#D4A373]/30 hover:bg-[#F0E6DD]'
      }`}
    >
      {label}
    </button>
  );
}
