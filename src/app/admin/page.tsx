'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  DownloadSimple,
  MagnifyingGlass,
  SlidersHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  CurrencyNgn,
  ShieldCheck,
  Check,
  X,
  ArrowUpRight,
  ListChecks,
  WarningCircle,
  CaretDown,
} from '@phosphor-icons/react';
import {
  AcademicLevel,
  TransactionRecord,
  StudentRecord,
  FeeConfig,
  AuditLogEntry,
  INITIAL_FEE_CONFIG,
  getFeeConfig,
  updateFeeConfig,
  getTransactions,
  getStudents,
  getAuditLogs,
  approveBankTransfer,
  rejectBankTransfer,
  formatNaira,
  normalizeMatric,
} from '@/lib/ledger-store';

function formatDeterministicTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const mins = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${mins} GMT`;
}

export default function AdminDashboardPage() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [feeConfig, setFeeConfig] = useState<FeeConfig>(INITIAL_FEE_CONFIG);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Fee Settings Form State
  const [showSettings, setShowSettings] = useState(false);
  const [regInput, setRegInput] = useState(10000);
  const [execInput, setExecInput] = useState(15000);
  const [bankNameInput, setBankNameInput] = useState('');
  const [acctNoInput, setAcctNoInput] = useState('');
  const [acctNameInput, setAcctNameInput] = useState('');
  const [paystackEnabled, setPaystackEnabled] = useState(true);
  const [transferEnabled, setTransferEnabled] = useState(true);
  const [savedBanner, setSavedBanner] = useState('');

  const refreshData = () => {
    const cfg = getFeeConfig();
    setFeeConfig(cfg);
    setRegInput(cfg.regularAmountNaira);
    setExecInput(cfg.executiveAmountNaira);
    setBankNameInput(cfg.departmentalBankName);
    setAcctNoInput(cfg.departmentalAccountNumber);
    setAcctNameInput(cfg.departmentalAccountName);
    setPaystackEnabled(cfg.enablePaystackRail);
    setTransferEnabled(cfg.enableBankTransferRail);

    setTransactions(getTransactions());
    setStudents(getStudents());
    setAuditLogs(getAuditLogs());
  };

  useEffect(() => {
    refreshData();
    setMounted(true);
  }, []);

  // Metrics Calculation
  const metrics = useMemo(() => {
    const paidTxs = transactions.filter((t) => t.status === 'success');
    const pendingTxs = transactions.filter((t) => t.status === 'pending_verification');

    const totalRevenue = paidTxs.reduce((acc, t) => acc + t.amountNaira, 0);
    const regularPaidCount = paidTxs.filter((t) => t.roleType === 'regular').length;
    const execPaidCount = paidTxs.filter((t) => t.roleType === 'executive').length;

    const paidMatrics = new Set(paidTxs.map((t) => normalizeMatric(t.matricNumber)));
    const outstandingStudents = students.filter(
      (s) => !paidMatrics.has(normalizeMatric(s.matricNumber))
    );

    const byLevel: Record<AcademicLevel, { paid: number; total: number; revenue: number }> = {
      '100L': { paid: 0, total: 0, revenue: 0 },
      '200L': { paid: 0, total: 0, revenue: 0 },
      '300L': { paid: 0, total: 0, revenue: 0 },
      '400L': { paid: 0, total: 0, revenue: 0 },
      Postgrad: { paid: 0, total: 0, revenue: 0 },
    };

    students.forEach((s) => {
      if (byLevel[s.level]) byLevel[s.level].total += 1;
    });

    paidTxs.forEach((t) => {
      if (byLevel[t.level]) {
        byLevel[t.level].paid += 1;
        byLevel[t.level].revenue += t.amountNaira;
      }
    });

    return {
      totalRevenue,
      paidCount: paidTxs.length,
      regularPaidCount,
      execPaidCount,
      pendingCount: pendingTxs.length,
      outstandingCount: outstandingStudents.length,
      outstandingStudents,
      byLevel,
    };
  }, [transactions, students]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.studentName.toLowerCase().includes(q) ||
        t.matricNumber.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q) ||
        (t.receiptNumber && t.receiptNumber.toLowerCase().includes(q));

      const matchesLevel = levelFilter === 'ALL' || t.level === levelFilter;
      const matchesRole = roleFilter === 'ALL' || t.roleType === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

      return matchesSearch && matchesLevel && matchesRole && matchesStatus;
    });
  }, [transactions, searchQuery, levelFilter, roleFilter, statusFilter]);

  const handleSaveFeeSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateFeeConfig({
      regularAmountNaira: Number(regInput) || 10000,
      executiveAmountNaira: Number(execInput) || 15000,
      departmentalBankName: bankNameInput,
      departmentalAccountNumber: acctNoInput,
      departmentalAccountName: acctNameInput,
      enablePaystackRail: paystackEnabled,
      enableBankTransferRail: transferEnabled,
    });
    refreshData();
    setShowSettings(false);
    setSavedBanner('Fee policy updated across the portal (Regular: ₦' + Number(regInput).toLocaleString() + ', Exec: ₦' + Number(execInput).toLocaleString() + ').');
    setTimeout(() => setSavedBanner(''), 4000);
  };

  const handleApproveTransfer = (txId: string) => {
    approveBankTransfer(txId, 'FINSA Financial Secretary');
    refreshData();
  };

  const handleRejectTransfer = (txId: string) => {
    rejectBankTransfer(txId, 'FINSA Financial Secretary');
    refreshData();
  };

  // Excel-Compatible CSV Export Engine
  const downloadSpreadsheet = (mode: 'verified_only' | 'all_attempts' | 'outstanding_roster' | 'by_level') => {
    const today = new Date().toISOString().slice(0, 10);
    let filename = `FINSA_Clearance_Export_${today}.csv`;
    let headers: string[] = [];
    let rows: string[][] = [];

    if (mode === 'outstanding_roster') {
      filename = `FINSA_Outstanding_Defaulters_${today}.csv`;
      headers = [
        'Matric Number',
        'Student Full Name',
        'Level',
        'Classification',
        'Executive Portfolio',
        'Expected Amount (NGN)',
        'Email Address',
      ];
      rows = metrics.outstandingStudents.map((s) => [
        s.matricNumber,
        s.fullName,
        s.level,
        s.roleType.toUpperCase(),
        s.executiveTitle || 'N/A',
        String(
          s.roleType === 'executive'
            ? feeConfig.executiveAmountNaira
            : feeConfig.regularAmountNaira
        ),
        s.email,
      ]);
    } else {
      let source = filteredTransactions;
      if (mode === 'verified_only' || mode === 'by_level') {
        source = transactions.filter((t) => t.status === 'success');
      }
      if (mode === 'by_level') {
        filename = `FINSA_Clearance_Master_By_Level_${today}.csv`;
        source = [...source].sort((a, b) =>
          a.level === b.level
            ? a.matricNumber.localeCompare(b.matricNumber)
            : a.level.localeCompare(b.level)
        );
      } else if (mode === 'verified_only') {
        filename = `FINSA_Verified_Paid_Students_${today}.csv`;
      } else {
        filename = `FINSA_All_Transaction_Records_${today}.csv`;
      }

      headers = [
        'Receipt Number',
        'Matric Number',
        'Student Full Name',
        'Academic Level',
        'Classification',
        'Executive Portfolio',
        'Amount Paid (NGN)',
        'Status',
        'Payment Rail',
        'Gateway / Transfer Ref',
        'Verified Timestamp',
      ];

      rows = source.map((t) => [
        t.receiptNumber || 'UNISSUED',
        t.matricNumber,
        t.studentName,
        t.level,
        t.roleType === 'executive' ? 'EXECUTIVE' : 'REGULAR',
        t.executiveTitle || '-',
        String(t.amountNaira),
        t.status.toUpperCase(),
        t.paymentRail.toUpperCase(),
        t.reference,
        t.verifiedAt || t.createdAt,
      ]);
    }

    const escapeCsv = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map((r) => r.map(escapeCsv).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-[#FAFAFC] text-[#0A0D0C]">
      {/* Floating Translucent Pill Navigation (Apple-grade) */}
      <header className="sticky top-0 z-40 pt-4 px-4">
        <nav
          aria-label="Admin Navigation"
          className="max-w-7xl mx-auto h-14 px-5 rounded-full bg-white/80 backdrop-blur-xl border border-black/[0.06] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-8 h-8 rounded-full bg-[#F5F5F3] border border-black/10 flex items-center justify-center text-[#0A0D0C] hover:bg-[#064E3B] hover:text-white transition-all duration-150 active:scale-[0.97]"
              title="Return to Student Portal"
            >
              <ArrowLeft size={15} />
            </Link>
            <div>
              <span className="font-semibold text-sm tracking-tight text-[#0A0D0C] block">
                FINSA Financial Command Center
              </span>
              <span className="text-[10px] font-mono text-[#717875] hidden sm:block">
                Department of Banking &amp; Finance · Master Ledger &amp; Reconciliation
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                showSettings
                  ? 'bg-[#064E3B] text-white border-[#064E3B]'
                  : 'bg-white text-[#0A0D0C] border-black/10 hover:bg-[#F5F5F3]'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Configure Dues</span>
              <span className="sm:hidden">Dues</span>
              <span className="text-[10px] opacity-75 font-mono">
                (₦{(feeConfig.regularAmountNaira / 1000)}k/₦{(feeConfig.executiveAmountNaira / 1000)}k)
              </span>
            </button>

            <button
              type="button"
              onClick={() => downloadSpreadsheet('by_level')}
              className="group inline-flex items-center gap-2 rounded-full bg-[#0A0D0C] text-white pl-3.5 pr-2 py-1.5 text-xs font-medium hover:bg-[#064E3B] transition-all duration-150 active:scale-[0.97] cursor-pointer"
            >
              <span className="hidden sm:inline">Export Master (.CSV)</span>
              <span className="sm:hidden">Export</span>
              <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
                <DownloadSimple size={12} />
              </span>
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 pt-6 pb-20 space-y-6">
        {/* Toast / Notification Banner */}
        {savedBanner && (
          <div className="p-3.5 rounded-2xl bg-[#064E3B] text-white text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} weight="fill" className="text-emerald-300 shrink-0" />
              <span>{savedBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setSavedBanner('')}
              className="text-[11px] font-mono text-emerald-200 hover:text-white underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Collapsible Fee Configuration Drawer */}
        {showSettings && (
          <div className="rounded-3xl bg-white border border-black/[0.08] shadow-[0_10px_35px_-8px_rgba(0,0,0,0.05)] p-6 sm:p-7 space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#064E3B] font-semibold block">
                  Departmental Rate &amp; Rail Settings
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#0A0D0C]">
                  Configure Course Dues &amp; Payment Options
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="w-7 h-7 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#717875] hover:text-[#0A0D0C] transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveFeeSettings} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="reg-amount"
                    className="block text-xs font-medium text-[#0A0D0C]"
                  >
                    Regular Student Dues (₦)
                  </label>
                  <input
                    id="reg-amount"
                    type="number"
                    value={regInput}
                    onChange={(e) => setRegInput(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F6] border border-black/10 font-mono text-sm font-bold text-[#0A0D0C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                  />
                  <span className="text-[10px] font-mono text-[#717875] block">
                    Default: ₦10,000
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="exec-amount"
                    className="block text-xs font-medium text-[#0A0D0C]"
                  >
                    Student Executive Dues (₦)
                  </label>
                  <input
                    id="exec-amount"
                    type="number"
                    value={execInput}
                    onChange={(e) => setExecInput(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F6] border border-black/10 font-mono text-sm font-bold text-[#064E3B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                  />
                  <span className="text-[10px] font-mono text-[#717875] block">
                    Default: ₦15,000
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="bank-name"
                    className="block text-xs font-medium text-[#0A0D0C]"
                  >
                    Bank Name
                  </label>
                  <input
                    id="bank-name"
                    type="text"
                    value={bankNameInput}
                    onChange={(e) => setBankNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F6] border border-black/10 text-xs text-[#0A0D0C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="acct-no"
                    className="block text-xs font-medium text-[#0A0D0C]"
                  >
                    Departmental Account No.
                  </label>
                  <input
                    id="acct-no"
                    type="text"
                    value={acctNoInput}
                    onChange={(e) => setAcctNoInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F6] border border-black/10 font-mono text-xs text-[#0A0D0C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-black/[0.06]">
                <div className="flex flex-wrap items-center gap-6 text-xs">
                  <label className="inline-flex items-center gap-2 font-medium text-[#0A0D0C] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paystackEnabled}
                      onChange={(e) => setPaystackEnabled(e.target.checked)}
                      className="accent-[#064E3B] w-4 h-4 rounded"
                    />
                    <span>Paystack Card / Transfer Gateway</span>
                  </label>

                  <label className="inline-flex items-center gap-2 font-medium text-[#0A0D0C] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={transferEnabled}
                      onChange={(e) => setTransferEnabled(e.target.checked)}
                      className="accent-[#064E3B] w-4 h-4 rounded"
                    />
                    <span>Direct Bank Transfer Claim Fallback</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 rounded-full border border-black/10 text-xs font-medium text-[#525856] hover:bg-[#F5F5F3] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#064E3B] text-white text-xs font-medium hover:bg-[#0A0D0C] transition-all duration-150 active:scale-[0.97] cursor-pointer shadow-xs"
                  >
                    Save &amp; Broadcast
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* 4-Card Executive Metrics Grid (Apple-grade surface cards) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* Card 1 (4 cols): Total Verified Revenue */}
          <div className="lg:col-span-4 rounded-3xl bg-[#064E3B] text-white border border-emerald-950 p-6 shadow-[0_8px_24px_-6px_rgba(6,78,59,0.25)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-200">
                Verified Collections
              </span>
              <CurrencyNgn size={20} className="text-emerald-300" />
            </div>
            <div className="my-3">
              <p className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white font-tabular">
                {mounted ? formatNaira(metrics.totalRevenue) : '₦0'}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-emerald-100/90 pt-3 border-t border-white/15">
              <span>Regular (₦{(feeConfig.regularAmountNaira / 1000)}k): {metrics.regularPaidCount}</span>
              <span>Exec (₦{(feeConfig.executiveAmountNaira / 1000)}k): {metrics.execPaidCount}</span>
            </div>
          </div>

          {/* Card 2 (3 cols): Cleared Students */}
          <div className="lg:col-span-3 rounded-3xl bg-white border border-black/[0.08] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#717875]">
                Financially Cleared
              </span>
              <ShieldCheck size={20} weight="fill" className="text-[#064E3B]" />
            </div>
            <div className="my-3">
              <p className="text-3xl font-mono font-bold text-[#0A0D0C] font-tabular">
                {metrics.paidCount}{' '}
                <span className="text-sm font-normal text-[#717875]">
                  / {students.length} on roster
                </span>
              </p>
            </div>
            <p className="text-xs text-[#525856]">
              {metrics.outstandingCount} students have dues outstanding
            </p>
          </div>

          {/* Card 3 (2 cols): Pending Approvals */}
          <div className="lg:col-span-2 rounded-3xl bg-white border border-black/[0.08] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#B45309]">
                Pending Queue
              </span>
              <Clock size={20} weight="fill" className="text-[#B45309]" />
            </div>
            <div className="my-3">
              <p className="text-3xl font-mono font-bold text-[#0A0D0C] font-tabular">
                {metrics.pendingCount}
              </p>
            </div>
            <p className="text-xs text-[#717875]">Awaiting 1-click verification</p>
          </div>

          {/* Card 4 (3 cols): Level Breakdown */}
          <div className="lg:col-span-3 rounded-3xl bg-white border border-black/[0.08] p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#717875]">
              Clearance by Level
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {(['100L', '200L', '300L', '400L'] as AcademicLevel[]).map((lvl) => (
                <div
                  key={lvl}
                  className="p-2.5 rounded-xl bg-[#F7F7F6] border border-black/[0.05] flex items-center justify-between"
                >
                  <span className="font-semibold text-[#0A0D0C]">{lvl}</span>
                  <span className="text-[#064E3B] font-bold">
                    {metrics.byLevel[lvl].paid} paid
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Master Clearance Ledger Table & Toolbar */}
        <section className="rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-6 sm:p-7 space-y-6">
          {/* Header Row & Quick Export Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-black/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#064E3B]/10 flex items-center justify-center text-[#064E3B] shrink-0">
                <ListChecks size={18} weight="bold" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0A0D0C] tracking-tight">
                  Master Clearance Ledger
                </h2>
                <p className="text-xs text-[#717875]">
                  Live transactions, instant approvals, and verified credentials
                </p>
              </div>
            </div>

            {/* CSV Quick Export Cluster */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#717875] mr-1 hidden sm:inline">
                Download:
              </span>
              <button
                type="button"
                onClick={() => downloadSpreadsheet('verified_only')}
                className="px-3 py-1.5 rounded-full bg-[#064E3B]/10 hover:bg-[#064E3B]/15 text-[#064E3B] text-xs font-mono font-medium transition-all duration-150 active:scale-[0.97] cursor-pointer"
              >
                ✓ Verified Paid Only
              </button>
              <button
                type="button"
                onClick={() => downloadSpreadsheet('by_level')}
                className="px-3 py-1.5 rounded-full bg-[#F5F5F3] hover:bg-black/[0.06] text-[#0A0D0C] text-xs font-mono transition-all duration-150 active:scale-[0.97] cursor-pointer"
              >
                ↓ Grouped by Level
              </button>
              <button
                type="button"
                onClick={() => downloadSpreadsheet('outstanding_roster')}
                className="px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-[#B45309] text-xs font-mono transition-all duration-150 active:scale-[0.97] cursor-pointer"
              >
                ↓ Outstanding Defaulters ({metrics.outstandingCount})
              </button>
              <button
                type="button"
                onClick={() => downloadSpreadsheet('all_attempts')}
                className="px-3 py-1.5 rounded-full bg-[#F5F5F3] hover:bg-black/[0.06] text-[#717875] text-xs font-mono transition-all duration-150 active:scale-[0.97] cursor-pointer"
              >
                ↓ All Records
              </button>
            </div>
          </div>

          {/* Search & Multi-Axis Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-5 relative">
              <MagnifyingGlass
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#717875]"
              />
              <input
                id="admin-search-input"
                name="adminSearch"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Matric (22AG...), Name, or Receipt No..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F7F6] border border-black/10 text-xs sm:text-sm text-[#0A0D0C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
              />
            </div>

            <div className="lg:col-span-2">
              <select
                id="admin-level-filter"
                name="adminLevelFilter"
                aria-label="Filter by Level"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F7F7F6] border border-black/10 text-xs font-mono text-[#0A0D0C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
              >
                <option value="ALL">All Levels</option>
                <option value="100L">100 Level</option>
                <option value="200L">200 Level</option>
                <option value="300L">300 Level</option>
                <option value="400L">400 Level</option>
                <option value="Postgrad">Postgraduate</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                id="admin-role-filter"
                name="adminRoleFilter"
                aria-label="Filter by Classification"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F7F7F6] border border-black/10 text-xs font-mono text-[#0A0D0C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
              >
                <option value="ALL">All Roles</option>
                <option value="regular">Regular (₦{(feeConfig.regularAmountNaira).toLocaleString()})</option>
                <option value="executive">Executive (₦{(feeConfig.executiveAmountNaira).toLocaleString()})</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <select
                id="admin-status-filter"
                name="adminStatusFilter"
                aria-label="Filter by Payment Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F7F7F6] border border-black/10 text-xs font-mono text-[#0A0D0C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
              >
                <option value="ALL">All Statuses</option>
                <option value="success">✓ Verified &amp; Cleared</option>
                <option value="pending_verification">⏳ Pending Bank Transfer</option>
                <option value="failed">✕ Declined / Failed</option>
              </select>
            </div>
          </div>

          {/* Table Surface */}
          <div className="overflow-x-auto border border-black/[0.08] rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9F9FB] border-b border-black/[0.06] text-[10px] font-mono uppercase tracking-wider text-[#717875]">
                  <th className="py-3 px-4 font-semibold">Student &amp; Matric No</th>
                  <th className="py-3 px-4 font-semibold">Level &amp; Tier</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Rail &amp; Reference</th>
                  <th className="py-3 px-4 font-semibold">Clearance Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions / Credential</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] text-xs">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F7F7FA] transition-colors duration-150">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#0A0D0C]">{tx.studentName}</p>
                      <p className="font-mono text-[#717875] text-[11px] mt-0.5">{tx.matricNumber}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-[#0A0D0C]">{tx.level}</span>
                      <span
                        className={`ml-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${
                          tx.roleType === 'executive'
                            ? 'bg-[#064E3B]/10 text-[#064E3B] font-semibold'
                            : 'bg-black/[0.05] text-[#717875]'
                        }`}
                      >
                        {tx.roleType === 'executive'
                          ? `EXEC (${tx.executiveTitle || 'Council'})`
                          : 'REGULAR'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0A0D0C] font-tabular">
                      {formatNaira(tx.amountNaira)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#717875]">
                      <p className="text-[#0A0D0C] font-medium uppercase">{tx.paymentRail}</p>
                      <p className="truncate max-w-[140px]">{tx.reference}</p>
                      {tx.transferSenderBank && (
                        <p className="text-[#B45309]">
                          {tx.transferSenderBank} · {tx.transferSessionId}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {tx.status === 'success' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#064E3B] border border-emerald-200/60 font-mono text-[11px] font-semibold">
                          <CheckCircle size={13} weight="fill" />
                          <span>{tx.receiptNumber}</span>
                        </span>
                      )}
                      {tx.status === 'pending_verification' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-[#B45309] border border-amber-200/60 font-mono text-[11px] font-semibold">
                          <Clock size={13} weight="fill" />
                          <span>Pending Approval</span>
                        </span>
                      )}
                      {tx.status === 'failed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200/60 font-mono text-[11px]">
                          <XCircle size={13} weight="fill" />
                          <span>Declined</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {tx.status === 'pending_verification' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApproveTransfer(tx.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#064E3B] text-white font-mono text-[11px] font-medium hover:bg-[#0A0D0C] transition-all duration-150 active:scale-[0.97] cursor-pointer"
                          >
                            <Check size={12} weight="bold" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectTransfer(tx.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-mono text-[11px] hover:bg-red-100 transition-all duration-150 active:scale-[0.97] cursor-pointer"
                            title="Decline Transfer Claim"
                          >
                            <X size={12} weight="bold" />
                          </button>
                        </div>
                      ) : tx.receiptNumber ? (
                        <Link
                          href={`/verify/${tx.receiptNumber}`}
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-[#064E3B] hover:underline"
                        >
                          <span>Credential</span>
                          <ArrowUpRight size={13} />
                        </Link>
                      ) : (
                        <span className="text-[#717875] font-mono">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#717875] font-mono text-xs">
                      No transactions match the current search or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bottom Split: Outstanding Defaulters Watchlist + Immutable Audit Trail */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Outstanding Students (6 cols) */}
          <div className="lg:col-span-6 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#B45309]" />
                <h3 className="text-sm font-bold text-[#0A0D0C]">
                  Outstanding Roster Students ({metrics.outstandingCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => downloadSpreadsheet('outstanding_roster')}
                className="text-xs font-mono text-[#064E3B] hover:underline cursor-pointer"
              >
                Export CSV →
              </button>
            </div>

            <div className="divide-y divide-black/[0.05] max-h-72 overflow-y-auto pr-1">
              {metrics.outstandingStudents.map((stu) => (
                <div
                  key={stu.id}
                  className="py-3 flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <p className="font-semibold text-[#0A0D0C]">{stu.fullName}</p>
                    <p className="font-mono text-[#717875] text-[11px] mt-0.5">
                      {stu.matricNumber} · {stu.level} ·{' '}
                      {stu.roleType === 'executive'
                        ? `Executive (${stu.executiveTitle || 'Council'})`
                        : 'Regular'}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-[#B45309] font-tabular">
                    Owes{' '}
                    {formatNaira(
                      stu.roleType === 'executive'
                        ? feeConfig.executiveAmountNaira
                        : feeConfig.regularAmountNaira
                    )}
                  </span>
                </div>
              ))}
              {metrics.outstandingStudents.length === 0 && (
                <p className="py-8 text-center text-xs font-mono text-[#064E3B]">
                  All roster students have been verified and cleared!
                </p>
              )}
            </div>
          </div>

          {/* Immutable Audit Log (6 cols) */}
          <div className="lg:col-span-6 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6 space-y-4">
            <div className="pb-3 border-b border-black/[0.06]">
              <h3 className="text-sm font-bold text-[#0A0D0C]">
                Immutable Financial Audit Trail
              </h3>
              <p className="text-xs text-[#717875] mt-0.5">
                Cryptographic logging of dues policy modifications and verifications
              </p>
            </div>

            <div className="divide-y divide-black/[0.05] max-h-72 overflow-y-auto pr-1">
              {auditLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="py-2.5 text-xs space-y-0.5">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="font-semibold text-[#064E3B]">{log.action}</span>
                    <span className="text-[#717875]">
                      {mounted ? formatDeterministicTime(log.createdAt) : ''}
                    </span>
                  </div>
                  <p className="text-[#0A0D0C] text-[11px]">{log.details}</p>
                  <p className="text-[10px] font-mono text-[#717875]">Actor: {log.actor}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/[0.06] bg-white/50 py-5 px-4 text-xs text-[#717875]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>
            Department of Banking &amp; Finance (FINSA) · Covenant University Administrative Terminal
          </p>
          <div className="flex items-center gap-3 font-mono">
            <Link href="/" className="hover:text-[#0A0D0C]">
              ← Student Portal
            </Link>
            <span>·</span>
            <Link href="/verify/FINSA-26-00101" className="hover:text-[#0A0D0C]">
              Verification Scanner
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
