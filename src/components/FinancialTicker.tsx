'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendUp,
  TrendDown,
  Newspaper,
  ArrowUpRight,
  Broadcast,
  CaretRight,
  Sparkle,
} from '@phosphor-icons/react';

export interface MarketTickerItem {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
  category: 'bank' | 'fx' | 'rate' | 'fintech' | 'commodity';
}

export interface FinancialNewsItem {
  id: string;
  source: string;
  time: string;
  headline: string;
  summary: string;
  tag: string;
}

const DEFAULT_TICKER_ITEMS: MarketTickerItem[] = [
  { symbol: 'NGX:BNK', name: 'NGX Banking Index', price: '942.30', change: '+1.45%', isPositive: true, category: 'bank' },
  { symbol: 'GTCO', name: 'Guaranty Trust Holding Co.', price: '₦53.20', change: '+2.10%', isPositive: true, category: 'bank' },
  { symbol: 'ZENITHBANK', name: 'Zenith Bank Plc', price: '₦41.75', change: '+0.85%', isPositive: true, category: 'bank' },
  { symbol: 'ACCESSCORP', name: 'Access Holdings Plc', price: '₦23.20', change: '+1.30%', isPositive: true, category: 'bank' },
  { symbol: 'UBA', name: 'United Bank for Africa', price: '₦31.85', change: '+3.40%', isPositive: true, category: 'bank' },
  { symbol: 'USD/NGN', name: 'NAFEM Official FX', price: '₦1,482.00', change: '-0.40%', isPositive: false, category: 'fx' },
  { symbol: 'CBN MPR', name: 'Monetary Policy Rate', price: '27.25%', change: 'Benchmark', isPositive: true, category: 'rate' },
  { symbol: 'NG-FINTECH', name: 'Nigeria FinTech Index', price: '1,842.10', change: '+2.65%', isPositive: true, category: 'fintech' },
  { symbol: 'NT-BILL 364D', name: 'Treasury Yield', price: '21.50%', change: '+0.25%', isPositive: true, category: 'rate' },
  { symbol: 'BRENT', name: 'Brent Crude Oil', price: '$74.80/bbl', change: '+0.55%', isPositive: true, category: 'commodity' },
];

const CURATED_FINANCIAL_NEWS: FinancialNewsItem[] = [
  {
    id: 'news-1',
    source: 'CBN Official Bulletin',
    time: '2 hrs ago',
    headline: 'Banking Sector Recapitalization: CBN Verifies Tier-1 Capital Adequacy Benchmarks',
    summary: 'Central Bank of Nigeria issues updated compliance frameworks for international commercial banking authorization ahead of 2026 deadlines.',
    tag: 'Monetary Policy',
  },
  {
    id: 'news-2',
    source: 'FinTech Association of Nigeria',
    time: '4 hrs ago',
    headline: 'Instant Payment Volumes Surge: Electronic Transactions Cross ₦600T Milestone',
    summary: 'NIBSS real-time transaction processing records unprecedented growth driven by API-first digital banking and open-banking rails.',
    tag: 'FinTech & Payments',
  },
  {
    id: 'news-3',
    source: 'NGX Market Intelligence',
    time: '6 hrs ago',
    headline: 'Banking Equities Lead Stock Exchange Rally as Foreign Portfolio Inflows Rebound',
    summary: 'The NGX Banking Index gains 1.45% anchored by institutional accumulation across GTCO, Zenith, and UBA following audited dividend declarations.',
    tag: 'Capital Markets',
  },
  {
    id: 'news-4',
    source: 'CIBN Academic Advisory',
    time: 'Yesterday',
    headline: 'Chartered Institute of Bankers (CIBN) Endorses Algorithmic & FinTech Syllabi',
    summary: 'Accreditation guidelines for university Banking & Finance departments now integrate decentralized finance, automated settlement, and risk analytics.',
    tag: 'Curriculum & Industry',
  },
];

export function FinancialTicker() {
  const [isPaused, setIsPaused] = useState(false);
  const [showNewsDrawer, setShowNewsDrawer] = useState(false);
  const [selectedNews, setSelectedNews] = useState<FinancialNewsItem | null>(null);

  return (
    <aside aria-label="Financial Market Ticker" className="w-full border-b border-black/[0.08] bg-zinc-950 text-white text-xs select-none relative z-20">
      <div className="flex items-center justify-between">
        {/* Ticker Lead Tag */}
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border-r border-white/10 shrink-0 z-10 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[10px] tracking-wider uppercase font-semibold text-zinc-300 hidden sm:inline">
            MARKET PULSE
          </span>
          <span className="font-mono text-[10px] tracking-wider uppercase font-semibold text-zinc-300 sm:hidden">
            NGX
          </span>
        </div>

        {/* Scrolling Marquee Stream */}
        <div
          className="overflow-hidden whitespace-nowrap flex-1 py-1.5 cursor-pointer relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <div
            className={`inline-flex items-center gap-6 text-[11px] font-mono tracking-tight ${
              isPaused ? '' : 'animate-ticker'
            }`}
            style={{
              willChange: 'transform',
              WebkitTransform: 'translate3d(0, 0, 0)',
            }}
          >
            {/* Repeat items twice for seamless loop */}
            {[...DEFAULT_TICKER_ITEMS, ...DEFAULT_TICKER_ITEMS].map((item, idx) => (
              <div
                key={`${item.symbol}-${idx}`}
                className="inline-flex items-center gap-1.5 py-0.5 px-1 rounded hover:bg-white/5 transition-colors"
              >
                <span className="font-bold text-white">{item.symbol}</span>
                <span className="text-zinc-400 font-tabular">{item.price}</span>
                <span
                  className={`inline-flex items-center text-[10px] font-semibold ${
                    item.isPositive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {item.isPositive ? (
                    <TrendUp size={11} weight="bold" className="mr-0.5" />
                  ) : (
                    <TrendDown size={11} weight="bold" className="mr-0.5" />
                  )}
                  {item.change}
                </span>
                <span className="text-white/20 text-[9px] mx-1">/</span>
              </div>
            ))}
          </div>
        </div>

        {/* News Trigger Button */}
        <button
          type="button"
          onClick={() => setShowNewsDrawer(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-l border-white/10 shrink-0 text-[11px] font-medium transition-colors cursor-pointer group"
          title="Open Departmental Financial News"
        >
          <Newspaper size={13} className="text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline">Financial Intelligence</span>
          <span className="md:hidden">News</span>
        </button>
      </div>

      {/* Financial Intelligence News Modal */}
      {showNewsDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white text-zinc-900 rounded-2xl border border-black/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <Broadcast size={16} weight="bold" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-zinc-950">
                    FINSA Financial Intelligence &amp; Market Stream
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Department of Banking &amp; Finance · Covenant University
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNewsDrawer(false);
                  setSelectedNews(null);
                }}
                className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 flex items-center justify-center font-mono text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* News List */}
            <div className="p-5 overflow-y-auto divide-y divide-zinc-100 space-y-4">
              {CURATED_FINANCIAL_NEWS.map((n) => (
                <div
                  key={n.id}
                  onClick={() => setSelectedNews(n)}
                  className="pt-4 first:pt-0 cursor-pointer group hover:bg-zinc-50/70 p-2.5 rounded-xl transition-all"
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mb-1">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-sans font-medium">
                      {n.tag}
                    </span>
                    <span>{n.source} · {n.time}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {n.headline}
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed line-clamp-2">
                    {n.summary}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer with Telegram Link */}
            <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
              <span className="text-[11px]">CIBN &amp; FinTech Research Stream</span>
              <a
                href="https://t.me/finsacu"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800"
              >
                <span>Join FINSA Telegram</span>
                <ArrowUpRight size={12} />
              </a>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
