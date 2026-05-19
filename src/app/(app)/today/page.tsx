"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, BookHeart } from "lucide-react";
import { FloatingIsland } from "@/components/innertide/floating-island";
import { IslandStatement } from "@/components/innertide/island-statement";
import { ModeController } from "@/components/innertide/mode-controller";
import { ChaoFab } from "@/components/innertide/chao-fab";
import { BgmToggle } from "@/components/innertide/bgm-toggle";
import { DailyTips } from "@/components/innertide/daily-tips";
import { useInnertideStore, todayKey } from "@/lib/store";
import { computeCycleState, PHASE_LABELS, type CyclePhase } from "@/lib/cycle/phases";
import { getDailyRecommendation } from "@/data/daily-recommendations";

const PHASE_PREVIEW_DAYS: Record<CyclePhase, number> = {
  menstrual: 1,
  follicular: 10,
  ovulatory: 14,
  luteal: 22,
};

const PHASE_NAV: { phase: CyclePhase; season: string }[] = [
  { phase: "menstrual", season: "冬" },
  { phase: "follicular", season: "春" },
  { phase: "ovulatory", season: "夏" },
  { phase: "luteal", season: "秋" },
];

export default function TodayPage() {
  const { store, loaded } = useInnertideStore();
  const [previewPhase, setPreviewPhase] = useState<CyclePhase | null>(null);
  if (!loaded) return null;

  const last = store.lastPeriodStart ? new Date(store.lastPeriodStart) : null;
  const cycle = computeCycleState(last);
  const todayEntry = store.journal[todayKey()];
  const todayMood = todayEntry?.mood;
  const activePhase = previewPhase ?? cycle.phase;
  const activeCycleDay = previewPhase ? PHASE_PREVIEW_DAYS[previewPhase] : cycle.cycleDay;
  const recommendation = getDailyRecommendation(activePhase, activeCycleDay);

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden text-[#4A3E3B]">
      <BgmToggle phase={activePhase} />

      {/* Header */}
      <header className="relative z-30 flex items-center justify-between px-5 pt-8 pb-2 mt-4">
        <Link
          href="/about"
          className="text-xs font-medium tracking-[0.2em] uppercase opacity-70 text-[#4A3E3B] transition hover:opacity-100 p-2"
        >
          关于我
        </Link>
        <Link
          href="/journal"
          className="flex items-center gap-1.5 text-xs font-medium tracking-[0.2em] uppercase opacity-70 text-[#4A3E3B] transition hover:opacity-100 p-2"
        >
          <BookHeart className="h-4 w-4" />
          小岛日记
        </Link>
      </header>

      <main className="relative z-10 flex flex-col items-center px-6 pt-2 pb-64 animate-ink-rise-slow">
        {/* Floating Island (Metaball updated version) */}
        <div className="pointer-events-none">
          <FloatingIsland phase={activePhase} mood={todayMood} mode={store.appMode} />
        </div>

        {/* Phase Titles */}
        <div className="mt-7 flex flex-col items-center gap-2">
          <h2 className="font-serif text-4xl font-light italic text-[#4A3E3B] text-center">
            {PHASE_LABELS[activePhase].medical}
          </h2>
          <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] uppercase text-[#FF85A2]">
            <span className="h-px w-6 bg-[#FF85A2]/50" />
            <span>{PHASE_LABELS[activePhase].subtitle}</span>
            <span className="h-px w-6 bg-[#FF85A2]/50" />
          </div>
          
          <div className="mt-8 flex flex-col items-center gap-1">
            <p className="text-[10px] font-sans font-medium tracking-[0.2em] uppercase text-[#4A3E3B]/40">
              我们与你同在 · WE ARE WITH YOU
            </p>
            <p className="text-[13px] font-serif italic text-[#4A3E3B] bg-white/40 px-4 py-1 rounded-full backdrop-blur-sm shadow-sm border border-white/20">
              此刻有 <span className="text-[#D4A373] font-bold">12,504</span> 位女性正在共同渡过
            </p>
          </div>
        </div>

        {/* Island Statement */}
        <div className="mt-8 w-full max-w-xs text-[#4A3E3B]">
          <IslandStatement phase={activePhase} mood={todayMood} />
        </div>

        {/* Daily Recommendations */}
        <div className="w-full mt-12">
          <DailyTips 
            recommendation={recommendation}
            dietPrefs={store.dietPreferences}
            exercisePrefs={store.exercisePreferences}
          />
        </div>
        
        {/* Safe area spacer to prevent phase bar overlap at the very bottom */}
        <div className="h-12 w-full" />
      </main>

      {/* Bottom Phase Bar - Anchored style for better stability */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-t border-[#DECEC1]/30 px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto flex items-center justify-between text-[#4A3E3B]">
          {PHASE_NAV.map(({ phase, season }) => {
            const active = activePhase === phase;
            return (
              <button
                key={phase}
                type="button"
                onClick={() => setPreviewPhase(phase)}
                className={`flex flex-col items-center justify-center w-[22%] py-2 rounded-2xl transition-all duration-500 ${
                  active ? 'bg-[#F2ECE6] shadow-sm scale-105' : 'opacity-40 hover:opacity-100'
                }`}
              >
                <span className={`text-[14px] font-serif italic ${active ? 'text-[#D4A373]' : ''}`}>{season}</span>
                <span className="text-[10px] mt-0.5">{PHASE_LABELS[phase].medical}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ChaoFab />
    </div>
  );
}
