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

export const PERIOD_PAIN_LOCATION_TAGS = ["下腹疼痛", "腰部酸痛", "乳房压痛", "头痛"];

export const PERIOD_FLOW_TAGS = ["量少", "中量", "量多", "有血块"];

export const PERIOD_PAIN_LEVEL_TAGS = ["没有疼痛", "轻微疼痛", "中度疼痛", "严重疼痛", "难以忍受"];

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
    selection?: "single" | "multiple";
  }[];
}[] = [
  {
    key: "mood",
    label: "心情",
    description: "记录今天出现过的心情",
    tags: ["平静", "快乐", "有活力", "欢悦", "情绪波动", "恼怒", "伤心", "焦虑", "抑郁", "内疚", "反复想同一件事", "精神不振", "漠然无感", "困惑", "自我苛刻"],
  },
  {
    key: "symptom",
    label: "症状",
    description: "记录今天身体已经出现的症状",
    tags: ["一切正常", "绞痛", "乳房压痛", "头痛", "粉刺", "背痛", "疲倦", "渴望", "失眠", "腹痛", "阴道瘙痒", "阴道干涩", "水肿"],
  },
  {
    key: "period",
    label: "月经期",
    description: "记录本次经期的身体感受",
    tags: [],
    secondarySections: [
      { label: "疼痛位置", tags: PERIOD_PAIN_LOCATION_TAGS },
      { label: "月经量", tags: PERIOD_FLOW_TAGS, selection: "single" },
      { label: "疼痛程度", tags: PERIOD_PAIN_LEVEL_TAGS, selection: "single" },
    ],
  },
  {
    key: "diet",
    label: "饮食",
    description: "记录今天已经吃过或喝过的内容",
    tags: ["正常吃饭", "吃了甜食", "吃了辣食", "喝了热饮", "喝了冷饮", "食欲不好", "有胀气", "喝水较少"],
  },
  {
    key: "exercise",
    label: "体力活动",
    description: "记录今天已经完成的运动",
    tags: ["没有锻炼", "瑜伽", "健身", "健身操和舞蹈", "游泳", "团队运动", "跑步", "骑自行车", "散步"],
  },
  {
    key: "sexual",
    label: "性行为",
    description: "记录当天已经发生的情况",
    tags: ["没有性行为", "发生了性行为", "使用了保护", "未使用保护", "事后感到不适", "发生轻微疼痛", "有出血", "不记录细节"],
  },
];
