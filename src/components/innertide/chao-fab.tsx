"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChaoChat } from "./chao-chat";
import { useInnertideStore } from "@/lib/store";
import { PERSONA_LABELS, PERSONA_SUBTITLES, type Persona } from "@/lib/companion/prompts";

const PERSONAS: Persona[] = ["bestie", "mother", "tide"];

export function ChaoFab({
  variant = "floating",
  children,
}: {
  variant?: "floating" | "inline" | "care";
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [adviceOpen, setAdviceOpen] = useState(false);
  const { store, update } = useInnertideStore();

  const openPersona = (persona: Persona) => {
    update({ persona });
    setOpen(true);
  };

  if (variant === "inline") {
    return (
      <>
        <section className="relative z-20 mt-5 rounded-[28px] bg-white/34 p-4 text-left shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[12px] font-medium tracking-[0.14em] text-[#8C7B77]">潮陪你聊</div>
              <div className="mt-1 text-[15px] font-medium text-[#221A18]">选一个现在想听见的声音</div>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D4A373]/45 bg-[#F9F3EA] font-serif text-[20px] italic text-[#4A3E3B]">
              潮
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {PERSONAS.map((persona) => {
              const active = store.persona === persona;
              return (
                <button
                  key={persona}
                  type="button"
                  onClick={() => openPersona(persona)}
                  className={`min-h-[78px] rounded-2xl px-3 py-3 text-left transition active:scale-[0.98] ${
                    active
                      ? "bg-[#221A18] text-white shadow-sm"
                      : "bg-white/72 text-[#221A18] hover:bg-[#F8EFE8]"
                  }`}
                >
                  <span className="block text-[14px] font-semibold">{PERSONA_LABELS[persona]}</span>
                  <span className={`mt-1 block text-[11px] leading-relaxed ${
                    active ? "text-white/72" : "text-[#8C7B77]"
                  }`}>
                    {PERSONA_SUBTITLES[persona]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {open && <ChaoChat onClose={() => setOpen(false)} />}
      </>
    );
  }

  if (variant === "care") {
    return (
      <>
        <section className="relative z-20 mt-6 rounded-[28px] bg-white/34 p-4 text-left shadow-sm backdrop-blur-md">
          <div className="text-[12px] font-medium tracking-[0.14em] text-[#8C7B77]">接下来，你想做什么？</div>
          <div className="mt-1 text-[15px] font-medium text-[#221A18]">查看建议，或者直接聊聊</div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAdviceOpen((value) => !value)}
              className={`min-h-[86px] rounded-2xl px-4 py-4 text-left transition active:scale-[0.98] ${
                adviceOpen
                  ? "bg-[#221A18] text-white shadow-sm"
                  : "bg-white/72 text-[#221A18] hover:bg-[#F8EFE8]"
              }`}
            >
              <span className="block text-[16px] font-semibold">每日建议</span>
              <span className={`mt-2 block text-[12px] leading-relaxed ${
                adviceOpen ? "text-white/72" : "text-[#8C7B77]"
              }`}>
                今天吃什么、怎么动、怎么安排
              </span>
            </button>

            <button
              type="button"
              onClick={() => openPersona("tide")}
              className="min-h-[86px] rounded-2xl bg-white/72 px-4 py-4 text-left text-[#221A18] transition hover:bg-[#F8EFE8] active:scale-[0.98]"
            >
              <span className="block text-[16px] font-semibold">和潮聊天</span>
              <span className="mt-2 block text-[12px] leading-relaxed text-[#8C7B77]">
                有情绪或问题，直接说
              </span>
            </button>
          </div>

          {adviceOpen && (
            <div className="mt-4 rounded-2xl bg-white/58 p-3 animate-ink-rise">
              {children}
            </div>
          )}
        </section>

        {open && <ChaoChat onClose={() => setOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-28 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full transition-transform active:scale-95 animate-phase-fade group"
        aria-label="找潮聊聊"
        style={{
          background: "#F9F3EA",
          border: "2px solid #D4A373",
          boxShadow: "0 4px 16px rgba(212,163,115,0.3)",
        }}
      >
        <span className="font-serif italic text-2xl text-[#4A3E3B] pr-0.5">潮</span>
        
        {/* Notification Dot */}
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#D4A373] rounded-full flex items-center justify-center border-2 border-[#FAF6F2]">
          <span className="h-1.5 w-1.5 bg-white rounded-full"></span>
        </span>
      </button>

      {open && <ChaoChat onClose={() => setOpen(false)} />}
    </>
  );
}
