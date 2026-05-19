import type { CyclePhase } from "@/lib/cycle/phases";
import { MENSTRUAL_DIET, type DietRecommendation } from "@/data/diet";

export interface ExerciseRecommendation {
  title: string;
  intensity: string;
  recommendation: string;
  caution: string;
}

export interface WorkRecommendation {
  state: string;
  tasks: string;
  mindset: string;
}

export interface DailyRecommendation {
  phase: CyclePhase;
  headline: string;
  diet: DietRecommendation;
  exercise: ExerciseRecommendation;
  work: WorkRecommendation;
}

const FOLLICULAR_DIET: DietRecommendation = {
  day: 0,
  breakfast: {
    name: "燕麦牛奶粥 + 鸡蛋 + 蓝莓/苹果",
    symptoms: "经期后恢复、精力回升",
    reason: "燕麦提供全谷物和膳食纤维，蛋奶补充蛋白，水果让早餐更清爽",
    pairing: "燕麦煮软，配 1 个鸡蛋和一小份水果",
    notes: "乳糖不耐受可把牛奶换成无糖豆浆"
  },
  lunch: {
    name: "彩椒鸡胸杂粮饭 + 清炒西兰花",
    symptoms: "清醒度回升、想恢复规律",
    reason: "鸡胸肉轻负担补蛋白，彩椒和西兰花增加蔬菜与维 C，杂粮饭提供稳定能量",
    pairing: "杂粮饭半碗到一碗，鸡胸 80-120g，蔬菜一大拳",
    notes: "不吃鸡肉可换虾仁、豆腐或瘦肉"
  },
  dinner: {
    name: "虾仁豆腐蒸蛋 + 菠菜蘑菇汤 + 米饭",
    symptoms: "晚间想清淡、恢复期",
    reason: "虾仁、豆腐、鸡蛋形成轻盈蛋白组合，汤菜让晚餐清淡但不空",
    pairing: "蒸蛋少盐，汤里多放熟蔬菜，米饭按饥饿程度调整",
    notes: "海鲜过敏者换肉末豆腐蒸蛋"
  }
};

const OVULATORY_DIET: DietRecommendation = {
  day: 0,
  breakfast: {
    name: "全麦鸡蛋三明治 + 无糖酸奶 + 奇异果",
    symptoms: "能量较高、日程较满",
    reason: "全麦主食、鸡蛋、奶类和水果搭配完整，适合高能量日的清爽早餐",
    pairing: "全麦面包 2 片，鸡蛋 1 个，酸奶一小杯",
    notes: "乳制品不适可换无糖豆浆"
  },
  lunch: {
    name: "三文鱼/鸡腿肉藜麦饭 + 生熟蔬菜拼盘",
    symptoms: "行动力强、社交或运动较多",
    reason: "优质蛋白搭配全谷物和多色蔬菜，支持更活跃的一天",
    pairing: "蛋白质 100-150g，藜麦或米饭一份，蔬菜至少一大拳",
    notes: "忌生冷时蔬菜全部改成熟食"
  },
  dinner: {
    name: "番茄豆腐牛肉汤 + 杂粮饭 + 白灼青菜",
    symptoms: "高能量日收尾、晚餐想轻一点",
    reason: "晚餐保留蛋白和主食，用汤菜降低油腻感，避免晚上吃得过重",
    pairing: "汤少油少盐，杂粮饭小半碗到一碗",
    notes: "忌红肉可换番茄鱼片豆腐汤"
  }
};

const LUTEAL_DIET: DietRecommendation = {
  day: 0,
  breakfast: {
    name: "红薯燕麦粥 + 鸡蛋 + 无糖豆浆",
    symptoms: "容易想吃甜、上午能量波动",
    reason: "复合碳水和蛋白组合更抗饿，适合需要稳定能量的早晨",
    pairing: "红薯 100-150g，燕麦一小把，鸡蛋 1 个",
    notes: "控糖用户红薯减量，不额外加糖"
  },
  lunch: {
    name: "香菇鸡肉糙米饭 + 清炒小油菜",
    symptoms: "腹胀、食欲增加、想吃饱",
    reason: "鸡肉补蛋白，糙米和香菇增加饱腹感，小油菜补充蔬菜",
    pairing: "糙米饭煮软，鸡肉 80-120g，蔬菜一大拳",
    notes: "胃肠敏感时糙米换软米饭"
  },
  dinner: {
    name: "山药鸡汤面 + 白灼生菜",
    symptoms: "疲惫、想吃热食、睡前需要安定",
    reason: "温热汤面和山药更有安定感，鸡肉补蛋白，晚餐不过度刺激",
    pairing: "面条一碗，鸡肉 60-80g，生菜少油",
    notes: "油脂敏感者去浮油，汤面少盐"
  }
};

const PHASE_RECOMMENDATIONS: Record<CyclePhase, Omit<DailyRecommendation, "diet"> & { diet: DietRecommendation }> = {
  menstrual: {
    phase: "menstrual",
    headline: "温热补给 · 慢慢恢复",
    diet: MENSTRUAL_DIET[1],
    exercise: {
      title: "轻柔拉伸",
      intensity: "低强度",
      recommendation: "热敷后散步 10-20 分钟，或做猫式伸展、婴儿式、仰卧抱膝。",
      caution: "痛经明显、头晕、出血量异常或疲惫时暂停运动，优先休息。"
    },
    work: {
      state: "精力值偏低，身体可能需要更多缓冲。",
      tasks: "适合处理熟悉、确定性高、低社交消耗的任务，如整理资料、复盘、轻量沟通。",
      mindset: "不要把效率下降理解为失败，今天的目标是稳定度过。"
    }
  },
  follicular: {
    phase: "follicular",
    headline: "清爽补给 · 恢复上升",
    diet: FOLLICULAR_DIET,
    exercise: {
      title: "恢复上升",
      intensity: "轻中强度",
      recommendation: "快走 25-35 分钟、轻量瑜伽、普拉提基础训练，或低冲击有氧。",
      caution: "刚从经期恢复时不要立刻冲高强度；如果仍有腹痛或疲劳，改为散步和拉伸。"
    },
    work: {
      state: "清醒度和启动能力回升，适合把想法重新组织起来。",
      tasks: "适合做计划、写方案、学习新内容、整理 backlog、启动新项目。",
      mindset: "利用想开始的势头，但不要把一天塞满，给身体保留余量。"
    }
  },
  ovulatory: {
    phase: "ovulatory",
    headline: "清爽补水 · 蛋白充足",
    diet: OVULATORY_DIET,
    exercise: {
      title: "活力输出",
      intensity: "中等强度",
      recommendation: "力量训练 30-40 分钟、舞蹈、有氧操、骑行或较快节奏的快走。",
      caution: "高温或出汗多时注意补水；腹部不适、排卵痛明显时降低强度。"
    },
    work: {
      state: "表达欲和连接感可能更强，适合对外输出。",
      tasks: "适合开会、展示、面试、谈合作、做需要感染力和临场反应的任务。",
      mindset: "能量高时也要留意过度承诺，重要事项可以当场记录边界和下一步。"
    }
  },
  luteal: {
    phase: "luteal",
    headline: "稳定能量 · 温热饱腹",
    diet: LUTEAL_DIET,
    exercise: {
      title: "放松紧绷",
      intensity: "中低强度",
      recommendation: "舒缓瑜伽 20-30 分钟、散步、泡沫轴放松、肩颈拉伸。",
      caution: "乳房胀痛、腹胀、睡眠差时避免跳跃和高冲击训练。"
    },
    work: {
      state: "更适合沉淀、收束和保护注意力。",
      tasks: "适合复盘、整理、收尾、质检、财务/表格类校对、归档。",
      mindset: "减少临时插入事项，给会议和社交设置明确边界。"
    }
  }
};

export function getDailyRecommendation(phase: CyclePhase, cycleDay: number): DailyRecommendation {
  if (phase === "menstrual") {
    return {
      ...PHASE_RECOMMENDATIONS.menstrual,
      diet: MENSTRUAL_DIET[cycleDay] ?? MENSTRUAL_DIET[1]
    };
  }

  return PHASE_RECOMMENDATIONS[phase];
}
