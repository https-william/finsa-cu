'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer,
  Copy,
  Check,
  CheckCircle,
  ArrowUpRight,
} from '@phosphor-icons/react';
import { TransactionRecord, formatNaira } from '@/lib/ledger-store';
import Link from 'next/link';

interface BankNoteReceiptProps {
  transaction: TransactionRecord;
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

export function BankNoteReceipt({ transaction }: BankNoteReceiptProps) {
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
      {/* Precision Document Enclosure */}
      <div className="rounded-xl bg-white border border-zinc-200 shadow-xs overflow-hidden">
        {/* Certificate Header */}
        <div className="p-6 border-b border-zinc-100 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Covenant University · CMSS
            </p>
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-950">
              Department of Banking &amp; Finance
            </h2>
            <p className="text-xs text-zinc-500">
              Official Course Dues &amp; Clearance Certificate
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
            <CheckCircle size={14} weight="fill" className="text-emerald-700" />
            <span>CLEARED</span>
          </span>
        </div>

        {/* Certificate Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Identity Table Grid */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-zinc-100">
            <div>
              <span className="text-zinc-500 block text-[11px]">Student Name</span>
              <p className="font-semibold text-zinc-950 text-sm mt-0.5">
                {transaction.studentName}
              </p>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">Matriculation Number</span>
              <p className="font-mono font-semibold text-zinc-950 text-sm mt-0.5 font-tabular">
                {transaction.matricNumber}
              </p>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">Academic Level &amp; Role</span>
              <p className="text-zinc-800 font-medium mt-0.5">
                {transaction.level} ·{' '}
                {transaction.roleType === 'executive'
                  ? `Executive (${transaction.executiveTitle || 'Council'})`
                  : 'Regular'}
              </p>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">Certificate / Receipt No.</span>
              <p className="font-mono font-semibold text-zinc-950 mt-0.5">
                {transaction.receiptNumber || 'PENDING'}
              </p>
            </div>
          </div>

          {/* Amount Row */}
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-50 border border-zinc-200/80">
            <div>
              <p className="font-medium text-zinc-900">{transaction.categoryTitle}</p>
              <p className="text-zinc-500 text-[11px] font-mono mt-0.5">
                Settled via {transaction.paymentRail.toUpperCase()} · Ref: {transaction.reference}
              </p>
            </div>
            <div className="text-right">
              <span className="text-base font-mono font-bold text-zinc-950 font-tabular">
                {formatNaira(transaction.amountNaira)}
              </span>
            </div>
          </div>

          {/* Verification Barcode & Signature Metadata */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3.5">
              <div className="p-1.5 bg-white rounded-lg border border-zinc-200 shrink-0">
                <QRCodeSVG
                  value={verificationUrl}
                  size={64}
                  bgColor="#FFFFFF"
                  fgColor="#09090B"
                  level="M"
                />
              </div>
              <div className="space-y-0.5 text-[11px]">
                <p className="font-medium text-zinc-900">Cryptographically Signed</p>
                <p className="text-zinc-500">Scan QR code at examination checkpoints to verify.</p>
                <p className="text-zinc-400 font-mono">Issued: {formattedDate}</p>
              </div>
            </div>

            <div className="text-right text-[11px] text-zinc-500 hidden sm:block shrink-0">
              <p className="font-medium text-zinc-800">Office of the HOD</p>
              <p>Dept. of Banking &amp; Finance</p>
            </div>
          </div>

          {/* Actions Bar (Screen Only) */}
          <div className="no-print pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 text-white px-4 py-2 text-xs font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Printer size={15} />
              <span>Print / Save as PDF</span>
            </button>

            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={handleCopyRef}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                {copied ? <Check size={13} className="text-emerald-700" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : transaction.receiptNumber || 'Copy Ref'}</span>
              </button>

              {transaction.receiptNumber && (
                <Link
                  href={`/verify/${transaction.receiptNumber}`}
                  className="inline-flex items-center gap-1 text-zinc-900 hover:underline px-2 py-1"
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
