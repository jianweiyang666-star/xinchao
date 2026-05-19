"use client";

import { useState } from "react";
import { ChaoChat } from "./chao-chat";
import { useInnertideStore, todayKey } from "@/lib/store";

export function ChaoFab() {
  const [open, setOpen] = useState(false);
  const { store } = useInnertideStore();
  const todayMood = store.journal[todayKey()]?.mood;
  const struggling = todayMood !== undefined && todayMood <= 1;

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
