import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCycleReport } from "./cycle-report";

test("buildCycleReport summarizes current cycle records and compares previous cycle", () => {
  const report = buildCycleReport({
    todayKey: "2026-05-27",
    lastPeriodStart: "2026-05-23T00:00:00.000Z",
    cycleLength: 28,
    observationGoal: { title: "冷饮会不会影响我的痛感", createdAt: "2026-05-01T00:00:00.000Z", source: "onboarding" },
    onboardingAnswers: null,
    journal: {
      "2026-04-25": {
        pain: { level: 5, locations: ["小腹"] },
        statusTags: { exercise: ["散步"], symptom: ["腹痛"] }
      },
      "2026-05-20": {
        statusTags: { diet: ["冰饮"], mood: ["烦躁"], symptom: ["腹胀"] }
      },
      "2026-05-21": {
        statusTags: { exercise: ["散步"], symptom: ["疲惫"] }
      },
      "2026-05-23": {
        periodStarted: true,
        pain: { level: 7, locations: ["小腹", "腰"] },
        statusTags: { symptom: ["腹痛", "腰酸"], diet: ["冰饮"] }
      },
      "2026-05-25": {
        pain: { level: 3, locations: ["小腹"] },
        statusTags: { exercise: ["拉伸"], mood: ["焦虑"] }
      }
    }
  });

  assert.equal(report.source, "local");
  assert.equal(report.highestPain.value, "7 分");
  assert.match(report.hardestMoment.value, /5月23日/);
  assert.match(report.metrics[0].current, /2 次/);
  assert.match(report.metrics[0].compare, /比上周期高 2 分/);
  assert.match(report.metrics[1].current, /2 次/);
  assert.ok(report.clues.some(line => /冰饮/.test(line)));
  assert.match(report.nextExperiment, /冷饮/);
  assert.match(report.disclaimer, /不代表确定因果/);
});

test("buildCycleReport returns an empty state when records are scarce", () => {
  const report = buildCycleReport({
    todayKey: "2026-05-27",
    lastPeriodStart: null,
    cycleLength: 28,
    observationGoal: null,
    onboardingAnswers: null,
    journal: {}
  });

  assert.equal(report.hasEnoughData, false);
  assert.equal(report.highestPain.value, "--");
  assert.match(report.summary, /再记录几次/);
});
