"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, Sparkles, Loader2 } from "lucide-react";
import { useInnertideStore, type LetterRecord, todayKey } from "@/lib/store";
import { computeCycleState, parsePeriodStart } from "@/lib/cycle/phases";

type Scope = LetterRecord["scope"];

const SCOPE_OPTIONS: { value: Scope; label: string; days: number }[] = [
  { value: "week", label: "近一周", days: 7 },
  { value: "fortnight", label: "近半个月", days: 15 },
  { value: "month", label: "近一个月", days: 30 },
];

function daysAgoKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return todayKey(d);
}

export function LetterPanel() {
  const { store, saveLetter } = useInnertideStore();
  const [generating, setGenerating] = useState<Scope | null>(null);
  const [latestPreview, setLatestPreview] = useState<LetterRecord | null>(null);
  const autoTriggered = useRef(false);

  const lettersDesc = (Object.values(store.letters) as LetterRecord[]).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  useEffect(() => {
    if (autoTriggered.current) return;
    if (!store.lastPeriodStart) return;

    const last = parsePeriodStart(store.lastPeriodStart);
    if (!last) return;
    const cycle = computeCycleState(last);
    const justEnded = cycle.cycleDay === cycle.periodLength + 1 || cycle.cycleDay === cycle.periodLength + 2;
    if (!justEnded) return;

    const cycleStartKey = todayKey(last);
    const alreadyHas = lettersDesc.some((l) => l.scope === "cycle-end" && l.rangeStart === cycleStartKey);
    if (alreadyHas) return;

    autoTriggered.current = true;
    void generate("cycle-end", 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.lastPeriodStart]);

  async function generate(scope: Scope, days: number) {
    setGenerating(scope);
    setLatestPreview(null);
    try {
      const rangeEnd = todayKey();
      const rangeStart = daysAgoKey(days);
      const entries = Object.entries(store.journal as Record<string, import('@/lib/store').JournalEntry>)
        .filter(([d]) => d >= rangeStart && d <= rangeEnd)
        .map(([date, e]) => ({ date, mood: e.mood, note: e.note, mode: e.mode }));

      // Mock generation delay
      await new Promise(r => setTimeout(r, 2000));
      
      const moodCounts = entries.reduce((acc, e) => {
        if (e.mood !== undefined) acc[e.mood] = (acc[e.mood] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const resonanceCount = entries.filter(e => e.mode === 'resonance').length;
      const healingCount = entries.filter(e => e.mode === 'healing').length;

      let analysis = "";
      if (resonanceCount > healingCount) {
        analysis = "在这段时间里，你更多时候选择了“共振”。这是一种勇敢，你在直面内心的汹涌，哪怕波浪有些刺痛。小岛上的惊涛骇浪，其实是你情绪的延伸，你允许它们存在，这是自愈的第一步。";
      } else {
        analysis = "最近你倾向于寻找“疗愈”。这是对自己的温柔守护。当外界或身体让你感到虚弱时，你为自己构建了一个风平浪静的避风港。在小岛的宁静中，你正在悄悄积蓄力量。";
      }

      const record: LetterRecord = {
        createdAt: new Date().toISOString(),
        scope,
        rangeStart,
        rangeEnd,
        body: `这是一封潮给你写的回望信。\n\n${analysis}\n\n回看你的日记，那些细碎的文字记录了你身体的涨落。其实，你不需要总是那么平衡。心理学里说，沙盘是内心的投射，小岛就是你的沙盘。\n\n无论你的岛屿今天是礁石嶙峋还是细沙柔软，我都想告诉你：被记录的苦难就不再是无意义的消耗，而是生命纹理的一部分。\n\n继续在岛上，慢慢走。`,
        source: "fallback",
      };
      saveLetter(record);
      setLatestPreview(record);
    } catch (err) {
      console.error("[v0] letter generation failed", err);
    } finally {
      setGenerating(null);
    }
  }

  // Generate stagger effects for paragraphs in the body
  const renderBody = (text: string) => {
    return text.split('\n\n').map((paragraph, idx) => (
      <p 
        key={idx} 
        className="whitespace-pre-line text-sm italic font-light opacity-90 font-serif leading-relaxed text-pretty mb-4 animate-ink-rise"
        style={{ animationDelay: `${0.4 * idx + 0.6}s`, opacity: 0 }}
      >
        {paragraph}
      </p>
    ));
  };

  return (
    <section className="w-full">
      <header className="mb-6 flex flex-col gap-1 items-center">
        <Mail className="h-4 w-4 text-[#D4A373] mb-1" strokeWidth={1.5} />
        <h2 className="text-[15px] font-medium tracking-[0.05em] text-[#4A3E3B] font-serif">
          心潮寄给你的一封信
        </h2>
        <p className="text-[10px] text-[#8C7B77] opacity-60 tracking-[0.2em] uppercase">过去一段时间的洞察</p>
      </header>

      {/* Button group with theme styling */}
      <div className="grid grid-cols-3 gap-3">
        {SCOPE_OPTIONS.map((opt) => {
          const isLoading = generating === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => generate(opt.value, opt.days)}
              disabled={generating !== null}
              className="group flex flex-col items-center gap-1.5 rounded-2xl border border-[#DECEC1] bg-[#FDFBF9] px-2 py-4 text-center transition-all hover:bg-white hover:shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#8C7B77]" />
              ) : (
                <Sparkles
                  className="h-4 w-4 text-[#D4A373] transition-colors group-hover:scale-110"
                  strokeWidth={1.5}
                />
              )}
              <span className="font-serif text-[14px] text-[#4A3E3B] tracking-widest">{opt.label}</span>
              <span className="text-[10px] text-[#8C7B77] scale-90">
                {isLoading ? "潮在写信" : "请潮写信"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Preview with unseal paper grain effect */}
      {latestPreview && (
        <article className="mt-8 relative overflow-hidden rounded-[24px] bg-[#FDFBF9] border border-white shadow-sm p-6 animate-letter-unseal text-[#4A3E3B]">
          <div className="relative z-10">
             <div className="mb-6 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] opacity-60 font-sans">
               <span>{labelForScope(latestPreview.scope)}</span>
               <span>{latestPreview.rangeStart} — {latestPreview.rangeEnd}</span>
             </div>
             {renderBody(latestPreview.body)}
          </div>
        </article>
      )}

      {/* History */}
      {!latestPreview && lettersDesc.length > 0 && (
        <details className="mt-8 group">
          <summary className="cursor-pointer list-none text-[12px] tracking-[0.2em] uppercase opacity-70 hover:opacity-100 transition-colors font-sans">
            过往的信（{lettersDesc.length}）
          </summary>
          <ul className="mt-4 space-y-4">
            {lettersDesc.slice(0, 5).map((l) => (
              <li
                key={l.createdAt}
                className="relative rounded-[24px] bg-[#FDFBF9] border border-white px-5 py-4 overflow-hidden"
              >
                <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] opacity-60 font-sans">
                  <span>{labelForScope(l.scope)}</span>
                  <span>{l.rangeStart.slice(5)} — {l.rangeEnd.slice(5)}</span>
                </div>
                <p className="whitespace-pre-line font-serif text-[13px] leading-6 opacity-90 text-pretty line-clamp-3">
                  {l.body}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function labelForScope(scope: Scope): string {
  switch (scope) {
    case "week": return "近一周";
    case "fortnight": return "近半个月";
    case "month": return "近一个月";
    case "cycle-end": return "本次月经的回望";
  }
}
