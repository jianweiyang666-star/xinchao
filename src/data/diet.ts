export interface DietRecommendation {
  day: number;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
}

export interface Meal {
  name: string;
  symptoms: string;
  reason: string;
  pairing: string;
  notes: string;
}

export const MENSTRUAL_DIET: Record<number, DietRecommendation> = {
  1: {
    day: 1,
    breakfast: {
      name: "小米南瓜粥 + 水煮蛋 + 清炒小青菜",
      symptoms: "普通经期、痛经、胃口弱",
      reason: "粥类温和易消化，鸡蛋补充蛋白质，青菜补充钾和叶酸",
      pairing: "粥煮稠一点，配 1 个鸡蛋和一小碟青菜",
      notes: "腹泻明显时青菜减量，先吃粥和蛋"
    },
    lunch: {
      name: "番茄牛肉饭 + 蒜蓉西兰花",
      symptoms: "经量偏多、疲劳",
      reason: "牛肉提供血红素铁，番茄和西兰花提供维 C，适合含铁餐搭配",
      pairing: "米饭半碗到一碗，牛肉 80-100g，蔬菜一大拳",
      notes: "经量异常多或头晕心悸，应提示就医"
    },
    dinner: {
      name: "清蒸鲈鱼 + 米饭 + 清炒油麦菜",
      symptoms: "痛经、普通经期、腹胀",
      reason: "鱼肉提供蛋白质，清蒸和清炒都比较清淡，适合不想吃重口味时",
      pairing: "调味少盐，米饭按饥饿程度调整",
      notes: "不方便处理整鱼时，可换虾仁豆腐蒸蛋"
    }
  },
  2: {
    day: 2,
    breakfast: {
      name: "番茄鸡蛋疙瘩汤 + 橙子",
      symptoms: "胃口弱、疲劳",
      reason: "热汤面食容易入口，鸡蛋补蛋白，橙子帮助植物性铁吸收",
      pairing: "疙瘩汤一碗，橙子半个到一个",
      notes: "胃酸明显者水果放到餐后晚一点"
    },
    lunch: {
      name: "香菇滑鸡饭 + 清炒菠菜",
      symptoms: "普通经期、疲劳",
      reason: "鸡肉蛋白质稳定，香菇增鲜，菠菜补充叶酸和钾",
      pairing: "鸡腿肉去皮更清爽，菠菜先焯水再炒",
      notes: "腹泻时减少香菇和油量"
    },
    dinner: {
      name: "鸭血豆腐汤 + 白灼生菜",
      symptoms: "经量偏多、想吃热汤",
      reason: "鸭血是常见含铁食材，豆腐补蛋白，热汤更容易入口",
      pairing: "汤里加姜丝，配少量米饭或馒头",
      notes: "鸭血选正规渠道，煮透；高尿酸者少量"
    }
  },
  3: {
    day: 3,
    breakfast: {
      name: "红枣燕麦粥 + 蒸蛋羹",
      symptoms: "PMS 想吃甜、普通经期",
      reason: "燕麦提供复合碳水，蒸蛋羹软嫩，红枣少量增加风味",
      pairing: "红枣 2-3 颗即可，不额外加糖",
      notes: "糖尿病或控糖用户去红枣"
    },
    lunch: {
      name: "土豆胡萝卜炖牛腩 + 米饭 + 凉拌黄瓜",
      symptoms: "疲劳、经量偏多",
      reason: "牛肉补铁和蛋白，土豆胡萝卜提供碳水和钾",
      pairing: "炖菜少油，配米饭和清爽黄瓜",
      notes: "腹胀明显时黄瓜改熟青菜"
    },
    dinner: {
      name: "虾仁豆腐蒸蛋 + 紫菜蛋花汤 + 米饭",
      symptoms: "普通经期、腹胀",
      reason: "蒸菜少油，虾仁和豆腐补蛋白，紫菜汤清淡",
      pairing: "米饭小半碗到一碗，汤少盐",
      notes: "海鲜过敏者换肉末豆腐蒸蛋"
    }
  },
  4: {
    day: 4,
    breakfast: {
      name: "豆浆 + 馒头 + 鸡蛋 + 拌菠菜",
      symptoms: "普通经期、忙碌早晨",
      reason: "食材常见，蛋白质和主食都够，适合快速出餐",
      pairing: "无糖豆浆 250ml，馒头 1 个，鸡蛋 1 个",
      notes: "腹胀明显者豆浆减量或换牛奶/米粥"
    },
    lunch: {
      name: "青椒瘦肉丝盖饭 + 番茄蛋汤",
      symptoms: "疲劳、普通经期",
      reason: "瘦肉补铁和蛋白，青椒提供维 C，番茄蛋汤补水",
      pairing: "青椒不要炒太久，少油快炒",
      notes: "胃肠敏感者青椒换彩椒或小油菜"
    },
    dinner: {
      name: "山药鸡汤面 + 白灼生菜",
      symptoms: "痛经、胃口弱",
      reason: "热汤面更容易吃下，鸡肉补蛋白，山药口感温和",
      pairing: "面条一碗，鸡肉 60-80g，生菜一份",
      notes: "汤面少盐，避免做成重油浓汤"
    }
  },
  5: {
    day: 5,
    breakfast: {
      name: "红薯 + 牛奶/无糖豆浆 + 鸡蛋",
      symptoms: "PMS 想吃甜、便秘",
      reason: "红薯提供复合碳水和膳食纤维，蛋奶补蛋白",
      pairing: "红薯 150-200g，鸡蛋 1 个",
      notes: "腹泻时红薯减量，换白粥或面条"
    },
    lunch: {
      name: "清蒸鲈鱼 + 米饭 + 蒜蓉油麦菜",
      symptoms: "腹胀、普通经期",
      reason: "清蒸鱼少油，蛋白质充足，适合想吃清淡时",
      pairing: "鱼 100-150g，米饭按饥饿程度",
      notes: "鱼露、酱油少放，控制钠"
    },
    dinner: {
      name: "番茄豆腐牛肉汤 + 杂粮饭",
      symptoms: "经量偏多、疲劳",
      reason: "牛肉补铁，豆腐补蛋白，番茄增加酸甜口和维 C",
      pairing: "杂粮饭可用大米加小米/燕麦米",
      notes: "胃酸明显者番茄减量"
    }
  },
  6: {
    day: 6,
    breakfast: {
      name: "鸡蛋青菜面 + 香蕉",
      symptoms: "腹泻恢复、胃口弱",
      reason: "热汤面温和，香蕉方便补充能量，鸡蛋补蛋白",
      pairing: "面条煮软，青菜少量，汤少油",
      notes: "腹泻明显时先不加太多青菜"
    },
    lunch: {
      name: "莲藕排骨汤 + 米饭 + 清炒西兰花",
      symptoms: "普通经期、疲劳",
      reason: "排骨汤提供蛋白和风味，莲藕增加饱腹，西兰花补维 C",
      pairing: "排骨焯水去浮沫，汤少盐",
      notes: "高脂敏感者去浮油或换鸡汤"
    },
    dinner: {
      name: "肉末豆腐 + 南瓜小米粥 + 白灼生菜",
      symptoms: "痛经、腹胀",
      reason: "豆腐和肉末补蛋白，南瓜小米粥温和，晚餐负担小",
      pairing: "粥一碗，肉末豆腐小份，生菜少油",
      notes: "经量多用户可把肉末换牛肉末"
    }
  },
  7: {
    day: 7,
    breakfast: {
      name: "玉米鸡蛋羹 + 黑芝麻花卷 + 苹果",
      symptoms: "普通经期、PMS 想吃甜",
      reason: "有主食、有蛋白、有水果，口味温和",
      pairing: "花卷 1 个，鸡蛋羹 1 碗，苹果半个到一个",
      notes: "胃口弱时水果放到两餐之间"
    },
    lunch: {
      name: "菠菜猪肝汤 + 米饭 + 番茄炒蛋",
      symptoms: "经量偏多、疲劳",
      reason: "猪肝提供血红素铁，番茄提供维 C，适合偶尔作为含铁餐",
      pairing: "猪肝 50-60g 即可，菠菜先焯水",
      notes: "孕期不推这道；不吃内脏者换鸭血豆腐汤"
    },
    dinner: {
      name: "香菇青菜鸡肉粥 + 蒸南瓜",
      symptoms: "经期末、胃口弱",
      reason: "粥类收尾轻松，鸡肉补蛋白，南瓜提供复合碳水",
      pairing: "粥里鸡肉撕丝，青菜出锅前放",
      notes: "体力消耗大时加 1 个鸡蛋或半个馒头"
    }
  }
};
