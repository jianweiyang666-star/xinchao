"use client";

import { useState } from "react";
import { Coffee, Activity, Briefcase, ChevronDown } from "lucide-react";
import { type DailyRecommendation } from "@/data/daily-recommendations";
import { type DietPrefs, type ExercisePrefs, type JournalEntry, type ObservationGoal, type OnboardingAnswers } from "@/lib/store";
import { type Meal } from "@/data/diet";
import { buildPersonalizedDailyTips } from "@/lib/daily/personalized-tips";

interface DailyTipsProps {
  recommendation: DailyRecommendation;
  dietPrefs: DietPrefs;
  exercisePrefs: ExercisePrefs;
  journalEntry?: JournalEntry;
  observationGoal?: ObservationGoal | null;
  onboardingAnswers?: OnboardingAnswers | null;
  resonance?: {
    diet: string;
    exercise: string;
    work: string;
  };
}

export function DailyTips({ recommendation, dietPrefs, exercisePrefs, journalEntry, observationGoal, onboardingAnswers, resonance }: DailyTipsProps) {
  const [openCard, setOpenCard] = useState<"diet" | "exercise" | "work" | null>(null);

  const toggleCard = (card: "diet" | "exercise" | "work") => {
    if (openCard === card) {
      setOpenCard(null);
    } else {
      setOpenCard(card);
    }
  };

  const tips = buildPersonalizedDailyTips({
    recommendation,
    dietPrefs,
    exercisePrefs,
    journalEntry,
    observationGoalTitle: observationGoal?.title,
    onboardingAnswers,
  });
  const hasDietAdjustments = tips.diet.badges.length > 0 || tips.diet.reminders.length > 0;

  return (
    <div className="flex w-full flex-col gap-3">
      <h3 className="text-[16px] font-semibold text-[#221A18]">今日建议</h3>

      {/* Diet Card */}
      <div className="overflow-hidden rounded-2xl border border-white/50 bg-[#FFF9F4]/80 transition-all duration-300 backdrop-blur-md">
        <button
          onClick={() => toggleCard("diet")}
          className="w-full flex items-center justify-between p-4 focus:outline-none"
        >
          <div className="flex items-center gap-3 text-[#4A3E3B]">
            <div className="p-2 rounded-full bg-[#FFA582]/20 text-[#FF85A2]">
              <Coffee className="w-4 h-4" />
            </div>
            <div className="text-left">
               <span className="font-semibold text-[15px]">今日饮食建议</span>
               {hasDietAdjustments && (
                 <span className="block text-[11px] text-[#8C7B77]">{tips.diet.headline}</span>
               )}
               {!hasDietAdjustments && (
                 <span className="block text-[11px] text-[#8C7B77]">{recommendation.headline}</span>
               )}
               {resonance?.diet && (
                 <span className="mt-1 block text-[11px] leading-relaxed text-[#B0776C]">{resonance.diet}</span>
               )}
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#4A3E3B]/40 transition-transform duration-300 ${
              openCard === "diet" ? "rotate-180" : ""
            }`}
          />
        </button>
        <div
          className={`px-4 pb-4 overflow-hidden transition-all duration-300 ${
            openCard === "diet" ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0 p-0"
          }`}
        >
          <div className="mt-2 text-sm text-[#4A3E3B]/80 flex flex-col gap-3">
            {tips.diet.badges.length > 0 && <BadgeRow badges={tips.diet.badges} />}
            <MealCard label="早餐" meal={tips.diet.breakfast} />
            <MealCard label="午餐" meal={tips.diet.lunch} />
            <MealCard label="晚餐" meal={tips.diet.dinner} />

            {tips.diet.reminders.map((reminder) => (
              <div key={reminder} className="mt-1 rounded-xl border border-[#FF85A2]/10 bg-[#FFE0E0]/24 p-2 text-[11px] leading-relaxed text-[#B0776C]">
                {reminder}
              </div>
            ))}

            <div className="text-[10px] opacity-50 text-right mt-1">
              参考资料：《中国居民膳食指南 (2022)》
            </div>
          </div>
        </div>
      </div>

      {/* Exercise Card */}
      <div className="overflow-hidden rounded-2xl border border-white/50 bg-[#FFF9F4]/80 transition-all duration-300 backdrop-blur-md">
        <button
          onClick={() => toggleCard("exercise")}
          className="w-full flex items-center justify-between p-4 focus:outline-none"
        >
          <div className="flex items-center gap-3 text-[#4A3E3B]">
            <div className="p-2 rounded-full bg-[#DFADDB]/20 text-[#BFA5D4]">
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="font-semibold text-[15px]">今日运动建议</span>
              {tips.exercise.badges.length > 0 ? (
                <span className="block text-[11px] text-[#8C7B77]">{tips.exercise.badges[0]}</span>
              ) : (
                <span className="block text-[11px] text-[#8C7B77]">{tips.exercise.intensity} · {tips.exercise.title}</span>
              )}
              {resonance?.exercise && (
                <span className="mt-1 block text-[11px] leading-relaxed text-[#B0776C]">{resonance.exercise}</span>
              )}
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#4A3E3B]/40 transition-transform duration-300 ${
              openCard === "exercise" ? "rotate-180" : ""
            }`}
          />
        </button>
        <div
          className={`px-4 pb-4 overflow-hidden transition-all duration-300 ${
            openCard === "exercise" ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 p-0"
          }`}
        >
          <div className="mt-2 text-sm text-[#4A3E3B]/80 bg-white/30 rounded-xl p-4 leading-relaxed flex flex-col gap-3">
            {tips.exercise.badges.length > 0 && <BadgeRow badges={tips.exercise.badges} />}
            <div>
              <span className="font-bold text-[13px] opacity-70 block mb-1">推荐项目</span>
              {tips.exercise.recommendation}
            </div>
            <div>
              <span className="font-bold text-[13px] opacity-70 block mb-1">注意事项</span>
              {tips.exercise.caution}
            </div>
            <div className="text-[10px] opacity-50 text-right mt-1">
              参考资料：《ACOG 女性运动指南》
            </div>
          </div>
        </div>
      </div>

      {/* Work Card */}
      <div className="overflow-hidden rounded-2xl border border-white/50 bg-[#FFF9F4]/80 transition-all duration-300 backdrop-blur-md">
        <button
          onClick={() => toggleCard("work")}
          className="w-full flex items-center justify-between p-4 focus:outline-none"
        >
          <div className="flex items-center gap-3 text-void-text">
            <div className="p-2 rounded-full bg-[#FFE5A3]/30 text-[#D4A373]">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="font-semibold text-[15px]">今日工作建议</span>
              {tips.work.badges.length > 0 && (
                <span className="mt-1 block text-[11px] leading-relaxed text-[#8C7B77]">{tips.work.badges[0]}</span>
              )}
              {resonance?.work && (
                <span className="mt-1 block text-[11px] leading-relaxed text-[#B0776C]">{resonance.work}</span>
              )}
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-void-text/40 transition-transform duration-300 ${
              openCard === "work" ? "rotate-180" : ""
            }`}
          />
        </button>
        <div
          className={`px-4 pb-4 overflow-hidden transition-all duration-300 ${
            openCard === "work" ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 p-0"
          }`}
        >
          <div className="mt-2 text-sm text-void-text/80 bg-white/30 rounded-xl p-4 leading-relaxed flex flex-col gap-3">
            <div>
              <span className="font-bold text-[13px] opacity-70 block mb-1">状态分析</span>
              {tips.work.state}
            </div>
            <div>
              <span className="font-bold text-[13px] opacity-70 block mb-1">任务安排</span>
              {tips.work.tasks}
            </div>
            <div>
              <span className="font-bold text-[13px] opacity-70 block mb-1">心理调适</span>
              {tips.work.mindset}
            </div>
            <div className="text-[10px] text-void-text/50 text-right mt-1">
              参考资料：《The Body Rhythm Approach (生理节律管理法)》
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MealCard({ label, meal }: { label: string; meal: Meal }) {
  return (
    <div className="bg-white/30 rounded-xl p-3">
      <div className="font-bold mb-1 text-[13px] opacity-70">{label}</div>
      <div className="font-medium mb-1">{meal.name}</div>
      <div className="text-[12px] opacity-80">{meal.reason}</div>
      <div className="text-[11px] opacity-60 mt-1">{meal.pairing}</div>
    </div>
  );
}

function BadgeRow({ badges }: { badges: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <span key={badge} className="rounded-full bg-white/60 px-2.5 py-1 text-[10px] text-[#8C7B77]">
          {badge}
        </span>
      ))}
    </div>
  );
}
