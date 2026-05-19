"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import type { CyclePhase } from "@/lib/cycle/phases";

const PHASE_BGM: Record<CyclePhase, { src: string; label: string }> = {
  menstrual: { src: "/audio/menstrual.mp3", label: "冬日背景音" },
  follicular: { src: "/audio/follicular.mp3", label: "春日背景音" },
  ovulatory: { src: "/audio/ovulatory.mp3", label: "夏日背景音" },
  luteal: { src: "/audio/luteal.mp3", label: "秋日背景音" },
};

const DEFAULT_VOLUME = 0.28;

interface BgmToggleProps {
  phase: CyclePhase;
}

export function BgmToggle({ phase }: BgmToggleProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [showVolume, setShowVolume] = useState(false);
  const track = PHASE_BGM[phase];

  useEffect(() => {
    try {
      const stored = localStorage.getItem("innertide-bgm-volume");
      if (stored) {
        const parsed = Number(stored);
        if (Number.isFinite(parsed)) {
          setVolume(Math.min(1, Math.max(0, parsed)));
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    try {
      localStorage.setItem("innertide-bgm-volume", String(volume));
    } catch {}
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setHasError(false);
    audio.pause();
    audio.load();

    if (enabled) {
      void audio.play().catch(() => {
        setEnabled(false);
      });
    }
  }, [enabled, track.src]);

  useEffect(() => {
    if (!showVolume) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setShowVolume(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showVolume]);

  const toggleBgm = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (enabled) {
      audio.pause();
      setEnabled(false);
      setShowVolume(false);
      return;
    }

    setHasError(false);
    void audio.play()
      .then(() => {
        setEnabled(true);
        setShowVolume(true);
      })
      .catch(() => {
        setEnabled(false);
        setShowVolume(false);
        setHasError(true);
      });
  };

  return (
    <div ref={containerRef} className="absolute right-5 top-[5.6rem] z-40 flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {enabled && showVolume && (
          <label className="flex h-10 items-center gap-2 rounded-full border border-white/50 bg-white/30 px-3 shadow-sm backdrop-blur-xl">
            <span className="sr-only">背景音音量</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => {
                setVolume(Number(event.target.value));
                setShowVolume(true);
              }}
              className="h-1 w-20 accent-[#D4A373]"
              aria-label="背景音音量"
            />
            <span className="w-7 text-right text-[10px] tabular-nums text-[#4A3E3B]/55">
              {Math.round(volume * 100)}
            </span>
          </label>
        )}
        <button
          type="button"
          onClick={() => {
            if (enabled && showVolume) {
              toggleBgm();
            } else if (enabled) {
              setShowVolume(true);
            } else {
              toggleBgm();
            }
          }}
          className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/30 text-[#4A3E3B] shadow-sm backdrop-blur-xl transition-all duration-300 hover:bg-white/50 active:scale-95 ${
            enabled ? "shadow-[0_0_18px_rgba(212,163,115,0.28)]" : "opacity-70"
          }`}
          aria-pressed={enabled}
          aria-label={enabled ? "关闭背景音" : `开启${track.label}`}
          title={enabled ? "关闭背景音" : `开启${track.label}`}
        >
          {enabled && volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      </div>
      {hasError && (
        <span className="max-w-[9rem] rounded-full bg-white/45 px-2 py-1 text-right text-[10px] leading-snug text-[#4A3E3B]/55 backdrop-blur-md">
          等你放入音乐文件
        </span>
      )}
      <audio
        ref={audioRef}
        src={track.src}
        loop
        preload="metadata"
        onError={() => {
          setHasError(true);
          setEnabled(false);
        }}
      />
    </div>
  );
}
