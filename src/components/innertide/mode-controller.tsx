"use client";

import { todayKey, useInnertideStore } from "@/lib/store";
import { Zap, Heart } from "lucide-react";

export function ModeController() {
  const { store, update, setMoodToday } = useInnertideStore();
  const currentMode = store.appMode;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-xs animate-phase-fade">
      {/* Mode Toggle */}
      <div className="relative flex items-center bg-white/40 backdrop-blur-sm p-1 rounded-2xl border border-white/50 w-full">
        <button
          onClick={() => update({ appMode: 'healing' })}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-500 z-10 ${
            currentMode === 'healing' ? 'bg-white shadow-sm text-[#4A3E3B]' : 'text-[#4A3E3B]/40'
          }`}
        >
          <Heart className={`w-4 h-4 ${currentMode === 'healing' ? 'fill-[#D4A373] text-[#D4A373]' : ''}`} />
          <span className="text-xs font-medium tracking-widest">疗愈模式</span>
        </button>
        <button
          onClick={() => update({ appMode: 'resonance' })}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-500 z-10 ${
            currentMode === 'resonance' ? 'bg-white shadow-sm text-[#4A3E3B]' : 'text-[#4A3E3B]/40'
          }`}
        >
          <Zap className={`w-4 h-4 ${currentMode === 'resonance' ? 'fill-[#D4A373] text-[#D4A373]' : ''}`} />
          <span className="text-xs font-medium tracking-widest">共振模式</span>
        </button>
      </div>

      {/* State Reflection / Subtle Mood selection as a sandbox "Density" controller */}
      <div className="flex flex-col items-center gap-3 w-full">
         <p className="text-[10px] uppercase tracking-[0.3em] opacity-40">内心起伏</p>
         <div className="flex items-center justify-between w-full px-2">
            {[0, 1, 2, 3, 4].map((v) => {
              const active = (store.journal[todayKey()]?.mood ?? 2) === v;
              return (
                <button
                  key={v}
                  onClick={() => setMoodToday(v)}
                  className="p-2"
                >
                  <MoodDot active={active} />
                </button>
              );
            })}
         </div>
         <p className="text-[11px] italic opacity-60">
            {currentMode === 'healing' ? "小岛正在为你抚平风浪" : "小岛正在映射你的波澜"}
         </p>
      </div>
    </div>
  );
}

function MoodDot({ active }: { active: boolean }) {
  return (
    <div 
      className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
        active ? 'bg-[#D4A373] scale-[2.5] shadow-[0_0_8px_rgba(212,163,115,0.6)]' : 'bg-[#DECEC1] scale-100 hover:scale-125'
      }`} 
    />
  );
}
