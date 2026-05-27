import {
  DIET_KNOWLEDGE,
  EXERCISE_KNOWLEDGE,
  LIFE_KNOWLEDGE,
  REACTION_KNOWLEDGE,
  type DietKnowledgeItem,
  type ExerciseKnowledgeItem,
  type LifeKnowledgeItem,
  type ReactionKnowledgeItem,
} from "./generated-knowledge";

type ChatLikeMessage = {
  role?: string;
  parts?: { text?: string }[];
  content?: string;
};

type Scored<T> = {
  item: T;
  score: number;
};

const PHASE_ALIASES: Record<string, string[]> = {
  月经期: ["月经期", "经期", "冬"],
  卵泡期: ["卵泡期", "春"],
  排卵期: ["排卵期", "夏"],
  黄体期: ["黄体期", "经前", "PMS", "秋"],
  全周期: ["全周期"],
};

const REACTION_KEYWORDS: Record<string, string[]> = {
  情绪: ["烦躁", "想哭", "内耗", "焦虑", "低落", "易怒", "emo", "崩溃", "情绪"],
  暴食: ["暴食", "想吃甜", "甜食", "奶茶", "巧克力", "食欲", "想吃辣", "饿"],
  痛经: ["痛经", "小腹", "肚子疼", "腹痛", "坠痛", "腰酸", "腰痛", "疼"],
  疲惫: ["疲惫", "累", "没力气", "注意力", "不想工作", "不想学习", "困", "乏"],
  水肿: ["水肿", "胀气", "胃不舒服", "腹泻", "拉肚子", "浮肿", "肠胃"],
};

const DIET_QUERY_WORDS = ["吃", "喝", "饮食", "早餐", "午餐", "晚餐", "外卖", "奶茶", "咖啡", "甜", "辣", "冰", "水肿", "胀气", "疲惫"];
const EXERCISE_QUERY_WORDS = ["运动", "散步", "拉伸", "瑜伽", "训练", "力量", "跑步", "久坐", "活动", "动一动"];
const LIFE_QUERY_WORDS = ["痛", "疼", "热敷", "止痛", "睡", "休息", "烦躁", "焦虑", "水肿", "胀气", "护肤", "工作", "任务"];

function textFromMessage(message: ChatLikeMessage) {
  if (typeof message.content === "string") return message.content;
  return message.parts?.map((part) => part.text || "").join("\n") || "";
}

function latestUserText(messages: ChatLikeMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === "user") return textFromMessage(message);
  }
  return textFromMessage(messages[messages.length - 1] || {});
}

function extractPhase(systemInstruction: string) {
  const match = systemInstruction.match(/周期阶段:\s*([^\n]+)/);
  return match?.[1]?.trim() || "";
}

function extractPrefs(systemInstruction: string) {
  const match = systemInstruction.match(/健康偏好\/禁忌:\s*([^\n]+)/);
  return match?.[1]?.trim() || "";
}

function inferPhaseFromQuery(query: string) {
  for (const [phase, aliases] of Object.entries(PHASE_ALIASES)) {
    if (aliases.some((alias) => query.includes(alias))) return phase;
  }
  return "";
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function phaseMatches(itemPhase: string, currentPhase: string) {
  if (!itemPhase) return false;
  if (itemPhase === "全周期") return true;
  if (!currentPhase) return true;
  if (itemPhase === currentPhase) return true;
  return (PHASE_ALIASES[itemPhase] || []).some((alias) => currentPhase.includes(alias));
}

function violatesDietPrefs(item: DietKnowledgeItem, prefs: string) {
  const checks: [string, keyof DietKnowledgeItem, string[]][] = [
    ["乳糖不耐", "dairy", ["含"]],
    ["海鲜过敏", "seafood", ["含"]],
    ["坚果过敏", "nuts", ["含"]],
    ["鸡蛋过敏", "egg", ["含"]],
    ["豆类过敏", "soy", ["含"]],
    ["麸质不耐", "gluten", ["含"]],
    ["纯素", "animal", ["含"]],
    ["素食", "animal", ["含"]],
    ["清真", "halal", ["否"]],
    ["控糖", "sugar", ["高"]],
    ["冷饮/生冷敏感", "temperature", ["冰", "凉"]],
    ["咖啡因敏感", "caffeine", ["含"]],
    ["辛辣敏感", "spicy", ["辣"]],
    ["高糖高油敏感", "sugar", ["高"]],
  ];

  return checks.some(([pref, field, blocked]) => {
    if (!prefs.includes(pref)) return false;
    const value = String(item[field] || "");
    return blocked.some((word) => {
      if (word === "含") return value === "含";
      if (word === "否") return value === "否";
      if (word === "高") return value === "高";
      if (word === "辣") return value !== "不辣" && value.includes("辣");
      return value.includes(word);
    });
  });
}

function scoreReaction(item: ReactionKnowledgeItem, query: string) {
  const title = item.title;
  let score = 0;
  for (const alias of item.aliases) {
    if (query.includes(alias)) score += 5;
  }
  for (const words of Object.values(REACTION_KEYWORDS)) {
    if (words.some((word) => title.includes(word)) && hasAny(query, words)) score += 4;
  }
  return score;
}

function scoreDiet(item: DietKnowledgeItem, query: string, phase: string, prefs: string) {
  if (phase && !phaseMatches(item.phase, phase)) return 0;
  const isAvoidItem = item.type.includes("避免") || item.type.includes("少");
  if (violatesDietPrefs(item, prefs) && !isAvoidItem) return -100;
  let score = phaseMatches(item.phase, phase) ? 3 : 0;
  if (hasAny(query, DIET_QUERY_WORDS)) score += 2;
  if (query.includes(item.name)) score += 6;
  if (hasAny(query, [item.name, item.examples, item.benefit].filter(Boolean))) score += 3;
  if (query.includes("甜") && ["低", "无"].includes(item.sugar)) score += 2;
  if (query.includes("冰") && item.temperature === "温热") score += 2;
  if (query.includes("冰") && isAvoidItem && ["冰", "凉"].some((word) => item.temperature.includes(word))) score += 5;
  if (query.includes("咖啡") && item.caffeine === "不含") score += 2;
  if (query.includes("咖啡") && isAvoidItem && item.caffeine === "含") score += 5;
  return score;
}

function scoreExercise(item: ExerciseKnowledgeItem, query: string, phase: string) {
  if (phase && !phaseMatches(item.phase, phase)) return 0;
  let score = phaseMatches(item.phase, phase) ? 3 : 0;
  if (hasAny(query, EXERCISE_QUERY_WORDS)) score += 2;
  if (query.includes(item.name)) score += 6;
  if (hasAny(query, [item.name, item.intensity, item.location, item.benefit].filter(Boolean))) score += 3;
  if (hasAny(query, ["痛", "疼", "累", "疲惫"]) && ["极低", "低"].includes(item.intensity)) score += 2;
  return score;
}

function scoreLife(item: LifeKnowledgeItem, query: string, phase: string) {
  if (phase && !phaseMatches(item.phase, phase)) return 0;
  let score = phaseMatches(item.phase, phase) ? 3 : 0;
  if (hasAny(query, LIFE_QUERY_WORDS)) score += 2;
  if (query.includes(item.name)) score += 6;
  if (hasAny(query, [item.name, item.subType, item.method, item.benefit].filter(Boolean))) score += 3;
  if (hasAny(query, ["痛", "疼"]) && item.subType === "疼痛管理") score += 3;
  if (hasAny(query, ["烦", "焦虑", "想哭", "情绪"]) && item.subType === "情绪") score += 3;
  if (hasAny(query, ["睡", "困", "疲惫", "累"]) && item.subType === "睡眠") score += 3;
  return score;
}

function topItems<T>(items: T[], scorer: (item: T) => number, limit: number): T[] {
  return items
    .map((item): Scored<T> => ({ item, score: scorer(item) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

function formatDiet(items: DietKnowledgeItem[]) {
  return items.map((item) => `- [饮食/${item.phase}/${item.type}] ${item.name}：${item.examples}；功效：${item.benefit}；限制：温度=${item.temperature}，糖=${item.sugar}，咖啡因=${item.caffeine}，辛辣=${item.spicy}。`).join("\n");
}

function formatExercise(items: ExerciseKnowledgeItem[]) {
  return items.map((item) => `- [运动/${item.phase}/${item.type}] ${item.name}：强度=${item.intensity}，时长=${item.duration}，场地=${item.location}；适用痛感=${item.painRange}，经量=${item.flowRange}；功效：${item.benefit}。`).join("\n");
}

function formatLife(items: LifeKnowledgeItem[]) {
  return items.map((item) => {
    const method = item.name.includes("止痛药")
      ? "必要时可考虑非甾体抗炎药，按药品说明书或医生建议使用"
      : item.method;
    return `- [生活疼痛/${item.phase}/${item.subType}/${item.type}] ${item.name}：${method}；时长=${item.duration}；作用：${item.benefit}；不适合：${item.contraindications}。`;
  }).join("\n");
}

function compactReactionBody(body: string) {
  return body
    .replace(/布洛芬、萘普生[^）]*）/g, "常见非甾体抗炎药）")
    .replace(/布洛芬\s*\d+mg\s*或萘普生\s*\d+mg（饭后）/g, "非甾体抗炎药（按说明书或医生建议使用）")
    .split("\n")
    .filter((line) => /正常机制解析|科学的方案|就医指引|^- |前列腺素|血清素|睡眠|热敷|NSAIDs|控盐|补钾|任务/.test(line))
    .slice(0, 14)
    .join("\n");
}

function formatReactions(items: ReactionKnowledgeItem[]) {
  return items.map((item) => `- [身体反应解释] ${item.title}\n${compactReactionBody(item.body)}`).join("\n");
}

export function retrieveKnowledgeContext(messages: ChatLikeMessage[], systemInstruction: string) {
  const query = latestUserText(messages);
  const phase = inferPhaseFromQuery(query) || extractPhase(systemInstruction);
  const prefs = extractPrefs(systemInstruction);

  const reactions = topItems(REACTION_KNOWLEDGE, (item) => scoreReaction(item, query), 2);
  const dietAvoid = topItems(
    DIET_KNOWLEDGE.filter((item) => item.type.includes("避免") || item.type.includes("少")),
    (item) => scoreDiet(item, query, phase, prefs),
    2
  );
  const dietRecommend = topItems(
    DIET_KNOWLEDGE.filter((item) => !item.type.includes("避免") && !item.type.includes("少")),
    (item) => scoreDiet(item, query, phase, prefs),
    3
  );
  const diet = [...dietAvoid, ...dietRecommend].slice(0, 4);
  const exercise = topItems(EXERCISE_KNOWLEDGE, (item) => scoreExercise(item, query, phase), 3);
  const life = topItems(LIFE_KNOWLEDGE, (item) => scoreLife(item, query, phase), 4);

  if (reactions.length + diet.length + exercise.length + life.length === 0) {
    return "";
  }

  return [
    "以下是本次回答检索到的知识库内容。月经、饮食、运动、疼痛、情绪机制相关建议必须优先基于这些内容，不要编造额外医学结论。",
    `检索依据：用户问题="${query}"；周期阶段="${phase || "未知"}"；偏好/禁忌="${prefs || "无"}"。`,
    reactions.length ? `\n【身体反应解释库】\n${formatReactions(reactions)}` : "",
    diet.length ? `\n【饮食建议库】\n${formatDiet(diet)}` : "",
    exercise.length ? `\n【运动建议库】\n${formatExercise(exercise)}` : "",
    life.length ? `\n【生活疼痛建议库】\n${formatLife(life)}` : "",
    "\n回答要求：只选最相关的 1-3 条转成自然语言；保留角色语气；不要提“知识库”或“检索”；知识不足时给低风险建议，并说明需要继续观察或就医。",
  ].filter(Boolean).join("\n");
}
