"use client";

import { useState } from "react";
import { Coffee, Activity, Briefcase, ChevronDown } from "lucide-react";
import { type DailyRecommendation } from "@/data/daily-recommendations";
import { type DietPrefs, type ExercisePrefs } from "@/lib/store";
import { type Meal } from "@/data/diet";

interface DailyTipsProps {
  recommendation: DailyRecommendation;
  dietPrefs: DietPrefs;
  exercisePrefs: ExercisePrefs;
}

export function DailyTips({ recommendation, dietPrefs, exercisePrefs }: DailyTipsProps) {
  const [openCard, setOpenCard] = useState<"diet" | "exercise" | "work" | null>(null);

  const toggleCard = (card: "diet" | "exercise" | "work") => {
    if (openCard === card) {
      setOpenCard(null);
    } else {
      setOpenCard(card);
    }
  };

  // Logic to filter/adjust text based on preferences
  const hasDietAvoid = dietPrefs.avoid.length > 0;
  const hasHealthGoal = dietPrefs.healthGoals.length > 0;
  const exerciseGoals = exercisePrefs.goals;
  const healthIssues = exercisePrefs.avoiding;
  const dietInfo = recommendation.diet;

  return (
    <div className="mt-8 flex flex-col gap-3 w-full max-w-sm mx-auto">
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] opacity-40 text-center mb-2">今日宜做</h3>

      {/* Diet Card */}
      <div className="bg-white/40 backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300 border border-white/50">
        <button
          onClick={() => toggleCard("diet")}
          className="w-full flex items-center justify-between p-4 focus:outline-none"
        >
          <div className="flex items-center gap-3 text-[#4A3E3B]">
            <div className="p-2 rounded-full bg-[#FFA582]/20 text-[#FF85A2]">
              <Coffee className="w-4 h-4" />
            </div>
            <div className="text-left">
               <span className="font-medium text-[14px]">今日饮食建议</span>
               {(hasDietAvoid || hasHealthGoal) && (
                 <span className="block text-[10px] opacity-40">已根据偏好调整</span>
               )}
               {!hasDietAvoid && !hasHealthGoal && (
                 <span className="block text-[10px] opacity-40">{recommendation.headline}</span>
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
            <MealCard label="早餐" meal={adjustMeal(dietInfo.breakfast, dietPrefs)} />
            <MealCard label="午餐" meal={adjustMeal(dietInfo.lunch, dietPrefs)} />
            <MealCard label="晚餐" meal={adjustMeal(dietInfo.dinner, dietPrefs)} />

            {dietPrefs.avoid.includes("忌生冷") && (
              <div className="mt-2 p-2 bg-[#FFE0E0]/30 rounded-lg text-[11px] text-[#FF5A5A] border border-[#FF5A5A]/10">
                提醒：系统已检测到您“忌生冷”，上述建议请温热食用。
              </div>
            )}

            <div className="text-[10px] opacity-50 text-right mt-1">
              参考资料：《中国居民膳食指南 (2022)》
            </div>
          </div>
        </div>
      </div>

      {/* Exercise Card */}
      <div className="bg-white/40 backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300 border border-white/50">
        <button
          onClick={() => toggleCard("exercise")}
          className="w-full flex items-center justify-between p-4 focus:outline-none"
        >
          <div className="flex items-center gap-3 text-[#4A3E3B]">
            <div className="p-2 rounded-full bg-[#DFADDB]/20 text-[#BFA5D4]">
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="font-medium text-[14px]">今日运动建议</span>
              {exerciseGoals.length > 0 ? (
                <span className="block text-[10px] opacity-40">已锁定目标：{exerciseGoals[0]}</span>
              ) : (
                <span className="block text-[10px] opacity-40">{recommendation.exercise.intensity} · {recommendation.exercise.title}</span>
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
            <div>
              <span className="font-bold text-[13px] opacity-70 block mb-1">推荐项目</span>
              {exerciseGoals.includes("缓解痛经") ? "猫式伸展或婴儿式（瑜伽），时长 15 分钟。" : recommendation.exercise.recommendation}
            </div>
            <div>
              <span className="font-bold text-[13px] opacity-70 block mb-1">注意事项</span>
              {healthIssues.includes("膝盖受损") ? "系统检测到膝盖不适，请避免深蹲及高冲击性动作。" : recommendation.exercise.caution}
            </div>
            <div className="text-[10px] opacity-50 text-right mt-1">
              参考资料：《ACOG 女性运动指南》
            </div>
          </div>
        </div>
      </div>

      {/* Work Card */}
      <div className="glass rounded-2xl overflow-hidden transition-all duration-300">
        <button
          onClick={() => toggleCard("work")}
          className="w-full flex items-center justify-between p-4 focus:outline-none"
        >
          <div className="flex items-center gap-3 text-void-text">
            <div className="p-2 rounded-full bg-[#FFE5A3]/30 text-[#D4A373]">
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="font-medium text-[14px]">今日工作建议</span>
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
              {recommendation.work.state}
            </div>
            <div>
              <span className="font-bold text-[13px] opacity-70 block mb-1">任务安排</span>
              {recommendation.work.tasks}
            </div>
            <div>
              <span className="font-bold text-[13px] opacity-70 block mb-1">心理调适</span>
              {recommendation.work.mindset}
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

function adjustMeal(meal: Meal, dietPrefs: DietPrefs): Meal {
  let next = { ...meal };
  const avoidRedMeat = dietPrefs.avoid.includes("忌红肉");
  const avoidSeafood = dietPrefs.avoid.includes("忌海鲜水产") || dietPrefs.allergies.includes("海鲜");
  const avoidMilk = dietPrefs.allergies.includes("牛奶");
  const controlSugar = dietPrefs.healthGoals.includes("控糖");

  if (avoidRedMeat && /牛肉|排骨|瘦肉/.test(next.name)) {
    next = {
      ...next,
      name: next.name.replace(/番茄豆腐牛肉汤|番茄牛肉饭|牛肉|排骨|瘦肉/g, "清蒸鱼片"),
      notes: `${next.notes}；已按忌红肉偏好替换蛋白来源`
    };
  }

  if (avoidSeafood && /虾仁|三文鱼|鲈鱼|鱼片|鱼/.test(next.name)) {
    next = {
      ...next,
      name: next.name.replace(/虾仁|三文鱼\/|三文鱼|鲈鱼|鱼片|鱼/g, "鸡肉"),
      notes: `${next.notes}；已按海鲜过敏/忌海鲜偏好替换`
    };
  }

  if (avoidMilk && /牛奶|酸奶/.test(next.name)) {
    next = {
      ...next,
      name: next.name.replace(/牛奶|无糖酸奶|酸奶/g, "无糖豆浆"),
      notes: `${next.notes}；已按牛奶过敏偏好替换`
    };
  }

  if (controlSugar) {
    next = {
      ...next,
      reason: `（少油少糖版）${next.reason}`,
      notes: `${next.notes}；控糖时主食和甜味水果按饥饿程度减量`
    };
  }

  return next;
}
