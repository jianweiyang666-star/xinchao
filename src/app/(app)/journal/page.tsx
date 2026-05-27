"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Heart, TrendingUp, Activity, X } from "lucide-react";
import { useInnertideStore, todayKey, type JournalEntry } from "@/lib/store";
import { computeCycleState, DEFAULT_PERIOD_LENGTH, formatLocalDateKey, parsePeriodStart } from "@/lib/cycle/phases";
import { FloatingIsland } from "@/components/innertide/floating-island";
import { LetterPanel } from "@/components/innertide/letter-panel";
import { motion, AnimatePresence } from "motion/react";

const MOOD_DOT_COLOR = [
  "var(--orb-luteal)",
  "var(--orb-menstrual)",
  "var(--void-text)",
  "var(--orb-follicular)",
  "var(--orb-ovulation)",
];

export default function JournalPage() {
  const { store, loaded, setJournalNote, setPainToday } = useInnertideStore();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [showPainPicker, setShowPainPicker] = useState(false);

  const monthLabel = useMemo(() => {
    return cursor.toLocaleDateString("zh-CN", { year: "numeric", month: "long" });
  }, [cursor]);

  const days = useMemo(() => buildMonthGrid(cursor), [cursor]);

  if (!loaded) return null;

  const selectedEntry: JournalEntry = store.journal[selectedDate] ?? {};
  const lastStart = parsePeriodStart(store.lastPeriodStart);
  const selectedDateObj = parsePeriodStart(selectedDate) ?? new Date();
  const cycleAtSelected = computeCycleState(lastStart, store.cycleLength, DEFAULT_PERIOD_LENGTH, selectedDateObj);

  const isToday = selectedDate === todayKey();

  function shiftMonth(delta: number) {
    setCursor((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + delta);
      return next;
    });
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#FAF6F2] pb-24 text-[#4A3E3B] font-serif overflow-x-hidden">
      {/* Header */}
      <header className="relative flex items-center justify-between px-5 pt-12 pb-3">
        <Link
          href="/today"
          className="flex items-center gap-1.5 text-xs font-medium tracking-[0.2em] uppercase opacity-70 transition hover:opacity-100 font-sans"
          aria-label="返回今日"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-serif text-[18px] font-light tracking-[0.2em] uppercase">小岛日记</h1>
        <span className="w-16" aria-hidden />
      </header>

      <main className="relative px-5 pt-4 animate-ink-rise tracking-wide">
        {/* Cycle Tracker Header */}
        <div className="mb-8 pl-1 font-sans">
          <div className="text-[10px] tracking-[0.3em] uppercase opacity-50 mb-2">CYCLE TRACKER</div>
          <h2 className="text-4xl font-light mb-3 font-serif">周期</h2>
          <p className="text-[13px] opacity-80 mt-2 font-light">每一次潮起潮落，都被你温柔记录。</p>
          
          <div className="mt-6 bg-[#FDFBF9] rounded-[24px] p-6 shadow-sm border border-white flex justify-between items-center w-full">
            {/* Cycle Length */}
            <div className="flex flex-col items-center flex-1">
              <CalendarIcon className="w-5 h-5 text-[#D4A373] mb-3 opacity-90" />
              <div className="text-[11px] text-[#8C7B77] mb-1">周期长度</div>
              <div className="text-3xl font-serif text-[#4A3E3B] mb-1 flex items-baseline gap-1">{store.cycleLength}<span className="text-sm font-sans tracking-normal opacity-80">天</span></div>
              <div className="text-[10px] text-[#8C7B77]">当前设置</div>
            </div>
            
            {/* Period Length */}
            <div className="flex flex-col items-center flex-1 border-x border-[#DECEC1]/50 px-2">
              <Heart className="w-5 h-5 text-[#D4A373] mb-3 opacity-90" />
              <div className="text-[11px] text-[#8C7B77] mb-1">经期长度</div>
              <div className="text-3xl font-serif text-[#4A3E3B] mb-1 flex items-baseline gap-1">{DEFAULT_PERIOD_LENGTH}<span className="text-sm font-sans tracking-normal opacity-80">天</span></div>
              <div className="text-[10px] text-[#8C7B77]">预测范围</div>
            </div>
            
            {/* Regularity */}
            <div className="flex flex-col items-center flex-1">
              <TrendingUp className="w-5 h-5 text-[#D4A373] mb-3 opacity-90" />
              <div className="text-[11px] text-[#8C7B77] mb-1">规律性</div>
              <div className="text-2xl font-serif text-[#4A3E3B] mb-[6px] tracking-widest pt-1">稳定</div>
              <div className="text-[10px] text-[#8C7B77]">波动≤2天</div>
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-2 py-4">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#8C7B77] transition hover:bg-[#EADCD1]/50"
            aria-label="上一个月"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-serif text-[15px] tracking-widest text-[#4A3E3B]">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#8C7B77] transition hover:bg-[#EADCD1]/50"
            aria-label="下一个月"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-3 gap-x-1 px-1 pt-4">
          {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
            <div
              key={d}
              className="text-center text-[10px] uppercase tracking-[0.2em] opacity-50 mb-2 font-sans"
            >
              {d}
            </div>
          ))}
          {days.map((day, i) => {
            if (!day) return <div key={i} aria-hidden />;
            const key = formatLocalDateKey(day);
            const entry = store.journal[key];
            const isSelected = key === selectedDate;
            const isToday = key === todayKey();
            const isFuture = day.getTime() > Date.now();

            return (
              <button
                key={key}
                type="button"
                disabled={isFuture}
                onClick={() => setSelectedDate(key)}
                className={`relative aspect-square rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-500 overflow-hidden font-sans ${
                  isSelected
                    ? "bg-[#D0C5E6] border border-white shadow-[0_4px_16px_rgba(208,197,230,0.5)]"
                    : "hover:bg-[#EADCD1]/30 border border-transparent"
                } ${isFuture ? "opacity-20 cursor-not-allowed" : ""}`}
                aria-label={`${key}${entry ? "，已记录" : ""}`}
                aria-pressed={isSelected}
              >
                {/* Active mini-island background transition */}
                <div 
                  className={`absolute inset-0 transition-opacity duration-700 ease-out ${isSelected ? "opacity-30" : "opacity-0"}`}
                  style={{
                    background: `radial-gradient(circle at 50% 60%, ${MOOD_DOT_COLOR[entry?.mood ?? 2]} 0%, transparent 60%)`
                  }}
                />

                <span
                  className={`relative z-10 text-[13px] ${
                    isToday ? "font-bold text-[#4A3E3B]" : isSelected ? "text-[#4A3E3B]" : "text-[#8C7B77]"
                  }`}
                >
                  {day.getDate()}
                </span>
                {entry?.mood !== undefined && (
                  <div className="relative z-10 mt-0.5">
                    <StatusIcon mood={entry.mood} active={isSelected} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Date Detail */}
        <section className="mt-12 animate-phase-fade">
          <div className="flex flex-col items-center">
            <p className="text-[12px] tracking-widest text-[#8C7B77] font-sans">
              {formatDateLong(selectedDateObj)}
            </p>
            <div className="mt-8 flex flex-col items-center">
               <span className="text-[10px] uppercase tracking-[0.3em] opacity-40 mb-2">
                 疗愈镜像
               </span>
               <div className="w-full max-w-[220px]">
                <FloatingIsland
                  phase={cycleAtSelected.phase}
                  mood={selectedEntry.mood}
                  mode={'healing'}
                />
               </div>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            <div className="relative group">
              <textarea
                value={selectedEntry.note ?? ""}
                onChange={(e) => setJournalNote(selectedDate, e.target.value)}
                placeholder="今天感觉很难受..."
                rows={3}
                className="w-full resize-none rounded-[24px] bg-[#FDFBF9] shadow-sm border border-white px-6 py-6 font-serif text-[15px] font-light leading-relaxed text-[#4A3E3B] placeholder:opacity-50 focus:outline-none transition-all"
              />
              <p className="mt-3 text-right text-[11px] font-sans uppercase tracking-[0.2em] opacity-40 pr-2">
                自动保存
              </p>
            </div>

            {/* Pain Recording Integration */}
            {isToday && (
              <div className="px-1 pt-2">
                <button
                  onClick={() => setShowPainPicker(true)}
                  className={`w-full flex items-center justify-between p-5 rounded-[24px] border border-white/60 shadow-sm transition-all ${
                    selectedEntry.pain ? 'bg-orb-menstrual/20 text-[#4A3E3B]' : 'bg-[#FDFBF9] text-[#8C7B77]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Activity className={`w-5 h-5 ${selectedEntry.pain ? 'text-orb-menstrual' : 'opacity-40'}`} />
                    <div className="flex flex-col items-start translate-y-[-1px]">
                      <span className="text-[13px] font-bold tracking-widest uppercase">身体疼痛记录</span>
                      {selectedEntry.pain && (
                        <span className="text-[10px] opacity-70">程度: {selectedEntry.pain.level} · {selectedEntry.pain.locations.join('、')}</span>
                      )}
                    </div>
                  </div>
                  < ChevronRight className="w-4 h-4 opacity-30" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Letter Panel */}
        <div className="mt-16 border-t border-[#DECEC1] pt-8">
          <LetterPanel />
        </div>
      </main>

      <AnimatePresence>
        {showPainPicker && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 z-[60] bg-[#FDFBF9] rounded-t-[40px] shadow-2xl p-8 border-t border-white"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[15px] font-bold uppercase tracking-widest text-[#4A3E3B]">当下疼痛程度</h3>
              <button 
                onClick={() => setShowPainPicker(false)}
                className="p-2 -mr-2 text-[#4A3E3B] opacity-30 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center justify-between mb-12 px-2">
              {[0, 1, 2, 3, 4, 5].map(v => (
                <button
                  key={v}
                  onClick={() => setPainToday(v, selectedEntry.pain?.locations ?? [])}
                  className={`group flex flex-col items-center gap-3 transition-all ${v === selectedEntry.pain?.level ? 'scale-110' : 'opacity-30'}`}
                >
                  <div className={`h-3 w-3 rounded-full transition-all ${v === (selectedEntry.pain?.level ?? -1) ? 'bg-orb-menstrual ring-8 ring-orb-menstrual/10' : 'bg-void-text/40 group-hover:scale-125'}`} />
                  <span className="text-[11px] font-bold font-sans">{v}</span>
                </button>
              ))}
            </div>

            <div className="mb-10">
              <p className="text-[11px] opacity-40 uppercase tracking-widest mb-4 font-sans px-1">疼痛位置</p>
              <div className="flex flex-wrap gap-2.5">
                {["下腹", "腰部", "胸部", "头部", "虚弱/乏力"].map(loc => {
                  const active = selectedEntry.pain?.locations.includes(loc);
                  return (
                    <button
                      key={loc}
                      onClick={() => {
                        const current = selectedEntry.pain?.locations ?? [];
                        const next = current.includes(loc) ? current.filter(p => p !== loc) : [...current, loc];
                        setPainToday(selectedEntry.pain?.level ?? 0, next);
                      }}
                      className={`px-5 py-2 rounded-full text-[12px] font-sans transition-all border ${
                        active 
                          ? 'bg-[#D4A373] border-[#D4A373] text-white shadow-md' 
                          : 'bg-[#F4ECE6] border-[#DECEC1] text-[#8C7B77] hover:border-[#D4A373]/30'
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              onClick={() => setShowPainPicker(false)}
              className="w-full bg-[#4A3E3B] text-white py-4 rounded-2xl text-[13px] font-bold tracking-widest active:scale-95 transition-all font-sans"
            >
              完成记录
            </button>
            <div className="h-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusIcon({ mood, active }: { mood: number, active: boolean }) {
  const color = MOOD_DOT_COLOR[mood];
  
  if (mood >= 3) {
    // Full Circle
    return (
      <div 
        className={`rounded-full transition-all duration-300 ${active ? 'w-2 h-2' : 'w-1.5 h-1.5'}`} 
        style={{ backgroundColor: color }} 
      />
    );
  }
  if (mood === 2) {
    // Half Circle
    return (
      <div 
        className={`rounded-full overflow-hidden transition-all duration-300 ${active ? 'w-2 h-2' : 'w-1.5 h-1.5'}`}
        style={{ background: `linear-gradient(to right, ${color} 50%, transparent 50%)`, border: `1px solid ${color}` }}
      />
    );
  }
  // Incomplete/Thin Circle
  return (
    <div 
      className={`rounded-full border transition-all duration-300 ${active ? 'w-2 h-2' : 'w-1.5 h-1.5'}`}
      style={{ borderColor: color, borderWidth: '1px' }}
    />
  );
}

function buildMonthGrid(monthStart: Date): (Date | null)[] {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatDateLong(d: Date): string {
  return d.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}
