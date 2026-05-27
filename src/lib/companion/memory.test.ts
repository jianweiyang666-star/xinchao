import assert from "node:assert/strict";
import { test } from "node:test";
import { buildUserMemoryContext } from "./memory";

test("buildUserMemoryContext summarizes preferences, onboarding, observation goal, and recent records", () => {
  const memory = buildUserMemoryContext({
    lastPeriodStart: "2026-05-23T00:00:00.000Z",
    journal: {
      "2026-05-23": {
        periodStarted: true,
        pain: { level: 4, locations: ["小腹", "腰"] },
        statusTags: {
          symptom: ["腹痛", "腰酸"],
          diet: ["冰饮", "想吃甜"],
          exercise: ["散步"]
        }
      },
      "2026-05-25": {
        pain: { level: 2, locations: ["小腹"] },
        statusTags: {
          mood: ["烦躁"],
          symptom: ["疲惫"],
          exercise: ["拉伸"]
        }
      }
    },
    onboardingAnswers: {
      concerns: ["小腹痛 / 腰酸", "疲惫、没力气"],
      painLevel: "明显疼痛，需要热敷或休息",
      suspectedTriggers: ["喝冰饮 / 吃生冷", "熬夜"],
      observationGoal: "冷饮会不会影响我的痛感",
      painTiming: "第 1 天"
    },
    observationGoal: {
      title: "冷饮会不会影响我的痛感",
      createdAt: "2026-05-20T00:00:00.000Z",
      source: "onboarding"
    },
    dietPreferences: {
      allergies: ["乳糖不耐"],
      religion: [],
      dietMode: "无限制",
      healthGoals: ["控糖"],
      spicy: "不辣",
      oil: "少油",
      avoid: ["冷饮/生冷敏感"]
    },
    exercisePreferences: {
      conditions: ["经期疼痛"],
      goals: ["缓解疼痛"],
      environment: ["室内"],
      avoiding: ["剧烈运动"]
    }
  });

  assert.match(memory, /冷饮会不会影响我的痛感/);
  assert.match(memory, /乳糖不耐/);
  assert.match(memory, /冷饮\/生冷敏感/);
  assert.match(memory, /最高痛感 4 分/);
  assert.match(memory, /腹痛/);
  assert.match(memory, /散步/);
  assert.match(memory, /不要把少量记录当成确定规律/);
});
