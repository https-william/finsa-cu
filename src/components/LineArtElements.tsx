'use client';

import React from 'react';
import { AcademicLevel } from '@/lib/ledger-store';

/**
 * High-precision Guilloché and financial curve SVG line art.
 * Replaces generic grids with elegant, currency-grade mathematical lines.
 */
export function FinancialGuillocheArt({
  className = 'w-full h-24 text-blue-600/30',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 800 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="finGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.05" />
          <stop offset="30%" stopColor="currentColor" stopOpacity="0.75" />
          <stop offset="70%" stopColor="currentColor" stopOpacity="0.75" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* Wave Harmonic 1 */}
      <path
        d="M-50,60 C120,10 260,110 400,60 C540,10 680,110 850,60"
        stroke="url(#finGrad)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Wave Harmonic 2 */}
      <path
        d="M-50,55 C110,15 270,105 400,55 C530,15 690,105 850,55"
        stroke="url(#finGrad)"
        strokeWidth="0.9"
        strokeDasharray="4 4"
      />
      {/* Wave Harmonic 3 */}
      <path
        d="M-50,65 C130,5 250,115 400,65 C550,5 670,115 850,65"
        stroke="url(#finGrad)"
        strokeWidth="0.75"
        strokeOpacity="0.6"
      />
      {/* Wave Harmonic 4 */}
      <path
        d="M-50,50 C100,20 280,100 400,50 C520,20 700,100 850,50"
        stroke="url(#finGrad)"
        strokeWidth="0.6"
        strokeOpacity="0.4"
      />
      {/* Wave Harmonic 5 */}
      <path
        d="M-50,70 C140,0 240,120 400,70 C560,0 660,120 850,70"
        stroke="url(#finGrad)"
        strokeWidth="0.5"
        strokeOpacity="0.3"
      />
      {/* Horizontal Datum Ray */}
      <line
        x1="0"
        y1="60"
        x2="800"
        y2="60"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeOpacity="0.15"
        strokeDasharray="8 6"
      />
    </svg>
  );
}

/**
 * Covenant University & FINSA Institutional Crest Line Art.
 */
export function CovenantLaurelShieldArt({
  className = 'w-12 h-12 text-zinc-900',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer Shield Outline */}
      <path
        d="M50 10 L82 22 V50 C82 70 68 86 50 92 C32 86 18 70 18 50 V22 L50 10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Inner Concentric Shield */}
      <path
        d="M50 17 L76 27 V49 C76 66 64 80 50 85 C36 80 24 66 24 49 V27 L50 17Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.6"
      />
      {/* Central Laurel & Star Motif */}
      <circle cx="50" cy="46" r="16" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />
      {/* Four-Point Academic Star */}
      <path
        d="M50 36 L52.5 43.5 L60 46 L52.5 48.5 L50 56 L47.5 48.5 L40 46 L47.5 43.5 Z"
        fill="currentColor"
      />
      {/* Baseline Balance Bar */}
      <line x1="34" y1="64" x2="66" y2="64" stroke="currentColor" strokeWidth="1.5" />
      <line x1="38" y1="68" x2="62" y2="68" stroke="currentColor" strokeWidth="1" strokeOpacity="0.7" />
    </svg>
  );
}

/**
 * Level Specific SVG Vector Line Art Badge
 */
export function LevelAestheticBadge({
  level,
  className = 'w-8 h-8',
}: {
  level: AcademicLevel;
  className?: string;
}) {
  if (level === '100L') {
    return (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
        <path d="M16 6 L20 16 L16 26 L12 16 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
        <circle cx="16" cy="16" r="2" fill="currentColor" />
        <path d="M6 16 H26" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.5" />
      </svg>
    );
  }

  if (level === '200L') {
    return (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect x="4" y="4" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
        <path d="M8 22 L13 16 L18 19 L24 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="10" r="2" fill="currentColor" />
        <line x1="8" y1="24" x2="24" y2="24" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
      </svg>
    );
  }

  if (level === '300L') {
    return (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
        <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />
        <circle cx="16" cy="16" r="3.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 3 V7 M16 25 V29 M3 16 H7 M25 16 H29" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
      </svg>
    );
  }

  // 400L / Postgrad (Capstone)
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <polygon
        points="16,3 28,9 28,21 16,29 4,21 4,9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.3"
      />
      <polygon
        points="16,7 24,12 24,20 16,25 8,20 8,12"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <circle cx="16" cy="16" r="3" fill="currentColor" />
    </svg>
  );
}

/**
 * Animated Ambient Energy Glow Background.
 * Pure Apple luminous warmth without ANY grid lines.
 */
export function AppleLuminousAura() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10 select-none">
      {/* Top right primary university cobalt glow */}
      <div
        className="absolute -top-32 right-1/4 w-[480px] h-[360px] rounded-full opacity-35 blur-[120px]"
        style={{
          background: 'radial-gradient(circle, rgba(37,99,235,0.22) 0%, rgba(59,130,246,0.06) 60%, transparent 100%)',
        }}
      />
      {/* Left side fresh emerald tint */}
      <div
        className="absolute top-96 -left-20 w-[420px] h-[420px] rounded-full opacity-30 blur-[130px]"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(5,150,105,0.04) 60%, transparent 100%)',
        }}
      />
      {/* Center subtle warm stone aura */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full opacity-20 blur-[160px]"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(244,244,245,0) 70%)',
        }}
      />
    </div>
  );
}
