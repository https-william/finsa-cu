'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck,
  Printer,
  Copy,
  Check,
  Buildings,
  ArrowUpRight,
} from '@phosphor-icons/react';
import { TransactionRecord, formatNaira } from '@/lib/ledger-store';
import Link from 'next/link';

interface BankNoteReceiptProps {
  transaction: TransactionRecord;
  compact?: boolean;
}

export function BankNoteReceipt({ transaction, compact = false }: BankNoteReceiptProps) {
  const [copied, setCopied] = React.useState(false);

  const verificationUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/verify/${transaction.receiptNumber || transaction.reference}`
      : `https://finsa-covenant.vercel.app/verify/${transaction.receiptNumber || transaction.reference}`;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(transaction.receiptNumber || transaction.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const formattedDate = new Date(transaction.verifiedAt || transaction.createdAt).toLocaleString(
    'en-NG',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    }
  );

  return (
    <div className="bg-black/[0.03] ring-1 ring-black/[0.07] p-2 rounded-[2rem] print-only-receipt">
      <div className="bg-white rounded-[calc(2rem-0.5rem)] shadow-[0_2px_16px_-4px_rgba(0,0,0,0.05)] border border-black/[0.06] overflow-hidden relative">
        {/* Top Institutional Emerald Band */}
        <div className="bg-[#064E3B] text-white px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Buildings size={22} weight="light" className="text-emerald-200" />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-emerald-200/90">
                Covenant University · CMSS
              </p>
              <h3 className="text-base md:text-lg font-semibold tracking-tight text-white">
                Department of Banking &amp; Finance (FINSA)
              </h3>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-300/30 text-emerald-100 text-xs font-mono">
              <ShieldCheck size={15} weight="fill" className="text-emerald-300" />
              CLEARED · TEST 1
            </span>
          </div>
        </div>

        {/* Sub-bar with Receipt No & Session */}
        <div className="bg-[#F4F5F2] px-6 py-3 border-b border-black/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#525856]">
          <div className="flex items-center gap-2">
            <span>RECEIPT NO:</span>
            <strong className="text-[#0A0D0C] font-semibold">
              {transaction.receiptNumber || 'PENDING-APPROVAL'}
            </strong>
            <button
              type="button"
              onClick={handleCopyRef}
              className="no-print inline-flex items-center gap-1 text-[#064E3B] hover:underline ml-1 cursor-pointer"
              title="Copy Receipt Number"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div>SESSION: 2026/2027 · OMEGA/ALPHA CLEARANCE</div>
        </div>

        {/* Main Receipt Body */}
        <div className={compact ? 'p-5 space-y-5' : 'p-6 md:p-8 space-y-6'}>
          {/* Student Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF9F6] p-4 rounded-2xl border border-black/[0.05]">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#525856]">
                Student Full Name
              </p>
              <p className="text-sm md:text-base font-semibold text-[#0A0D0C] mt-0.5">
                {transaction.studentName}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#525856]">
                Matriculation Number
              </p>
              <p className="text-sm md:text-base font-mono font-semibold text-[#0A0D0C] mt-0.5 font-tabular">
                {transaction.matricNumber}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#525856]">
                Level &amp; Classification
              </p>
              <p className="text-sm font-medium text-[#0A0D0C] mt-0.5">
                {transaction.level} ·{' '}
                <span
                  className={
                    transaction.roleType === 'executive'
                      ? 'text-[#064E3B] font-semibold'
                      : 'text-[#525856]'
                  }
                >
                  {transaction.roleType === 'executive'
                    ? `FINSA Executive (${transaction.executiveTitle || 'Council Member'})`
                    : 'Regular Student'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#525856]">
                Verification Timestamp
              </p>
              <p className="text-sm font-mono text-[#0A0D0C] mt-0.5 font-tabular">
                {formattedDate}
              </p>
            </div>
          </div>

          {/* Financial Line Item Table */}
          <div className="border border-black/[0.07] rounded-2xl overflow-hidden">
            <div className="bg-[#F7F7F4] px-4 py-2.5 border-b border-black/[0.06] flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#525856]">
              <span>Assessment Description</span>
              <span>Amount (NGN)</span>
            </div>
            <div className="p-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#0A0D0C]">{transaction.categoryTitle}</p>
                <p className="text-xs text-[#525856] mt-1 font-mono">
                  Gateway Ref: {transaction.reference} · Rail:{' '}
                  {transaction.paymentRail === 'paystack'
                    ? 'Paystack Verified'
                    : 'Verified Bank Transfer'}
                </p>
              </div>
              <p className="text-base md:text-lg font-mono font-bold text-[#0A0D0C] font-tabular shrink-0">
                {formatNaira(transaction.amountNaira)}
              </p>
            </div>
            <div className="bg-[#064E3B]/[0.04] px-4 py-3 border-t border-black/[0.06] flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#064E3B] font-semibold">
                Total Verified &amp; Cleared
              </span>
              <span className="text-lg md:text-xl font-mono font-bold text-[#064E3B] font-tabular">
                {formatNaira(transaction.amountNaira)}
              </span>
            </div>
          </div>

          {/* Cryptographic QR & Signature Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pt-2 border-t border-dashed border-black/15">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white rounded-xl border border-black/10 shrink-0">
                <QRCodeSVG
                  value={verificationUrl}
                  size={74}
                  bgColor="#FFFFFF"
                  fgColor="#0A0D0C"
                  level="M"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#0A0D0C]">
                  Cryptographic Exam-Hall Clearance QR
                </p>
                <p className="text-xs text-[#525856] max-w-xs leading-relaxed">
                  Scan at the Test 1 venue entrance to verify real-time clearance status against the
                  FINSA master ledger.
                </p>
                <p className="text-[11px] font-mono text-[#064E3B] break-all">
                  Token: {transaction.verificationHash}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-black/10">
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#525856]">
                Authorized By
              </p>
              <p className="text-xs font-semibold text-[#0A0D0C] mt-0.5">
                Office of the HOD &amp; FINSA Financial Secretary
              </p>
              <p className="text-[11px] text-[#525856]">Department of Banking &amp; Finance</p>
            </div>
          </div>

          {/* Action Buttons (Hidden when printing PDF) */}
          <div className="no-print pt-2 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="group inline-flex items-center gap-3 rounded-full bg-[#0A0D0C] text-white pl-5 pr-2 py-2 text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#064E3B] active:scale-[0.98] cursor-pointer"
            >
              <span>Download / Print Official PDF</span>
              <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                <Printer size={16} weight="regular" />
              </span>
            </button>

            {transaction.receiptNumber && (
              <Link
                href={`/verify/${transaction.receiptNumber}`}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#064E3B] hover:underline px-3 py-2"
              >
                <span>Open Live Clearance Badge</span>
                <ArrowUpRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
