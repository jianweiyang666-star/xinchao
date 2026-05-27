import type { StatusTagCategory } from "@/lib/store";

export const DIET_ALLERGY_TAGS = [
  "乳糖不耐",
  "海鲜过敏",
  "坚果过敏",
  "鸡蛋过敏",
  "豆类过敏",
  "麸质不耐",
];

export const DIET_TYPE_TAGS = ["无限制", "素食", "纯素"];

export const DIET_HEALTH_GOAL_TAGS = ["控糖"];

export const DIET_SPICY_TAGS = ["不辣", "可能辣"];

export const DIET_OIL_TAGS = ["少油", "正常"];

export const DIET_SENSITIVITY_TAGS = [
  "冷饮/生冷敏感",
  "咖啡因敏感",
  "辛辣敏感",
  "高糖高油敏感",
  "熬夜敏感",
  "压力敏感",
  "久坐敏感",
];

export const EXERCISE_BASELINE_TAGS = [
  "几乎不运动",
  "每周1次",
  "每周2-3次",
  "每周4次以上",
  "运动不稳定",
];

export const EXERCISE_PERIOD_ACCEPTANCE_TAGS = [
  "完全不想动",
  "只能很轻",
  "轻微痛时可以",
  "和平时一样",
  "让 App 判断",
];

export const EXERCISE_LOCATION_TAGS = ["居家", "户外", "泳池", "健身房"];

export const EXERCISE_AVOIDING_TAGS = [
  "避免倒立",
  "避免开胯",
  "避免泡水",
  "避免高强度",
  "膝关节稳定",
];

export const PAIN_RELIEF_TAGS = [
  "热敷",
  "止痛药",
  "热饮",
  "躺着",
  "按摩",
  "硬撑",
  "拉伸",
  "吐槽",
  "都没用",
];

export const PERIOD_FLOW_TAGS = ["经量少", "经量中", "经量多"];

export const LEAK_CONCERN_TAGS = ["担心侧漏"];

export const PAIN_RELIEF_TO_LIFE_TAG: Record<string, string> = {
  热敷: "热敷下腹",
  止痛药: "服用止痛药",
  热饮: "温热汤粥/热饮",
  躺着: "允许自己休息",
  按摩: "轻柔自我按摩",
  拉伸: "轻柔拉伸",
  吐槽: "保持社交联系",
};

export const STATUS_TAG_GROUPS: {
  key: StatusTagCategory;
  label: string;
  description: string;
  tags: string[];
  secondarySections?: {
    label: string;
    tags: string[];
  }[];
}[] = [
  {
    key: "mood",
    label: "情绪",
    description: "记录今天的心情起伏",
    tags: ["平静", "开心", "有活力", "情绪波动", "焦虑", "低落", "易怒", "疲惫"],
  },
  {
    key: "symptom",
    label: "症状",
    description: "疼痛、不适、身体感受",
    tags: ["一切正常", "腹痛", "腰酸", "头痛", "乳房胀痛", "疲倦", "水肿", "失眠"],
    secondarySections: [
      {
        label: "经期补充",
        tags: [...PERIOD_FLOW_TAGS, ...LEAK_CONCERN_TAGS],
      },
      {
        label: "已用缓解方式",
        tags: PAIN_RELIEF_TAGS,
      },
    ],
  },
  {
    key: "diet",
    label: "饮食",
    description: "记录今天吃喝和忌口",
    tags: ["正常", "想吃甜", "想吃辣", "想喝热的", "食欲差", "胀气", "外卖", "喝水少"],
  },
  {
    key: "exercise",
    label: "运动",
    description: "记录活动、拉伸和休息",
    tags: ["没运动", "散步", "拉伸", "瑜伽", "力量训练", "久坐", "运动后舒服", "适合休息"],
  },
  {
    key: "sexual",
    label: "性行为",
    description: "记录到当天状态",
    tags: ["无", "有", "使用保护", "未使用保护", "事后不适", "轻微疼痛", "出血", "不想记录细节"],
  },
];
