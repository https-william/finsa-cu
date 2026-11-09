'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck,
  Printer,
  Copy,
  Check,
  SealCheck,
  ArrowUpRight,
  Sparkle,
} from '@phosphor-icons/react';
import { TransactionRecord, formatNaira } from '@/lib/ledger-store';
import Link from 'next/link';

interface BankNoteReceiptProps {
  transaction: TransactionRecord;
  compact?: boolean;
}

function formatDeterministicTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const mins = String(d.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} · ${hours}:${mins} GMT`;
}

export function BankNoteReceipt({ transaction, compact = false }: BankNoteReceiptProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('https://finsa-covenant.vercel.app');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const verificationUrl = `${origin}/verify/${transaction.receiptNumber || transaction.reference}`;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(transaction.receiptNumber || transaction.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const formattedDate = formatDeterministicTimestamp(
    transaction.verifiedAt || transaction.createdAt
  );

  return (
    <div className="w-full max-w-xl mx-auto print-only-receipt">
      {/* Credential Outer Shell — Single Refined Enclosure */}
      <div className="relative rounded-3xl bg-white border border-black/[0.08] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] overflow-hidden transition-all">
        {/* Subtle Decorative Security Guilloche Micro-Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#064E3B] via-[#10B981] to-[#064E3B]" />

        {/* Credential Header */}
        <div className="px-7 pt-7 pb-5 border-b border-black/[0.06] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#525856]">
                Covenant University · CMSS
              </p>
            </div>
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-[#0A0D0C]">
              Department of Banking &amp; Finance
            </h2>
            <p className="text-xs text-[#525856]">
              Official Financial Clearance Certificate · FINSA
            </p>
          </div>

          <div className="shrink-0 text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#064E3B]/[0.08] border border-[#064E3B]/20 text-[#064E3B] text-[11px] font-mono font-medium">
              <SealCheck size={14} weight="fill" />
              VERIFIED
            </span>
          </div>
        </div>

        {/* Credential Body */}
        <div className="p-7 space-y-6">
          {/* Student Profile Card (Embossed look) */}
          <div className="p-5 rounded-2xl bg-[#FBFBFA] border border-black/[0.05] space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#717875] block">
                Student Name
              </span>
              <p className="text-base md:text-lg font-bold text-[#0A0D0C] mt-0.5 tracking-tight">
                {transaction.studentName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-black/[0.05]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#717875] block">
                  Matric Number
                </span>
                <p className="text-sm font-mono font-semibold text-[#0A0D0C] mt-0.5 font-tabular">
                  {transaction.matricNumber}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#717875] block">
                  Classification
                </span>
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
                      ? `Executive (${transaction.executiveTitle || 'Council'})`
                      : 'Regular'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Dues Assessment Ledger Row */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#064E3B]/[0.03] border border-[#064E3B]/15">
            <div>
              <p className="text-xs font-semibold text-[#0A0D0C]">
                {transaction.categoryTitle}
              </p>
              <p className="text-[11px] font-mono text-[#525856] mt-0.5">
                Receipt No: <strong className="text-[#0A0D0C]">{transaction.receiptNumber || 'PENDING'}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-[#064E3B] block uppercase tracking-wider">
                Amount Cleared
              </span>
              <span className="text-xl font-mono font-bold text-[#064E3B] font-tabular">
                {formatNaira(transaction.amountNaira)}
              </span>
            </div>
          </div>

          {/* Verification QR & Metadata Footer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pt-2">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white rounded-xl border border-black/10 shrink-0 shadow-xs">
                <QRCodeSVG
                  value={verificationUrl}
                  size={76}
                  bgColor="#FFFFFF"
                  fgColor="#0A0D0C"
                  level="M"
                />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[#0A0D0C] flex items-center gap-1.5">
                  <ShieldCheck size={15} weight="fill" className="text-[#064E3B]" />
                  Cryptographic Verification
                </span>
                <p className="text-[11px] text-[#525856] max-w-[220px] leading-relaxed">
                  Scan at any departmental clearance checkpoint to verify authenticity.
                </p>
                <p className="text-[10px] font-mono text-[#717875] pt-1">
                  Issued: {formattedDate}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-black/[0.06]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#717875] block">
                Authorized By
              </span>
              <p className="text-xs font-semibold text-[#0A0D0C] mt-0.5">
                Office of the HOD &amp; Exco
              </p>
              <p className="text-[10px] text-[#525856]">
                Department of Banking &amp; Finance
              </p>
            </div>
          </div>

          {/* Actions Strip (Hidden when printing) */}
          <div className="no-print pt-3 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-2 rounded-full bg-[#0A0D0C] text-white px-5 py-2.5 text-xs font-medium transition-transform duration-150 active:scale-[0.97] hover:bg-[#064E3B] cursor-pointer"
            >
              <Printer size={15} weight="regular" />
              <span>Download / Print Credential</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyRef}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#F5F5F3] hover:bg-black/[0.06] text-xs font-mono text-[#0A0D0C] transition-colors cursor-pointer"
                title="Copy Receipt Number"
              >
                {copied ? <Check size={13} className="text-[#064E3B]" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : transaction.receiptNumber || 'Copy No.'}</span>
              </button>

              {transaction.receiptNumber && (
                <Link
                  href={`/verify/${transaction.receiptNumber}`}
                  className="inline-flex items-center gap-1 text-xs font-mono text-[#064E3B] hover:underline px-2 py-1"
                >
                  <span>Verify</span>
                  <ArrowUpRight size={13} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
