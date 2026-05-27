import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPersonalizedDailyTips } from "./personalized-tips";
import { getDailyRecommendation } from "@/data/daily-recommendations";

test("buildPersonalizedDailyTips adjusts diet for preferences and observation goal", () => {
  const result = buildPersonalizedDailyTips({
    recommendation: getDailyRecommendation("menstrual", 5),
    dietPrefs: {
      allergies: ["乳糖不耐"],
      religion: [],
      dietMode: "无限制",
      healthGoals: ["控糖"],
      spicy: "不辣",
      oil: "少油",
      avoid: ["冷饮/生冷敏感"]
    },
    exercisePrefs: {
      conditions: [],
      goals: [],
      environment: [],
      avoiding: []
    },
    journalEntry: {
      statusTags: {
        diet: ["想吃甜", "胀气"]
      }
    },
    observationGoalTitle: "冷饮会不会影响我的痛感"
  });

  assert.match(result.diet.breakfast.name, /无糖豆浆/);
  assert.match(result.diet.breakfast.reason, /少油少糖版/);
  assert.ok(result.diet.badges.includes("已避开乳糖"));
  assert.ok(result.diet.badges.includes("控糖版本"));
  assert.ok(result.diet.reminders.some(line => /冷饮/.test(line)));
  assert.ok(result.diet.reminders.some(line => /甜/.test(line)));
});

test("buildPersonalizedDailyTips lowers exercise and work load when pain is recorded", () => {
  const result = buildPersonalizedDailyTips({
    recommendation: getDailyRecommendation("ovulatory", 14),
    dietPrefs: {
      allergies: [],
      religion: [],
      dietMode: "无限制",
      healthGoals: [],
      spicy: "不辣",
      oil: "正常",
      avoid: []
    },
    exercisePrefs: {
      conditions: [],
      goals: ["只能很轻"],
      environment: [],
      avoiding: ["避免高强度"]
    },
    journalEntry: {
      pain: { level: 4, locations: ["小腹"] },
      statusTags: {
        symptom: ["腹痛", "疲倦"],
        exercise: ["适合休息"]
      }
    },
    observationGoalTitle: "运动能不能让我少痛一点"
  });

  assert.equal(result.exercise.intensity, "低强度");
  assert.match(result.exercise.recommendation, /休息|热敷|拉伸/);
  assert.ok(result.exercise.badges.includes("已降强度"));
  assert.match(result.work.tasks, /必须做的一件/);
  assert.ok(result.work.badges.includes("今日降负荷"));
});
