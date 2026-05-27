import type { DailyRecommendation, ExerciseRecommendation, WorkRecommendation } from "@/data/daily-recommendations";
import type { Meal } from "@/data/diet";
import type { DietPrefs, ExercisePrefs, JournalEntry, OnboardingAnswers } from "@/lib/store";

export interface PersonalizedDailyTips {
  diet: {
    headline: string;
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    badges: string[];
    reminders: string[];
  };
  exercise: ExerciseRecommendation & {
    badges: string[];
  };
  work: WorkRecommendation & {
    badges: string[];
  };
}

interface PersonalizedDailyTipsInput {
  recommendation: DailyRecommendation;
  dietPrefs: DietPrefs;
  exercisePrefs: ExercisePrefs;
  journalEntry?: JournalEntry;
  observationGoalTitle?: string;
  onboardingAnswers?: OnboardingAnswers | null;
}

export function buildPersonalizedDailyTips(input: PersonalizedDailyTipsInput): PersonalizedDailyTips {
  const dietSignals = input.journalEntry?.statusTags?.diet ?? [];
  const symptomSignals = input.journalEntry?.statusTags?.symptom ?? [];
  const moodSignals = input.journalEntry?.statusTags?.mood ?? [];
  const exerciseSignals = input.journalEntry?.statusTags?.exercise ?? [];
  const goal = input.observationGoalTitle || input.onboardingAnswers?.customObservationGoal || input.onboardingAnswers?.observationGoal || "";

  const dietContext = {
    dietPrefs: input.dietPrefs,
    dietSignals,
    symptomSignals,
    goal,
  };

  const dietBadges = unique([
    hasMilkAvoid(input.dietPrefs) ? "已避开乳糖" : "",
    hasSeafoodAvoid(input.dietPrefs) ? "已避开海鲜" : "",
    hasEggAvoid(input.dietPrefs) ? "已避开鸡蛋" : "",
    hasBeanAvoid(input.dietPrefs) ? "已避开豆类" : "",
    hasGlutenAvoid(input.dietPrefs) ? "已避开麸质" : "",
    hasSugarControl(input.dietPrefs) ? "控糖版本" : "",
    hasColdSensitive(input.dietPrefs, goal) ? "温热优先" : "",
    dietSignals.includes("胀气") ? "减轻胃肠负担" : "",
    dietSignals.includes("想吃甜") ? "保留一点甜" : "",
  ]);

  const dietReminders = buildDietReminders(dietContext);

  const painLevel = input.journalEntry?.pain?.level ?? 0;
  const hasPain = painLevel >= 3 || symptomSignals.some(tag => /腹痛|痛|疼|腰酸|乳房胀痛/.test(tag));
  const hasFatigue = symptomSignals.some(tag => /疲倦|疲惫|水肿|失眠/.test(tag)) || moodSignals.includes("疲惫");
  const needsRest = hasPain || hasFatigue || exerciseSignals.includes("适合休息") || exerciseSignals.includes("没运动");
  const lowExercisePreference = input.exercisePrefs.goals.some(tag => /完全不想动|只能很轻/.test(tag));
  const avoidHighIntensity = input.exercisePrefs.avoiding.includes("避免高强度");

  const exercise = buildExerciseRecommendation(input.recommendation.exercise, {
    needsRest,
    lowExercisePreference,
    avoidHighIntensity,
    hasPain,
    goal,
  });

  const work = buildWorkRecommendation(input.recommendation.work, {
    hasPain,
    hasFatigue,
    moodSignals,
  });

  return {
    diet: {
      headline: dietBadges.length ? "已按你的状态调整" : input.recommendation.headline,
      breakfast: adjustMeal(input.recommendation.diet.breakfast, dietContext),
      lunch: adjustMeal(input.recommendation.diet.lunch, dietContext),
      dinner: adjustMeal(input.recommendation.diet.dinner, dietContext),
      badges: dietBadges,
      reminders: dietReminders,
    },
    exercise,
    work,
  };
}

function adjustMeal(meal: Meal, context: { dietPrefs: DietPrefs; dietSignals: string[]; symptomSignals: string[]; goal: string }): Meal {
  let next = { ...meal };

  if (context.dietPrefs.avoid.includes("忌红肉") && /牛肉|牛腩|排骨|瘦肉|猪肝/.test(next.name)) {
    next = {
      ...next,
      name: next.name.replace(/番茄豆腐牛肉汤|番茄牛肉饭|土豆胡萝卜炖牛腩|青椒瘦肉丝|莲藕排骨汤|菠菜猪肝汤|牛肉|牛腩|排骨|瘦肉|猪肝/g, "鸡肉豆腐汤"),
      notes: appendNote(next.notes, "已按忌红肉偏好替换蛋白来源")
    };
  }

  if (hasSeafoodAvoid(context.dietPrefs) && /虾仁|三文鱼|鲈鱼|鱼片|鱼/.test(next.name)) {
    next = {
      ...next,
      name: next.name.replace(/虾仁|三文鱼\/|三文鱼|鲈鱼|鱼片|清蒸鱼|鱼/g, "鸡肉"),
      notes: appendNote(next.notes, "已按海鲜过敏/忌海鲜偏好替换")
    };
  }

  if (hasMilkAvoid(context.dietPrefs) && /牛奶|酸奶|奶/.test(next.name)) {
    next = {
      ...next,
      name: next.name.replace(/牛奶\/无糖豆浆|牛奶|无糖酸奶|酸奶|奶类/g, "无糖豆浆"),
      notes: appendNote(next.notes, "已按乳糖不耐/牛奶过敏偏好替换")
    };
  }

  if (hasEggAvoid(context.dietPrefs) && /鸡蛋|蛋羹|蒸蛋|蛋花|炒蛋|水煮蛋/.test(next.name)) {
    next = {
      ...next,
      name: next.name.replace(/水煮蛋|鸡蛋|蒸蛋羹|蒸蛋|蛋花|炒蛋|蛋/g, "豆腐"),
      notes: appendNote(next.notes, "已按鸡蛋过敏偏好替换")
    };
  }

  if (hasBeanAvoid(context.dietPrefs) && /豆浆|豆腐|豆乳/.test(next.name)) {
    next = {
      ...next,
      name: next.name.replace(/无糖豆浆|豆浆|豆腐|豆乳/g, "燕麦粥"),
      notes: appendNote(next.notes, "已按豆类过敏偏好替换")
    };
  }

  if (hasGlutenAvoid(context.dietPrefs) && /面|馒头|花卷|全麦|疙瘩/.test(next.name)) {
    next = {
      ...next,
      name: next.name.replace(/全麦鸡蛋三明治|鸡蛋青菜面|山药鸡汤面|馒头|花卷|疙瘩汤|全麦|面/g, "米饭/米粥"),
      notes: appendNote(next.notes, "已按麸质不耐偏好替换")
    };
  }

  if (hasSugarControl(context.dietPrefs)) {
    next = {
      ...next,
      reason: next.reason.startsWith("（少油少糖版）") ? next.reason : `（少油少糖版）${next.reason}`,
      notes: appendNote(next.notes, "控糖时主食和甜味水果按饥饿程度减量")
    };
  }

  if (context.dietSignals.includes("胀气") || context.symptomSignals.includes("水肿")) {
    next = {
      ...next,
      pairing: `${next.pairing}；今天尽量少油少盐，吃到七八分饱`,
    };
  }

  if (context.dietSignals.includes("食欲差")) {
    next = {
      ...next,
      pairing: `${next.pairing}；没胃口就先吃半份温热主食和蛋白`,
    };
  }

  return next;
}

function buildDietReminders(context: { dietPrefs: DietPrefs; dietSignals: string[]; symptomSignals: string[]; goal: string }) {
  const reminders: string[] = [];
  if (hasColdSensitive(context.dietPrefs, context.goal)) {
    reminders.push("本周期在观察冷饮/生冷，今天优先选温热版本，先别空腹喝冰的。");
  }
  if (context.dietSignals.includes("想吃甜")) {
    reminders.push("想吃甜是可以的，先选小份、少糖、温热一点的版本。");
  }
  if (context.dietSignals.includes("想吃辣") || context.dietPrefs.avoid.includes("辛辣敏感")) {
    reminders.push("今天如果想吃辣，先降辣度，避免重油重盐一起叠加。");
  }
  if (context.dietSignals.includes("胀气")) {
    reminders.push("已经记录胀气，晚餐先走清淡、熟食、少量多次。");
  }
  if (context.dietSignals.includes("外卖")) {
    reminders.push("点外卖时优先选热汤饭、蒸/炖/煮，少选冰饮和油炸。");
  }
  return reminders.slice(0, 3);
}

function buildExerciseRecommendation(
  base: ExerciseRecommendation,
  context: { needsRest: boolean; lowExercisePreference: boolean; avoidHighIntensity: boolean; hasPain: boolean; goal: string }
): ExerciseRecommendation & { badges: string[] } {
  const badges: string[] = [];
  let next: ExerciseRecommendation = { ...base };

  if (context.needsRest || context.lowExercisePreference) {
    badges.push("已降强度");
    next = {
      title: "低负担活动",
      intensity: "低强度",
      recommendation: context.hasPain
        ? "先休息或热敷 10 分钟；如果舒服一点，再做 5-8 分钟轻柔拉伸。"
        : "散步 10-15 分钟，或做肩颈、髋部轻柔拉伸；累的话只休息也可以。",
      caution: "今天不是训练状态，目标是让身体舒服一点。头晕、疼痛加重或出血异常时停止活动。",
    };
  }

  if (context.avoidHighIntensity) {
    badges.push("避开高强度");
    next = {
      ...next,
      caution: `${next.caution} 避开跳跃、冲刺和高冲击动作。`,
    };
  }

  if (/运动|拉伸|走路|活动/.test(context.goal)) {
    badges.push("关联观察目标");
  }

  return { ...next, badges: unique(badges) };
}

function buildWorkRecommendation(
  base: WorkRecommendation,
  context: { hasPain: boolean; hasFatigue: boolean; moodSignals: string[] }
): WorkRecommendation & { badges: string[] } {
  const hasMoodLoad = context.moodSignals.some(tag => /情绪波动|焦虑|低落|易怒|烦躁|疲惫/.test(tag));
  if (!context.hasPain && !context.hasFatigue && !hasMoodLoad) {
    return { ...base, badges: [] };
  }

  return {
    state: context.hasPain
      ? "今天身体负担偏高，效率下降不代表你不行。"
      : context.hasFatigue
        ? "今天更容易掉电，适合把节奏放慢一点。"
        : "今天情绪消耗可能偏高，先减少不必要的拉扯。",
    tasks: "只保留必须做的一件事，把高压沟通、复杂决策和临时加塞尽量往后放。",
    mindset: "今天的目标不是表现很好，是少消耗一点，把基本状态保住。",
    badges: ["今日降负荷"],
  };
}

function hasColdSensitive(dietPrefs: DietPrefs, goal: string) {
  return dietPrefs.avoid.includes("冷饮/生冷敏感") || /冷饮|冰|生冷/.test(goal);
}

function hasSugarControl(dietPrefs: DietPrefs) {
  return dietPrefs.healthGoals.includes("控糖") || dietPrefs.avoid.includes("高糖高油敏感");
}

function hasSeafoodAvoid(dietPrefs: DietPrefs) {
  return dietPrefs.avoid.includes("忌海鲜水产") || dietPrefs.allergies.includes("海鲜") || dietPrefs.allergies.includes("海鲜过敏");
}

function hasMilkAvoid(dietPrefs: DietPrefs) {
  return dietPrefs.allergies.includes("牛奶") || dietPrefs.allergies.includes("乳糖不耐");
}

function hasEggAvoid(dietPrefs: DietPrefs) {
  return dietPrefs.allergies.includes("鸡蛋") || dietPrefs.allergies.includes("鸡蛋过敏");
}

function hasBeanAvoid(dietPrefs: DietPrefs) {
  return dietPrefs.allergies.includes("豆类") || dietPrefs.allergies.includes("豆类过敏");
}

function hasGlutenAvoid(dietPrefs: DietPrefs) {
  return dietPrefs.allergies.includes("麸质") || dietPrefs.allergies.includes("麸质不耐");
}

function appendNote(note: string, addition: string) {
  return note ? `${note}；${addition}` : addition;
}

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}
