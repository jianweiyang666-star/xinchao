"use client";

import { useEffect, useState } from "react";
import type { CyclePhase } from "@/lib/cycle/phases";

const ISLAND_LINES: Record<CyclePhase, { neutral: string[]; low: string[]; high: string[] }> = {
  menstrual: {
    neutral: ["今天，潮水退得很低", "你的内陆有一点干", "岛屿在低声呼吸"],
    low: ["今天的雾，比往日厚", "海面静止得像没风的湖", "岛上的树，弯了一点"],
    high: ["潮水低，但有阳光", "退潮后，岸边露出贝壳"],
  },
  follicular: {
    neutral: ["晨光正升起，海面在亮", "草地上有新长出的叶"],
    low: ["云没有散尽，但风是温的"],
    high: ["岛屿在向光生长"],
  },
  ovulatory: {
    neutral: ["金光铺满了海面", "今天，花开了"],
    low: ["阳光很烈，记得给自己留点阴影"],
    high: ["你的岛在闪光"],
  },
  luteal: {
    neutral: ["黄昏来得早一些", "海风稍急"],
    low: ["天色偏暗，落了几片叶", "潮水有些不安"],
    high: ["黄昏也很美"],
  },
};

interface Props {
  phase: CyclePhase;
  mood?: number;
}

export function IslandStatement({ phase, mood }: Props) {
  const [line, setLine] = useState<string>("");

  useEffect(() => {
    const bucket = ISLAND_LINES[phase];
    let pool: string[];
    if (mood === undefined) pool = bucket.neutral;
    else if (mood <= 1) pool = bucket.low;
    else if (mood >= 3) pool = bucket.high;
    else pool = bucket.neutral;
    setLine(pool[Math.floor(Math.random() * pool.length)]);
  }, [phase, mood]);

  if (!line) return null;
  return (
    <p className="text-xs font-light tracking-[0.05em] opacity-80 leading-relaxed text-void-text text-center text-pretty animate-ink-rise mt-2">
      {line}
    </p>
  );
}
