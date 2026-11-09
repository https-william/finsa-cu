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
    <div className="min-h-[100dvh] flex flex-col justify-between bg-[#FAFAFC] text-[#0A0D0C]">
      {/* Top Bar */}
      <header className="no-print pt-4 px-4">
        <div className="max-w-xl mx-auto h-14 px-5 rounded-full bg-white/80 backdrop-blur-xl border border-black/[0.06] flex items-center justify-between shadow-xs">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#525856] hover:text-[#0A0D0C] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Student Portal</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#717875]">
            <Buildings size={15} className="text-[#064E3B]" />
            <span>Clearance Verification</span>
          </div>
        </div>
      </header>

      <main className="max-w-xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Search Input Box */}
        <div className="no-print">
          <form
            onSubmit={handleManualVerify}
            className="rounded-2xl bg-white border border-black/[0.08] p-2 flex items-center gap-2 shadow-xs"
          >
            <div className="relative flex-1">
              <MagnifyingGlass
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#717875]"
              />
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value.toUpperCase())}
                placeholder="Receipt No (e.g. FINSA-26-00101) or Matric No"
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-transparent font-mono text-xs sm:text-sm text-[#0A0D0C] uppercase focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#0A0D0C] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#064E3B] transition-transform duration-150 active:scale-[0.97] cursor-pointer"
            >
              Verify
            </button>
          </form>
        </div>

        {/* Verification Status Banner */}
        {checked && matchedTx && matchedTx.status === 'success' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="no-print p-5 rounded-2xl bg-[#064E3B] text-white flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-400/20 flex items-center justify-center shrink-0">
                  <ShieldCheck size={24} weight="fill" className="text-emerald-300" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-200 block">
                    Authentic Credential
                  </span>
                  <h1 className="text-base sm:text-lg font-bold tracking-tight">
                    FINANCIALLY CLEARED
                  </h1>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-emerald-200 block">VERIFIED</span>
                <span className="text-lg font-mono font-bold text-white font-tabular">
                  {formatNaira(matchedTx.amountNaira)}
                </span>
              </div>
            </div>

            <BankNoteReceipt transaction={matchedTx} />
          </div>
        )}

        {checked && matchedTx && matchedTx.status === 'pending_verification' && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
            <Clock size={22} weight="fill" className="text-[#B45309] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h1 className="text-sm font-bold">
                Transfer Pending Reconciliation
              </h1>
              <p className="text-xs text-[#525856] leading-relaxed">
                Payment claim of <strong>{formatNaira(matchedTx.amountNaira)}</strong> for {matchedTx.studentName} ({matchedTx.matricNumber}) is awaiting Financial Secretary approval.
              </p>
              <Link
                href="/admin"
                className="inline-block pt-1 text-xs font-mono font-medium text-[#064E3B] underline"
              >
                Open Admin Ledger →
              </Link>
            </div>
          </div>
        )}

        {checked && !matchedTx && (
          <div className="p-5 rounded-2xl bg-red-50/80 border border-red-200 text-red-950 flex items-start gap-3">
            <WarningOctagon size={22} weight="fill" className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <h1 className="text-sm font-bold">
                No Record Found for &ldquo;{rawCode}&rdquo;
              </h1>
              <p className="text-xs text-[#525856] mt-0.5 leading-relaxed">
                This receipt number or matriculation number does not match any verified record on the departmental master ledger.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="no-print py-5 px-4 text-center text-xs text-[#717875] font-mono">
        Department of Banking &amp; Finance · Covenant University
      </footer>
    </div>
  );
}
