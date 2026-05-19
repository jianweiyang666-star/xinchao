"use client";

import { useState } from "react";
import { useInnertideStore, todayKey } from "@/lib/store";

const LEVELS = [
  { value: 0, label: "糟" },
  { value: 1, label: "不太好" },
  { value: 2, label: "还行" },
  { value: 3, label: "不错" },
  { value: 4, label: "很好" },
];

export function BreathPoints() {
  const { store, setMoodToday } = useInnertideStore();
  const current = store.journal[todayKey()]?.mood;
  const [clicked, setClicked] = useState<number | null>(null);

  const handleClick = (val: number) => {
    setClicked(val);
    setMoodToday(val);
    setTimeout(() => setClicked(null), 1400); // ripple duration
  };

  return (
    <div className="flex flex-col items-center gap-6 relative">
      <div className="flex items-center gap-7">
        {LEVELS.map((lv) => {
          const active = current === lv.value;
          const isClicked = clicked === lv.value;
          return (
            <button
              key={lv.value}
              type="button"
              onClick={() => handleClick(lv.value)}
              className="group flex flex-col items-center gap-2 relative"
              aria-label={`今天感觉 ${lv.label}`}
              aria-pressed={active}
            >
              <span
                className={`block h-2.5 w-2.5 rounded-full border transition-all duration-500 z-10 relative ${
                  active
                    ? "bg-orb-ovulation border-orb-ovulation scale-150 deep-glow-gold"
                    : "border-void-muted group-hover:border-void-text bg-transparent"
                }`}
              />
              {isClicked && (
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full border border-orb-ovulation animate-ripple z-0 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
      
      <div className="h-6 flex items-center justify-center">
        <span
          className={`text-[10px] tracking-breathe-wide text-void-muted transition-all duration-700 ${
             clicked !== null ? "scale-110 opacity-100 text-void-text" : "scale-100 opacity-60"
          }`}
          style={{ opacity: current === undefined ? 0.5 : 1 }}
        >
          {current === undefined ? "今天，怎么样" : LEVELS[current].label}
        </span>
      </div>
    </div>
  );
}
