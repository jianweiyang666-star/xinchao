"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import { useInnertideStore } from "@/lib/store";
import { detectCrisis, CRISIS_RESOURCE } from "@/lib/data/safety-keywords";
import {
  PERSONA_LABELS,
  PERSONA_SUBTITLES,
  PERSONA_GREETINGS,
  QUICK_ACTIONS,
  buildSystemInstruction,
  type Persona
} from "@/lib/companion/prompts";
import { buildUserMemoryContext } from "@/lib/companion/memory";
import { computeCycleState } from "@/lib/cycle/phases";

interface Recommendation {
  title: string;
  reason: string;
  tags: string[];
}

interface Msg {
  role: "user" | "assistant";
  content: string;
  appendix?: string;
  recommendations?: Recommendation[];
}

const PERSONAS: Persona[] = ["bestie", "mother", "tide"];

export function ChaoChat({ onClose }: { onClose: () => void }) {
  const { store, update } = useInnertideStore();
  const persona = store.persona;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [placeholder, setPlaceholder] = useState("当下感受如何？");
  const [activeQuickActions, setActiveQuickActions] = useState<string[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholder(p => p === "当下感受如何？" ? "痛苦如何影响你的生活？" : "当下感受如何？");
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // When persona changes, reset conversation and set initial greetings
  useEffect(() => {
    const opener = PERSONA_GREETINGS[persona];
    setMsgs([{ role: "assistant", content: opener }]);
    setActiveQuickActions(QUICK_ACTIONS[persona]);
    setPulse(true);
    setTimeout(() => setPulse(false), 2000);
  }, [persona]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [msgs, loading, activeQuickActions]);

  async function handleSend(textOverride?: string) {
    const text = textOverride || input.trim();
    if (!text || loading) return;
    
    setInput("");
    setActiveQuickActions([]); // clear quick actions while loading
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setLoading(true);

    const isCrisis = detectCrisis(text);
    if (isCrisis) {
      setMsgs([...next, { role: "assistant", content: "我在听着呢，请一定要保护好自己。", appendix: CRISIS_RESOURCE }]);
      setLoading(false);
      setPulse(true);
      setTimeout(() => setPulse(false), 2000);
      return;
    }

    try {
      // Build context for AI
      const lastPeriodStart = store.lastPeriodStart ? new Date(store.lastPeriodStart) : null;
      const cycleState = computeCycleState(lastPeriodStart, store.cycleLength);
      const phaseNames = { menstrual: "月经期", follicular: "卵泡期", ovulatory: "排卵期", luteal: "黄体期" };
      const memory = buildUserMemoryContext(store);
      const systemInstruction = buildSystemInstruction(persona, {
        phase: phaseNames[cycleState.phase],
        mood: undefined, // Could map today's mood if needed
        prefs: [
          ...store.dietPreferences.allergies,
          ...store.dietPreferences.religion,
          ...store.dietPreferences.healthGoals,
          ...store.dietPreferences.avoid,
          store.dietPreferences.dietMode
        ].filter(Boolean).join(", "),
        memory
      });

      // Prepare messages for Gemini API
      // We map 'assistant' to 'model' for the Gemini API
      const apiMessages = next.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          systemInstruction
        })
      });

      if (!res.ok) {
        throw new Error("Failed to fetch from API");
      }

      const data = await res.json();
      
      // Update UI with AI response
      const aiReply: Msg = {
        role: "assistant",
        content: data.reply || "（暂时没有想好说什么...）",
        recommendations: data.recommendations
      };
      
      if (data.follow_up_question) {
        aiReply.content += "\n\n" + data.follow_up_question;
      }

      setMsgs([...next, aiReply]);
      
      if (data.quick_actions && Array.isArray(data.quick_actions)) {
        setActiveQuickActions(data.quick_actions);
      }

      // Update local store silently if AI detected recordable events
      if (data.record) {
        const today = new Date().toISOString().split("T")[0];
        // Merge AI-detected symptoms/mood into today's journal
        // In a real app, you'd map this carefully to the store structure.
        console.log("AI suggested recording:", data.record);
      }

    } catch (err) {
      console.error(err);
      setMsgs([...next, { role: "assistant", content: "抱歉，我现在有点走神，没听清你说什么。（网络请求失败）" }]);
    } finally {
      setLoading(false);
      setPulse(true);
      setTimeout(() => setPulse(false), 2000);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: "linear-gradient(180deg, rgba(208, 197, 230, 0.95) 0%, rgba(238, 216, 213, 0.95) 50%, rgba(253, 240, 204, 0.95) 100%)",
        backdropFilter: "blur(20px)",
      }}
      role="dialog"
      aria-label="与潮对话"
    >
      {/* 顶栏 + 明确的人格切换 */}
      <header className="flex flex-col px-5 pt-12 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="grid flex-1 grid-cols-3 gap-2 rounded-[22px] bg-white/18 p-1.5 backdrop-blur-md">
            {PERSONAS.map((p) => {
              const active = p === persona;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => update({ persona: p })}
                  className={`rounded-2xl px-2 py-2.5 text-left transition active:scale-[0.98] ${
                    active
                      ? "bg-void-text text-white shadow-sm"
                      : "text-void-text/68 hover:bg-white/22"
                  }`}
                  aria-pressed={active}
                >
                  <span className="block text-[13px] font-semibold leading-none">{PERSONA_LABELS[p]}</span>
                  <span className={`mt-1.5 block text-[10px] leading-snug ${
                    active ? "text-white/72" : "text-void-text/48"
                  }`}>
                    {PERSONA_SUBTITLES[p]}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-void-text opacity-50 transition hover:opacity-100"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* 中央呼吸光圆 */}
      <div className="flex justify-center pt-6 pb-2">
        <div
          className="relative h-16 w-16 rounded-full transition-all duration-700 blur-[1px]"
          style={{
            background: "radial-gradient(circle at 35% 30%, #fff 0%, rgba(226, 192, 216, 0.6) 50%, transparent 100%)",
            boxShadow: pulse ? "0 0 40px 12px rgba(255,184,153,0.5)" : "0 0 16px 2px rgba(255,184,153,0.3)",
            transform: pulse ? "scale(1.15)" : "scale(1)",
          }}
        >
          <div className="absolute inset-3 rounded-full bg-white/40 animate-breathe blur-[2px]" />
        </div>
      </div>

      {/* 消息列表 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-md space-y-6">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} animate-ink-rise`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3 text-[14px] leading-relaxed ${
                  m.role === "user"
                    ? "glass text-void-text font-medium"
                    : "text-void-text opacity-90 font-serif text-[15px] bg-transparent whitespace-pre-wrap"
                }`}
              >
                {m.content}
                {m.appendix && (
                  <div className="mt-3 border-t border-void-faint/30 pt-2 text-xs leading-relaxed text-void-text/70">
                    {m.appendix}
                  </div>
                )}
              </div>
              
              {/* Render Recommendation Cards if any */}
              {m.recommendations && m.recommendations.length > 0 && (
                <div className="mt-2 flex w-[85%] flex-col gap-2 pl-2">
                  {m.recommendations.map((rec, rIdx) => (
                    <div key={rIdx} className="glass rounded-xl p-3 border border-void-faint/10 relative overflow-hidden">
                      <div className="absolute right-0 top-0 h-full w-1 bg-orb-ovulation/30" />
                      <h4 className="font-bold text-void-text text-sm mb-1">{rec.title}</h4>
                      <p className="text-xs text-void-text/70 mb-2">{rec.reason}</p>
                      <div className="flex flex-wrap gap-1">
                        {rec.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="text-[10px] bg-void-faint/20 text-void-text/80 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start animate-ink-rise">
              <div className="max-w-[85%] rounded-2xl bg-white/18 px-5 py-3 text-void-text/70 backdrop-blur-sm">
                <div className="mb-2 text-[12px] font-serif">我在慢慢听你说</div>
                <div className="flex gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-void-text/50 animate-breathe" />
                  <span className="h-1.5 w-1.5 rounded-full bg-void-text/50 animate-breathe" style={{ animationDelay: "0.3s" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-void-text/50 animate-breathe" style={{ animationDelay: "0.6s" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 快捷选项 & 输入区 */}
      <div className="px-4 pb-8 pt-2 flex flex-col gap-3">
        {/* Quick Actions */}
        {activeQuickActions.length > 0 && !loading && (
          <div className="mx-auto flex w-full max-w-md flex-wrap gap-2 px-2 animate-ink-rise">
            {activeQuickActions.map((qa, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qa)}
                className="rounded-full border border-void-faint/30 bg-white/20 px-3 py-1.5 text-xs text-void-text/80 backdrop-blur-sm transition-colors hover:bg-white/40"
              >
                {qa}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="mx-auto flex w-full max-w-md items-end gap-3 rounded-full glass px-5 py-2.5 focus-within:border-orb-ovulation/50 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none bg-transparent text-[14px] text-void-text font-medium placeholder:text-void-text/40 focus:outline-none py-1 transition-all"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-void-text/20 text-void-text transition disabled:opacity-30 hover:bg-void-text/40"
            aria-label="发送"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
