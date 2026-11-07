'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  WarningOctagon,
  Clock,
  ArrowLeft,
  MagnifyingGlass,
  Buildings,
} from '@phosphor-icons/react';
import {
  TransactionRecord,
  findReceiptByCode,
  formatNaira,
} from '@/lib/ledger-store';
import { BankNoteReceipt } from '@/components/BankNoteReceipt';

export default function VerifyReceiptPage() {
  const params = useParams<{ receiptNo: string }>();
  const router = useRouter();
  const rawCode = decodeURIComponent(params?.receiptNo || '');

  const [queryInput, setQueryInput] = useState(rawCode);
  const [matchedTx, setMatchedTx] = useState<TransactionRecord | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (rawCode) {
      const found = findReceiptByCode(rawCode);
      setMatchedTx(found);
      setChecked(true);
    }
  }, [rawCode]);

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    router.push(`/verify/${encodeURIComponent(queryInput.trim().toUpperCase())}`);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between">
      {/* Top Bar */}
      <header className="no-print pt-5 px-4">
        <div className="max-w-4xl mx-auto h-14 px-5 rounded-full bg-white/85 backdrop-blur-2xl ring-1 ring-black/[0.07] flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#0A0D0C] hover:text-[#064E3B]"
          >
            <ArrowLeft size={15} />
            <span>Back to Student Portal</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-[#525856]">
            <Buildings size={16} className="text-[#064E3B]" />
            <span>Test 1 Exam-Hall Clearance Scanner</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 py-10 space-y-6">
        {/* Search / Scan Input Box */}
        <div className="no-print bg-black/[0.03] ring-1 ring-black/[0.07] p-2 rounded-[2rem]">
          <form
            onSubmit={handleManualVerify}
            className="bg-white rounded-[calc(2rem-0.5rem)] p-5 flex flex-col sm:flex-row items-center gap-3"
          >
            <div className="relative flex-1 w-full">
              <MagnifyingGlass
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#525856]"
              />
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value.toUpperCase())}
                placeholder="Enter Receipt No (FINSA-26-00101) or Matric Number (22AG031042)"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F7F7F4] border border-black/10 font-mono text-xs sm:text-sm text-[#0A0D0C] uppercase focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#0A0D0C] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#064E3B] transition-colors cursor-pointer shrink-0"
            >
              Verify Clearance
            </button>
          </form>
        </div>

        {/* Verification Status Banner */}
        {checked && matchedTx && matchedTx.status === 'success' && (
          <div className="space-y-6">
            <div className="no-print p-6 rounded-3xl bg-[#064E3B] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center shrink-0">
                  <ShieldCheck size={28} weight="fill" className="text-emerald-300" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-200 block">
                    Live Cryptographic Verification · Authentic
                  </span>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    CLEARED FOR TEST 1 — {matchedTx.studentName}
                  </h1>
                  <p className="text-xs font-mono text-emerald-100/90 mt-0.5">
                    Matric: {matchedTx.matricNumber} · {matchedTx.level} ·{' '}
                    {matchedTx.roleType === 'executive'
                      ? `FINSA Executive (${matchedTx.executiveTitle || 'Council'})`
                      : 'Regular Student'}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-[11px] font-mono text-emerald-200 block">VERIFIED PAID</span>
                <span className="text-2xl font-mono font-bold text-white font-tabular">
                  {formatNaira(matchedTx.amountNaira)}
                </span>
              </div>
            </div>

            <BankNoteReceipt transaction={matchedTx} />
          </div>
        )}

        {checked && matchedTx && matchedTx.status === 'pending_verification' && (
          <div className="p-6 rounded-3xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-4">
            <Clock size={28} weight="fill" className="text-[#B45309] shrink-0 mt-0.5" />
            <div>
              <h1 className="text-lg font-bold">
                PENDING BANK RECONCILIATION — NOT YET CLEARED
              </h1>
              <p className="text-xs mt-1 leading-relaxed">
                Student <strong>{matchedTx.studentName}</strong> ({matchedTx.matricNumber}) logged a
                bank transfer of <strong>{formatNaira(matchedTx.amountNaira)}</strong>, but it has
                not yet been approved by the Financial Secretary.
              </p>
              <Link
                href="/admin"
                className="inline-block mt-3 text-xs font-mono font-semibold text-[#064E3B] underline"
              >
                Approve in Admin Ledger →
              </Link>
            </div>
          </div>
        )}

        {checked && !matchedTx && (
          <div className="p-6 rounded-3xl bg-red-50 border border-red-200 text-red-950 flex items-start gap-4">
            <WarningOctagon size={28} weight="fill" className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <h1 className="text-lg font-bold">
                NO VERIFIED RECORD FOUND FOR &ldquo;{rawCode}&rdquo;
              </h1>
              <p className="text-xs mt-1 text-red-800 leading-relaxed">
                This receipt number, transaction reference, or matriculation number does not match
                any verified payment in the FINSA master ledger.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="no-print py-6 px-4 text-center text-xs text-[#525856] font-mono">
        Covenant University Department of Banking &amp; Finance · Cryptographic Receipt Verification
      </footer>
    </div>
  );
}
