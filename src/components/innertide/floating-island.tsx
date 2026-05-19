"use client";

import React from "react";
import type { CyclePhase } from "@/lib/cycle/phases";

export interface IslandVibe {
  phase: CyclePhase;
  mood?: number;
  mode?: 'healing' | 'resonance';
}

export function FloatingIsland({ phase, mood, mode = 'healing' }: IslandVibe) {
  return (
    <div
      className="relative w-full max-w-[400px] mx-auto aspect-square flex items-center justify-center -mt-8"
      style={{
        animation: "island-float 12s ease-in-out infinite",
      }}
    >
      <BeautifulMenstrualIsland mood={mood} phase={phase} mode={mode} />
    </div>
  );
}

function phasePalette(phase: CyclePhase, mood?: number) {
  const dim = mood !== undefined && mood <= 1;

  if (phase === "menstrual") {
    return {
      core: "var(--orb-menstrual)",
      glow: dim ? "rgba(176,68,35,0.2)" : "rgba(176,68,35,0.4)",
      satellite: "var(--orb-menstrual)"
    };
  }
  if (phase === "follicular") {
    return {
      core: "var(--orb-follicular)",
      glow: "rgba(223,138,96,0.3)",
      satellite: "var(--orb-follicular)"
    };
  }
  if (phase === "ovulatory") {
    return {
      core: "var(--orb-ovulation)",
      glow: "rgba(247,224,206,0.3)",
      satellite: "var(--orb-ovulation)"
    };
  }
  return {
    core: "var(--orb-luteal)",
    glow: dim ? "rgba(89,32,17,0.3)" : "rgba(89,32,17,0.5)",
    satellite: "var(--orb-follicular)"
  };
}

function phaseVisualTheme(phase: CyclePhase, isLow: boolean) {
  const themes = {
    menstrual: {
      light: { inner: "#FFE066", mid: "#FF9800", outer: "#FF9800" },
      rock: ["#C8A8C8", "#A88AB3", "#87689A", "#5E4E80"],
      rockDark: ["#9E7EA8", "#7E5D8F", "#594676"],
      rockLight: ["#D5BAD5", "#B393C1", "#725B91"],
      surface: ["#F9A8A8", "#FFC8A3", "#C4738F"],
      highlight: ["#FFE7B9", "#FFB380"],
      tree1: ["#FFD8B3", "#FF9E8B", "#D36B8C"],
      tree2: ["#FFF2C8", "#FFB46A", "#E2736C"],
      bush: ["#D29AC2", "#B07CA4", "#7D578D"],
      bushGlow: "#DFADDB",
      house: { wall: "#FFCBA4", roof: "#FFA582", side: "#EDA491", trim: "#D67D71", window: "#FFF8D6" },
      particle: "#FFE066",
      mistOpacity: 0.5,
      auraOpacity: 0.45,
      dropShadow: "drop-shadow-[0_20px_40px_rgba(150,110,130,0.4)]",
    },
    follicular: {
      light: { inner: "#FFF0B8", mid: "#FFD7A8", outer: "#DCE9C8" },
      rock: ["#D7B9D6", "#BA98C8", "#9277AF", "#6B5A8E"],
      rockDark: ["#B493BE", "#85679D", "#67517F"],
      rockLight: ["#E1C7DE", "#C8A8D0", "#8B73A8"],
      surface: ["#FFD3B6", "#FFE6B8", "#D8E8BC"],
      highlight: ["#FFF3D8", "#FFD7A8"],
      tree1: ["#FFE7C4", "#FFC5B5", "#CFE5B6"],
      tree2: ["#FFF6C8", "#FFC7D8", "#BFD9A8"],
      bush: ["#DCC0D9", "#C7A4C2", "#AFCB9B"],
      bushGlow: "#DCE9C8",
      house: { wall: "#FFD6B8", roof: "#F4A6A6", side: "#F0B7A1", trim: "#D89083", window: "#FFF0B8" },
      particle: "#FFF0B8",
      mistOpacity: 0.36,
      auraOpacity: 0.38,
      dropShadow: "drop-shadow-[0_20px_40px_rgba(150,130,150,0.32)]",
    },
    ovulatory: {
      light: { inner: "#FFF4A8", mid: "#FFE18A", outer: "#FF8EB8" },
      rock: ["#D0B9DB", "#B79AD0", "#8B72B2", "#655087"],
      rockDark: ["#A98CC1", "#7C639C", "#594774"],
      rockLight: ["#E3C9E4", "#C8A9D8", "#8068A5"],
      surface: ["#FFB7C8", "#FFE18A", "#FFB48D"],
      highlight: ["#FFF8D7", "#FFE18A"],
      tree1: ["#FFD6E6", "#FF8EB8", "#D978A8"],
      tree2: ["#FFF1A6", "#FFB46A", "#FF8EB8"],
      bush: ["#D9A6CE", "#B988C1", "#8F6BAB"],
      bushGlow: "#FFE18A",
      house: { wall: "#FFD0AF", roof: "#FF9DB5", side: "#F0A693", trim: "#D77A85", window: "#FFF8C9" },
      particle: "#FFF4A8",
      mistOpacity: 0.28,
      auraOpacity: isLow ? 0.34 : 0.56,
      dropShadow: "drop-shadow-[0_22px_46px_rgba(190,130,160,0.42)]",
    },
    luteal: {
      light: { inner: "#FFE0A3", mid: "#D4A373", outer: "#B77A8D" },
      rock: ["#C8A0B8", "#A87F9B", "#80628D", "#5D4B78"],
      rockDark: ["#98728D", "#755574", "#4F405F"],
      rockLight: ["#D5B0C0", "#B78BA7", "#725C86"],
      surface: ["#E6A58C", "#D4A373", "#B77A8D"],
      highlight: ["#FFE5B8", "#D4A373"],
      tree1: ["#F3C28E", "#D99178", "#B77A8D"],
      tree2: ["#FFE0A3", "#D4A373", "#C98F7A"],
      bush: ["#C49AA7", "#A97891", "#80617F"],
      bushGlow: "#E3BE86",
      house: { wall: "#E8B08F", roof: "#C97878", side: "#C98F7A", trim: "#A96368", window: "#FFE0A3" },
      particle: "#FFE0A3",
      mistOpacity: isLow ? 0.56 : 0.44,
      auraOpacity: 0.42,
      dropShadow: "drop-shadow-[0_22px_44px_rgba(120,85,105,0.42)]",
    },
  };

  return themes[phase];
}

function IslandCharacter({ mood, phase = "menstrual" }: { mood?: number; phase?: CyclePhase }) {
  const m = mood ?? ({ menstrual: 1, follicular: 3, ovulatory: 4, luteal: 2 }[phase] ?? 2);
  const color = "#FF4D94"; // Bright pink for the silhouette to match the user's reference

  if (m === 0) {
    // Hidden inside / Curled up ball
    return (
      <g transform="translate(160, 210) scale(0.6)">
        <path d="M12 20C12 20 8 18 8 14C8 10 12 8 16 8C20 8 24 10 24 14C24 18 20 20 20 20L12 20Z" fill={color}/>
        <circle cx="16" cy="14" r="5" fill={color}/>
      </g>
    );
  }

  const TransformWrapper = ({ children, translate }: { children: React.ReactNode, translate: string }) => (
    <g transform={`translate(${translate}) scale(0.8)`} opacity="0.95">
      {children}
    </g>
  );

  if (m === 4) { // Active/Jumping/Stretching arms wide
    return (
      <TransformWrapper translate="115, 185">
        {/* Silhouette for active pose */}
        <path d="M15 10C15 10 18 10 22 8C25 6 28 8 28 8C28 8 24 12 20 12C18 12 16 11 15 11L15 18C15 18 17 22 22 25C25 27 25 29 25 29C25 29 22 28 18 25C15 22 14 18 14 18L13 18C13 18 12 22 9 25C5 28 2 29 2 29C2 29 2 27 5 25C10 22 12 18 12 18L12 11C11 11 9 12 7 12C3 12 -1 8 -1 8C-1 8 2 6 5 8C9 10 12 10 12 10Z" fill={color}/>
        <circle cx="13.5" cy="5" r="3.5" fill={color}/>
      </TransformWrapper>
    );
  }

  if (m === 3) { // Stretching/Yoga pose
    return (
      <TransformWrapper translate="125, 190">
        <path d="M13 14C13 14 15 12 18 10C22 8 25 10 25 10C25 10 21 13 18 15C16 16 14 15 13 15L13 22C13 22 15 26 18 29C20 31 18 32 18 32C18 32 15 29 13 26C11 23 11 22 11 22L11 22C11 22 9 26 5 28C2 30 1 29 1 29C1 29 3 27 6 25C9 22 10 20 10 20L10 15C9 15 7 16 5 15C3 14 1 12 1 12C1 12 3 11 5 12C8 13 11 14 11 14Z" fill={color}/>
        <circle cx="12" cy="7" r="3" fill={color}/>
      </TransformWrapper>
    );
  }

  if (m === 1) { // Sitting/Kneeling
    return (
      <TransformWrapper translate="165, 202">
        <path d="M10 16C10 16 15 16 17 18C19 20 20 22 20 22C20 22 17 21 15 20C13 19 11 18 11 18L11 24C11 24 13 26 15 26C17 26 17 27 17 27C17 27 14 28 11 26C8 24 8 22 8 22L8 16Z" fill={color}/>
        <circle cx="10" cy="12" r="3.5" fill={color}/>
      </TransformWrapper>
    );
  }

  // Default (2) - Standing/Relaxed
  return (
    <TransformWrapper translate="145, 200">
      <path d="M10 12C10 12 12 12 14 14C16 16 16 18 16 18C16 18 14 16 12 15C11 14 10 14 10 14L10 22C10 22 12 25 14 27C15 28 14 30 14 30C14 30 12 28 10 26C8 24 8 22 8 22L8 22C8 22 7 25 5 27C3 29 2 28 2 28C2 28 4 26 6 24C8 22 8 20 8 20L8 14C8 14 7 15 5 15C3 15 2 13 2 13C2 13 4 13 6 13C8 13 10 12 10 12Z" fill={color}/>
      <circle cx="9" cy="8" r="3" fill={color}/>
    </TransformWrapper>
  );
}

function BeautifulMenstrualIsland({ mood, phase, mode }: { mood?: number, phase?: CyclePhase, mode: 'healing' | 'resonance' }) {
  const activePhase = phase ?? "menstrual";
  const isLow = mood !== undefined && mood <= 1;
  const isTurbulent = mode === 'resonance' && isLow;
  const isSerene = mode === 'healing' && isLow;
  const theme = phaseVisualTheme(activePhase, isLow);

  return (
    <svg 
      viewBox="0 0 400 400" 
      className={`w-[120%] h-[120%] ${theme.dropShadow} pointer-events-none overflow-visible transition-all duration-1000 ${
        isTurbulent ? "brightness-90 contrast-125 saturate-150" : isSerene ? "brightness-110 contrast-75 saturate-50" : ""
      }`}
    >
      <defs>
        <radialGradient id="houseLight" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={theme.light.inner} stopOpacity={isLow ? 0.7 : 1} />
          <stop offset="40%" stopColor={theme.light.mid} stopOpacity={isLow ? 0.4 : 0.8} />
          <stop offset="100%" stopColor={theme.light.outer} stopOpacity="0" />
        </radialGradient>

        <linearGradient id="rockMain" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={theme.rock[0]} />
          <stop offset="30%" stopColor={theme.rock[1]} />
          <stop offset="70%" stopColor={theme.rock[2]} />
          <stop offset="100%" stopColor={theme.rock[3]} />
        </linearGradient>

        <linearGradient id="rockDark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={theme.rockDark[0]} />
          <stop offset="50%" stopColor={theme.rockDark[1]} />
          <stop offset="100%" stopColor={theme.rockDark[2]} />
        </linearGradient>

        <linearGradient id="rockLight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={theme.rockLight[0]} />
          <stop offset="50%" stopColor={theme.rockLight[1]} />
          <stop offset="100%" stopColor={theme.rockLight[2]} />
        </linearGradient>

        <linearGradient id="surfaceBase" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={theme.surface[0]} />
          <stop offset="50%" stopColor={theme.surface[1]} />
          <stop offset="100%" stopColor={theme.surface[2]} />
        </linearGradient>

        <radialGradient id="surfaceHighlight" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor={theme.highlight[0]} stopOpacity="0.95" />
          <stop offset="40%" stopColor={theme.highlight[1]} stopOpacity="0.6" />
          <stop offset="100%" stopColor={theme.highlight[1]} stopOpacity="0" />
        </radialGradient>

        <linearGradient id="tree1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={theme.tree1[0]} />
          <stop offset="50%" stopColor={theme.tree1[1]} />
          <stop offset="100%" stopColor={theme.tree1[2]} />
        </linearGradient>
        
        <linearGradient id="tree2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={theme.tree2[0]} />
          <stop offset="50%" stopColor={theme.tree2[1]} />
          <stop offset="100%" stopColor={theme.tree2[2]} />
        </linearGradient>

        <linearGradient id="bushMain" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={theme.bush[0]} />
          <stop offset="50%" stopColor={theme.bush[1]} />
          <stop offset="100%" stopColor={theme.bush[2]} />
        </linearGradient>
        
        <radialGradient id="bushHighlight" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor={theme.bushGlow} stopOpacity="0.6"/>
          <stop offset="100%" stopColor={theme.bushGlow} stopOpacity="0"/>
        </radialGradient>

        <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F6FAFF" />
          <stop offset="100%" stopColor="#BBDDF5" />
        </linearGradient>
        
        <linearGradient id="cloudPink" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF4FA" />
          <stop offset="100%" stopColor="#E9C2DB" />
        </linearGradient>

        <filter id="svgGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="svgSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="svgSuperGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="25" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* BACKGROUND EFFECTS */}
      <circle cx="200" cy="180" r="160" fill="url(#houseLight)" filter="url(#svgSuperGlow)" opacity={theme.auraOpacity} />

      {/* BACKGROUND CLOUDS */}
      <g opacity="0.8">
        <path d="M 160 80 Q 170 50 200 50 Q 230 50 240 80 Q 260 85 260 100 Q 260 115 240 115 L 150 115 Q 130 115 130 95 Q 130 85 145 80 Z" fill="url(#cloudGrad)" />
        <path d="M 165 85 Q 175 60 200 60 Q 225 60 235 85 Q 250 88 250 100 Q 250 110 235 110 L 155 110 Q 140 110 140 95 Q 140 88 150 85 Z" fill="url(#cloudPink)" opacity="0.6" />
        <path d="M 280 130 Q 290 110 310 110 Q 330 110 335 130 Q 355 135 355 150 Q 355 160 340 160 L 270 160 Q 255 160 255 145 Q 255 135 265 130 Z" fill="url(#cloudGrad)" opacity="0.7"/>
        <path d="M 60 140 Q 80 135 100 140 L 100 142 L 60 142 Z" fill="#FFF" opacity="0.6" filter="url(#svgSoftGlow)"/>
        <path d="M 280 145 L 360 145" stroke="#FFF" strokeWidth="2" strokeLinecap="round" opacity="0.4" filter="url(#svgSoftGlow)"/>
      </g>

      {/* FLOATING ROCK BASE (STALACTITES) */}
      <g transform="translate(0, 15)">
        {/* Back dark layer */}
        <path d="M 60 210 Q 90 290 140 330 Q 190 380 230 330 Q 280 280 340 210 Z" fill="url(#rockDark)" />
        <path d="M 110 230 Q 140 330 150 350 Q 180 340 200 280 Z" fill="url(#rockDark)" opacity="0.8"/>
        
        {/* Mid main layer */}
        <path d="M 40 210 C 60 250 80 300 110 320 C 130 300 140 350 160 360 C 180 370 200 390 220 350 C 230 320 250 340 270 300 C 280 280 320 250 360 210 Z" fill="url(#rockMain)" />
        
        {/* Front light layer highlights */}
        <path d="M 80 210 C 100 240 110 270 125 300 C 135 270 145 230 150 210 Z" fill="url(#rockLight)" opacity="0.7" />
        <path d="M 140 210 C 150 260 160 280 170 310 C 185 270 200 240 210 210 Z" fill="url(#rockLight)" opacity="0.6" />
        <path d="M 220 210 C 230 250 235 280 250 300 C 265 260 280 240 290 210 Z" fill="url(#rockLight)" opacity="0.5" />
        <path d="M 175 210 C 185 260 195 280 210 330 C 220 290 225 240 235 210 Z" fill="url(#rockMain)" opacity="0.9" />

        <path d="M 50 210 Q 70 240 85 250 Q 95 230 100 210 Z" fill="url(#rockDark)" />
        <path d="M 310 210 Q 290 250 270 270 Q 260 230 250 210 Z" fill="url(#rockDark)" />
      </g>

      {/* EDGE BUSHES & FLORA (Background) */}
      <g>
        <circle cx="90" cy="215" r="25" fill="url(#bushMain)" />
        <circle cx="120" cy="205" r="30" fill="url(#bushMain)" />
        <circle cx="160" cy="200" r="25" fill="url(#bushMain)" />
        <circle cx="280" cy="210" r="35" fill="url(#bushMain)" />
        <circle cx="320" cy="215" r="25" fill="url(#bushMain)" />
      </g>

      {/* SURFACE LAND */}
      <ellipse cx="200" cy="205" rx="160" ry="45" fill="url(#surfaceBase)" />
      <ellipse cx="200" cy="205" rx="140" ry="35" fill="url(#surfaceHighlight)" />
      <PhaseSurfaceDetails phase={activePhase} />
      
      {/* SURFACE SHADOWS */}
      <ellipse cx="140" cy="215" rx="40" ry="15" fill="#BF6882" opacity="0.3" filter="url(#svgSoftGlow)" />
      <ellipse cx="270" cy="215" rx="50" ry="20" fill="#BF6882" opacity="0.3" filter="url(#svgSoftGlow)" />

      {/* TREES */}
      <g id="trees">
        {/* Left Tree */}
        <path d="M 135 190 Q 140 160 135 140" stroke="#FFEAE0" strokeWidth="2" fill="none" opacity="0.7"/>
        <path d="M 135 160 Q 125 145 120 140" stroke="#FFEAE0" strokeWidth="1.5" fill="none" opacity="0.7"/>
        <circle cx="130" cy="130" r="25" fill="url(#tree1)" filter="url(#svgSoftGlow)"/>
        <circle cx="145" cy="125" r="20" fill="url(#tree1)" />
        <circle cx="115" cy="140" r="15" fill="url(#tree1)" />

        {/* Right Big Tree */}
        <path d="M 260 190 Q 255 140 250 110" stroke="#FFF5E5" strokeWidth="3" fill="none" opacity="0.8"/>
        <path d="M 255 150 Q 270 130 275 120" stroke="#FFF5E5" strokeWidth="2" fill="none" opacity="0.8"/>
        <path d="M 253 130 Q 240 110 230 100" stroke="#FFF5E5" strokeWidth="1.5" fill="none" opacity="0.8"/>
        
        <circle cx="250" cy="100" r="35" fill="url(#tree2)" filter="url(#svgGlow)"/>
        <circle cx="275" cy="110" r="25" fill="url(#tree2)" filter="url(#svgSoftGlow)"/>
        <circle cx="225" cy="115" r="20" fill="url(#tree2)" />
        <circle cx="250" cy="80" r="20" fill="url(#tree2)" />
        <circle cx="250" cy="100" r="25" fill="#FFF" opacity="0.25" filter="url(#svgGlow)"/>

        {/* Small Far Right Tree */}
        <path d="M 295 195 Q 295 175 295 165" stroke="#FFEAE0" strokeWidth="1.5" fill="none" opacity="0.5"/>
        <circle cx="295" cy="160" r="18" fill="url(#tree1)" />
      </g>
      <PhaseTreeDetails phase={activePhase} />

      {/* HOUSE */}
      <g id="house">
        {/* Main Body */}
        <rect x="180" y="140" width="55" height="50" fill={theme.house.wall} />
        <polygon points="180,140 207.5,100 235,140" fill={theme.house.roof} />
        <polygon points="180,140 207.5,100 170,110" fill={theme.house.trim} opacity="0.5" />

        {/* Side Extension Left */}
        <rect x="145" y="155" width="35" height="35" fill={theme.house.side} />
        <polygon points="140,155 162.5,135 180,155" fill={theme.house.trim} />
        <polygon points="130,165 145,155 180,155 180,165" fill={theme.house.trim} opacity="0.6"/>

        {/* Entry / Door */}
        <rect x="160" y="170" width="12" height="20" fill="#FFD180" filter="url(#svgGlow)" />
        <rect x="160" y="170" width="12" height="20" fill="#FFE5A3" />

        {/* Main Windows (Glowing) */}
        <rect x="190" y="150" width="14" height="22" fill="#FFE066" filter="url(#svgGlow)" />
        <rect x="190" y="150" width="14" height="22" fill={theme.house.window} />
        <line x1="197" y1="150" x2="197" y2="172" stroke="#CC7A50" strokeWidth="1.5" />
        <line x1="190" y1="161" x2="204" y2="161" stroke="#CC7A50" strokeWidth="1.5" />

        <rect x="212" y="150" width="14" height="22" fill="#FFE066" filter="url(#svgGlow)" />
        <rect x="212" y="150" width="14" height="22" fill={theme.house.window} />
        <line x1="219" y1="150" x2="219" y2="172" stroke="#CC7A50" strokeWidth="1.5" />
        <line x1="212" y1="161" x2="226" y2="161" stroke="#CC7A50" strokeWidth="1.5" />

        <circle cx="207.5" cy="125" r="5" fill="#FFE066" filter="url(#svgGlow)" />
        <circle cx="207.5" cy="125" r="3" fill="#FFF" />
      </g>

      {/* CHARACTER SILHOUETTE */}
      <IslandCharacter mood={mood} phase={activePhase} />

      {/* EDGE BUSHES (Foreground) */}
      <g>
        <circle cx="70" cy="220" r="30" fill="url(#bushMain)" />
        <circle cx="70" cy="220" r="30" fill="url(#bushHighlight)" />
        
        <circle cx="100" cy="235" r="35" fill="url(#bushMain)" />
        <circle cx="100" cy="235" r="35" fill="url(#bushHighlight)" />
        
        <circle cx="140" cy="245" r="30" fill="url(#bushMain)" />
        <circle cx="180" cy="250" r="35" fill="url(#bushMain)" />
        <circle cx="180" cy="250" r="35" fill="url(#bushHighlight)" />
        
        <circle cx="220" cy="245" r="25" fill="url(#bushMain)" />
        
        <circle cx="260" cy="235" r="35" fill="url(#bushMain)" />
        <circle cx="260" cy="235" r="35" fill="url(#bushHighlight)" />
        
        <circle cx="300" cy="225" r="30" fill="url(#bushMain)" />
        <circle cx="330" cy="215" r="25" fill="url(#bushMain)" />
      </g>

      {/* FOREGROUND CLOUD / MIST */}
      <g filter="url(#svgSoftGlow)" opacity={theme.mistOpacity}>
        <path d="M 80 260 Q 150 260 200 280 Q 300 270 340 240" stroke="url(#cloudGrad)" strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.6"/>
        <path d="M 120 270 Q 200 250 280 280" stroke="url(#cloudPink)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.4"/>
      </g>

      {/* FLOATING MAGIC PARTICLES */}
      <g fill={theme.particle} filter="url(#svgSoftGlow)">
        <circle cx="120" cy="300" r="2">
          <animate attributeName="cy" values="300; 150" dur="8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0; 1; 0" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="180" cy="350" r="3">
          <animate attributeName="cy" values="350; 200" dur="10s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0; 0.8; 0" dur="10s" repeatCount="indefinite" />
        </circle>
        <circle cx="280" cy="320" r="1.5">
          <animate attributeName="cy" values="320; 180" dur="7s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0; 0.9; 0" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="220" cy="280" r="2.5">
          <animate attributeName="cy" values="280; 120" dur="9s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0; 1; 0" dur="9s" repeatCount="indefinite" />
        </circle>
        <circle cx="70" cy="240" r="2">
          <animate attributeName="cy" values="240; 100" dur="11s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0; 0.7; 0" dur="11s" repeatCount="indefinite" />
        </circle>
        <circle cx="320" cy="260" r="2">
          <animate attributeName="cy" values="260; 140" dur="8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0; 0.8; 0" dur="8s" repeatCount="indefinite" />
        </circle>
      </g>
      <PhaseAirDetails phase={activePhase} />
    </svg>
  );
}

function PhaseSurfaceDetails({ phase }: { phase: CyclePhase }) {
  if (phase === "follicular") {
    return (
      <g opacity="0.75" filter="url(#svgSoftGlow)">
        <path d="M 115 206 Q 130 194 145 205" stroke="#CFE5B6" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M 238 202 Q 258 192 277 205" stroke="#DCE9C8" strokeWidth="4" strokeLinecap="round" fill="none" />
        <ellipse cx="122" cy="198" rx="7" ry="3" fill="#CFE5B6" transform="rotate(-25 122 198)" />
        <ellipse cx="270" cy="197" rx="8" ry="3" fill="#DCE9C8" transform="rotate(18 270 197)" />
      </g>
    );
  }

  if (phase === "ovulatory") {
    return (
      <g opacity="0.72" filter="url(#svgGlow)">
        <circle cx="150" cy="200" r="4" fill="#FFF4A8" />
        <circle cx="258" cy="199" r="5" fill="#FF8EB8" />
        <path d="M 175 199 Q 200 188 228 200" stroke="#FFE18A" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>
    );
  }

  if (phase === "luteal") {
    return (
      <g opacity="0.68" filter="url(#svgSoftGlow)">
        <ellipse cx="124" cy="205" rx="9" ry="4" fill="#D4A373" transform="rotate(-18 124 205)" />
        <ellipse cx="280" cy="211" rx="8" ry="4" fill="#C98F7A" transform="rotate(24 280 211)" />
        <path d="M 195 205 Q 211 213 228 205" stroke="#B77A8D" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>
    );
  }

  return null;
}

function PhaseTreeDetails({ phase }: { phase: CyclePhase }) {
  if (phase === "follicular") {
    return (
      <g filter="url(#svgSoftGlow)">
        {[
          [118, 118], [148, 105], [276, 84], [226, 96], [302, 145],
        ].map(([cx, cy]) => (
          <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="6" ry="3" fill="#DCE9C8" transform={`rotate(-25 ${cx} ${cy})`} opacity="0.9" />
        ))}
        <circle cx="136" cy="112" r="3" fill="#FFF0B8" />
        <circle cx="255" cy="72" r="3" fill="#FFC7D8" />
      </g>
    );
  }

  if (phase === "ovulatory") {
    return (
      <g filter="url(#svgGlow)" opacity="0.9">
        {[
          [130, 126, "#FF8EB8"], [145, 118, "#FFF4A8"], [250, 92, "#FF8EB8"],
          [273, 104, "#FFE18A"], [228, 111, "#FFD6E6"], [252, 78, "#FFF4A8"],
        ].map(([cx, cy, fill]) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx as number} cy={cy as number} r="4" fill={fill as string} />
            <circle cx={(cx as number) + 5} cy={(cy as number) + 2} r="3" fill={fill as string} opacity="0.8" />
            <circle cx={(cx as number) - 4} cy={(cy as number) + 3} r="3" fill={fill as string} opacity="0.8" />
          </g>
        ))}
      </g>
    );
  }

  if (phase === "luteal") {
    return (
      <g filter="url(#svgSoftGlow)" opacity="0.82">
        {[
          [121, 142, "#D4A373", -28], [152, 132, "#C98F7A", 18], [260, 118, "#D4A373", -12],
          [280, 128, "#B77A8D", 24], [296, 166, "#E3BE86", 36],
        ].map(([cx, cy, fill, rotate]) => (
          <ellipse key={`${cx}-${cy}`} cx={cx as number} cy={cy as number} rx="7" ry="4" fill={fill as string} transform={`rotate(${rotate} ${cx} ${cy})`} />
        ))}
      </g>
    );
  }

  return null;
}

function PhaseAirDetails({ phase }: { phase: CyclePhase }) {
  if (phase === "follicular") {
    return (
      <g fill="#DCE9C8" filter="url(#svgSoftGlow)" opacity="0.85">
        <circle cx="96" cy="230" r="1.8">
          <animate attributeName="cy" values="230;120" dur="7s" repeatCount="indefinite" />
          <animate attributeName="cx" values="96;106;92" dur="7s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.9;0" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="308" cy="250" r="1.6" fill="#FFC7D8">
          <animate attributeName="cy" values="250;135" dur="8s" repeatCount="indefinite" />
          <animate attributeName="cx" values="308;296;316" dur="8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.8;0" dur="8s" repeatCount="indefinite" />
        </circle>
      </g>
    );
  }

  if (phase === "ovulatory") {
    return (
      <g filter="url(#svgGlow)" opacity="0.9">
        <path d="M 105 170 Q 113 162 121 170 Q 113 178 105 170" fill="#FF8EB8">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M 302 198 Q 312 188 322 198 Q 312 208 302 198" fill="#FFF4A8">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="4s" repeatCount="indefinite" />
        </path>
      </g>
    );
  }

  if (phase === "luteal") {
    return (
      <g filter="url(#svgSoftGlow)" opacity="0.75">
        <ellipse cx="86" cy="150" rx="8" ry="4" fill="#D4A373" transform="rotate(-25 86 150)">
          <animate attributeName="cy" values="120;175;120" dur="9s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.8;0" dur="9s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="318" cy="135" rx="7" ry="4" fill="#C98F7A" transform="rotate(22 318 135)">
          <animate attributeName="cy" values="110;168;110" dur="10s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.7;0" dur="10s" repeatCount="indefinite" />
        </ellipse>
      </g>
    );
  }

  return null;
}
