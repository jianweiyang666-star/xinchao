"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useInnertideStore, type OnboardingAnswers } from "@/lib/store";

const CONCERNS = [
  "小腹痛 / 腰酸",
  "疲惫、没力气",
  "情绪烦躁或低落",
  "注意力下降，影响工作学习",
  "水肿、腹泻或胃不舒服",
  "食欲变化，想吃甜/辣/冰",
  "基本不困扰，只想记录周期",
];

const PAIN_LEVELS = [
  "几乎不痛，只是轻微不适",
  "会痛，但基本不影响生活",
  "明显疼痛，需要热敷或休息",
  "疼到影响学习/工作",
  "严重到需要止痛药，甚至无法正常活动",
  "每次不太一样",
];

const TRIGGERS = [
  "喝冰饮 / 吃生冷",
  "喝咖啡 / 浓茶",
  "吃辣或重口味",
  "熬夜",
  "压力大",
  "久坐不动",
  "运动太少",
  "剧烈运动",
  "我还没注意过，但想看看",
  "我觉得影响不大",
];

const GOALS = [
  "冷饮会不会影响我的痛感",
  "咖啡会不会让我更不舒服",
  "熬夜后是不是更容易痛",
  "运动能不能让我少痛一点",
  "压力大时痛感会不会更明显",
  "饮食清淡几天有没有帮助",
  "我想让心潮帮我发现规律",
  "我想自己填写",
];

const REGULARITY = ["规律", "不太规律", "说不准"];
const DURATIONS = ["3 天以内", "4-5 天", "6-7 天", "7 天以上", "不确定"];
const PAIN_TIMING = ["经前 1-3 天", "第 1 天", "第 2 天", "整个经期", "不固定", "几乎不痛"];

const INITIAL_ANSWERS: OnboardingAnswers = {
  concerns: [],
  painLevel: "",
  suspectedTriggers: [],
  observationGoal: "",
  customObservationGoal: "",
  cycleRegularity: "",
  periodDuration: "",
  painTiming: "",
};

export function OnboardingQuestionnaire() {
  const { update } = useInnertideStore();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(INITIAL_ANSWERS);
  const [showResult, setShowResult] = useState(false);

  const goalTitle = useMemo(() => {
    if (answers.observationGoal === "我想自己填写") {
      return answers.customObservationGoal?.trim() || "让我自己发现这个周期的规律";
    }
    return answers.observationGoal || "让心潮帮我发现规律";
  }, [answers.customObservationGoal, answers.observationGoal]);

  const toggleMulti = (field: "concerns" | "suspectedTriggers", value: string) => {
    setAnswers((current) => {
      const list = current[field];
      const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
      return { ...current, [field]: next };
    });
  };

  const canContinue = () => {
    if (step === 0) return answers.concerns.length > 0;
    if (step === 1) return Boolean(answers.painLevel);
    if (step === 2) return answers.suspectedTriggers.length > 0;
    if (step === 3) return Boolean(answers.observationGoal) && (answers.observationGoal !== "我想自己填写" || Boolean(answers.customObservationGoal?.trim()));
    return true;
  };

  const next = () => {
    if (!canContinue()) return;
    if (step >= 4) {
      setShowResult(true);
      return;
    }
    setStep((value) => value + 1);
  };

  const back = () => {
    if (step === 0) return;
    setStep((value) => value - 1);
  };

  const complete = () => {
    update({
      onboardingCompleted: true,
      onboardingAnswers: answers,
      observationGoal: {
        title: goalTitle,
        createdAt: new Date().toISOString(),
        source: "onboarding",
      },
    });
    window.location.hash = "/today";
  };

  if (showResult) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF6F2] px-6 py-8 text-[#221A18]">
        <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-center">
          <div className="rounded-[32px] bg-white/58 p-6 shadow-sm backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F8EFE8] text-[#D4A373]">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="mt-6 text-[26px] font-semibold leading-tight">已生成你的本周期观察目标</h1>
            <p className="mt-5 text-[15px] leading-relaxed text-[#6E625F]">
              这个周期，心潮会先陪你观察：{goalTitle}。
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-[#6E625F]">
              你不需要每天认真打卡，只要在相关习惯、痛感变化或经期不舒服时顺手记一下。
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-[#6E625F]">
              周期结束后，我们会帮你看看：这件事和你的痛经状态有没有可能相关。
            </p>
          </div>

          <button
            type="button"
            onClick={complete}
            className="mt-6 rounded-full bg-[#221A18] px-5 py-4 text-[15px] font-medium text-white transition active:scale-[0.98]"
          >
            进入今日状态
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAF6F2] px-5 py-6 text-[#221A18]">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-md flex-col">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] font-medium tracking-[0.16em] text-[#8C7B77]">心潮初始观察</div>
            <div className="mt-1 text-[20px] font-semibold">{step + 1} / 5</div>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }, (_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${index === step ? "w-6 bg-[#221A18]" : "w-2 bg-[#D8D0CC]"}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-7 flex-1 rounded-[32px] bg-white/58 p-5 shadow-sm backdrop-blur-md">
          {step === 0 && (
            <Question title="你来月经时，最困扰你的是什么？" subtitle="可以多选，先从真实体验开始。">
              <OptionGrid options={CONCERNS} selected={answers.concerns} onToggle={(value) => toggleMulti("concerns", value)} />
            </Question>
          )}

          {step === 1 && (
            <Question title="你的痛经通常到什么程度？" subtitle="先用轻量选择，日常记录里再细分痛感。">
              <OptionList options={PAIN_LEVELS} selected={answers.painLevel} onSelect={(value) => setAnswers({ ...answers, painLevel: value })} />
            </Question>
          )}

          {step === 2 && (
            <Question title="你有没有怀疑过，某些习惯会让你更不舒服？" subtitle="可以多选，心潮会帮你留意这些线索。">
              <OptionGrid options={TRIGGERS} selected={answers.suspectedTriggers} onToggle={(value) => toggleMulti("suspectedTriggers", value)} />
            </Question>
          )}

          {step === 3 && (
            <Question title="这个周期，我们先一起观察一件事吧" subtitle="选一个就好，目标越轻，越容易坚持。">
              <OptionList options={GOALS} selected={answers.observationGoal} onSelect={(value) => setAnswers({ ...answers, observationGoal: value })} />
              {answers.observationGoal === "我想自己填写" && (
                <input
                  value={answers.customObservationGoal}
                  onChange={(event) => setAnswers({ ...answers, customObservationGoal: event.target.value })}
                  placeholder="写下你想观察的事"
                  className="mt-3 w-full rounded-2xl bg-[#FAF6F2] px-4 py-3 text-[14px] outline-none placeholder:text-[#8C7B77]/55"
                />
              )}
            </Question>
          )}

          {step === 4 && (
            <Question title="为了提醒更准确，补充一点周期信息" subtitle="这一题可以跳过，之后也能在关于我里补充。">
              <MiniSelect title="你的月经通常规律吗？" options={REGULARITY} selected={answers.cycleRegularity} onSelect={(value) => setAnswers({ ...answers, cycleRegularity: value })} />
              <MiniSelect title="一次月经通常持续几天？" options={DURATIONS} selected={answers.periodDuration} onSelect={(value) => setAnswers({ ...answers, periodDuration: value })} />
              <MiniSelect title="痛感最明显通常在什么时候？" options={PAIN_TIMING} selected={answers.painTiming} onSelect={(value) => setAnswers({ ...answers, painTiming: value })} />
            </Question>
          )}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/58 text-[#6E625F] disabled:opacity-30"
            aria-label="上一题"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={next}
            disabled={!canContinue()}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#221A18] px-5 text-[15px] font-medium text-white transition disabled:opacity-30 active:scale-[0.98]"
          >
            {step === 4 ? "生成观察目标" : "下一题"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {step === 4 && (
          <button
            type="button"
            onClick={() => setShowResult(true)}
            className="mt-3 text-center text-[13px] text-[#8C7B77]"
          >
            跳过这一题
          </button>
        )}
      </div>
    </div>
  );
}

function Question({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div>
      <h1 className="text-[24px] font-semibold leading-tight">{title}</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-[#8C7B77]">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function OptionGrid({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div className="grid gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`flex min-h-12 items-center justify-between rounded-2xl px-4 py-3 text-left text-[14px] transition active:scale-[0.99] ${
              active ? "bg-[#221A18] text-white" : "bg-[#FAF6F2] text-[#4A3E3B]"
            }`}
          >
            <span>{option}</span>
            {active && <Check className="h-4 w-4" />}
          </button>
        );
      })}
    </div>
  );
}

function OptionList({ options, selected, onSelect }: { options: string[]; selected?: string; onSelect: (value: string) => void }) {
  return (
    <div className="grid gap-2">
      {options.map((option) => {
        const active = selected === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`flex min-h-12 items-center justify-between rounded-2xl px-4 py-3 text-left text-[14px] transition active:scale-[0.99] ${
              active ? "bg-[#221A18] text-white" : "bg-[#FAF6F2] text-[#4A3E3B]"
            }`}
          >
            <span>{option}</span>
            {active && <Check className="h-4 w-4" />}
          </button>
        );
      })}
    </div>
  );
}

function MiniSelect({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: string[];
  selected?: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-2 text-[14px] font-medium text-[#4A3E3B]">{title}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={`rounded-full px-3 py-2 text-[13px] transition active:scale-95 ${
                active ? "bg-[#221A18] text-white" : "bg-[#FAF6F2] text-[#6E625F]"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
