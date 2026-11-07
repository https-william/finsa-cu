'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Buildings,
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
} from '@phosphor-icons/react';
import {
  AcademicLevel,
  StudentRoleType,
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

export default function AdminDashboardPage() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [feeConfig, setFeeConfig] = useState<FeeConfig>(INITIAL_FEE_CONFIG);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

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
    setSavedBanner('Fee structure & payment rail settings updated across the portal.');
    setTimeout(() => setSavedBanner(''), 3500);
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
    let filename = `FINSA_Clearance_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    let headers: string[] = [];
    let rows: string[][] = [];

    if (mode === 'outstanding_roster') {
      filename = `FINSA_Outstanding_Unpaid_Students_${new Date().toISOString().slice(0, 10)}.csv`;
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
        filename = `FINSA_Test1_Clearance_Master_By_Level_${new Date().toISOString().slice(0, 10)}.csv`;
        source = [...source].sort((a, b) =>
          a.level === b.level
            ? a.matricNumber.localeCompare(b.matricNumber)
            : a.level.localeCompare(b.level)
        );
      } else if (mode === 'verified_only') {
        filename = `FINSA_Verified_Paid_Students_${new Date().toISOString().slice(0, 10)}.csv`;
      } else {
        filename = `FINSA_All_Transaction_Records_${new Date().toISOString().slice(0, 10)}.csv`;
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
    <div className="min-h-[100dvh] flex flex-col justify-between">
      {/* Floating Navigation Bar */}
      <header className="sticky top-0 z-40 pt-5 px-4">
        <nav className="max-w-7xl mx-auto h-16 px-5 rounded-full bg-white/85 backdrop-blur-2xl ring-1 ring-black/[0.07] shadow-[0_4px_24px_-6px_rgba(0,0,0,0.05)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-full bg-[#F7F7F4] border border-black/10 flex items-center justify-center text-[#0A0D0C] hover:bg-[#064E3B] hover:text-white transition-colors"
              title="Back to Student Portal"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <span className="font-semibold text-sm tracking-tight text-[#0A0D0C] block">
                FINSA Financial Command Center
              </span>
              <span className="text-[11px] font-mono text-[#525856] hidden sm:block">
                Department of Banking &amp; Finance · Test 1 Clearance &amp; Reconciliation
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowSettings((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                showSettings
                  ? 'bg-[#064E3B] text-white border-[#064E3B]'
                  : 'bg-white text-[#0A0D0C] border-black/10 hover:bg-[#F7F7F4]'
              }`}
            >
              <SlidersHorizontal size={15} />
              <span>Configure Dues (₦10k / ₦15k)</span>
            </button>

            <button
              type="button"
              onClick={() => downloadSpreadsheet('by_level')}
              className="group inline-flex items-center gap-2 rounded-full bg-[#0A0D0C] text-white pl-4 pr-2 py-1.5 text-xs font-medium hover:bg-[#064E3B] transition-colors cursor-pointer"
            >
              <span>Export Test 1 Clearance (.CSV)</span>
              <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                <DownloadSimple size={14} />
              </span>
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 pt-8 pb-24 space-y-8">
        {savedBanner && (
          <div className="p-4 rounded-2xl bg-[#064E3B] text-white text-xs font-mono flex items-center justify-between">
            <span>✓ {savedBanner}</span>
            <button
              type="button"
              onClick={() => setSavedBanner('')}
              className="underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* COLLAPSIBLE FEE CONFIGURATION PANEL (Regular: 10,000 | Executive: 15,000 — Editable) */}
        {showSettings && (
          <div className="bg-black/[0.035] ring-1 ring-black/[0.08] p-2 rounded-[2rem]">
            <form
              onSubmit={handleSaveFeeSettings}
              className="bg-white rounded-[calc(2rem-0.5rem)] p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-black/[0.07] pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#064E3B] font-semibold">
                    Departmental Policy Configuration
                  </span>
                  <h2 className="text-lg font-bold text-[#0A0D0C]">
                    Edit Course Dues Amounts &amp; Payment Rails
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="text-xs font-mono text-[#525856] hover:text-[#0A0D0C] cursor-pointer"
                >
                  Close [×]
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label
                    htmlFor="reg-amount"
                    className="block text-xs font-medium text-[#0A0D0C] mb-1"
                  >
                    Regular Student Dues (₦)
                  </label>
                  <input
                    id="reg-amount"
                    type="number"
                    value={regInput}
                    onChange={(e) => setRegInput(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F4] border border-black/10 font-mono text-sm font-bold text-[#0A0D0C]"
                  />
                  <span className="text-[11px] text-[#525856] mt-1 block">
                    Current Default: ₦10,000
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="exec-amount"
                    className="block text-xs font-medium text-[#0A0D0C] mb-1"
                  >
                    Student Executive Dues (₦)
                  </label>
                  <input
                    id="exec-amount"
                    type="number"
                    value={execInput}
                    onChange={(e) => setExecInput(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F4] border border-black/10 font-mono text-sm font-bold text-[#064E3B]"
                  />
                  <span className="text-[11px] text-[#525856] mt-1 block">
                    Current Default: ₦15,000
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="bank-name"
                    className="block text-xs font-medium text-[#0A0D0C] mb-1"
                  >
                    Departmental Bank Name
                  </label>
                  <input
                    id="bank-name"
                    type="text"
                    value={bankNameInput}
                    onChange={(e) => setBankNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F4] border border-black/10 text-xs text-[#0A0D0C]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="acct-no"
                    className="block text-xs font-medium text-[#0A0D0C] mb-1"
                  >
                    Departmental Account Number
                  </label>
                  <input
                    id="acct-no"
                    type="text"
                    value={acctNoInput}
                    onChange={(e) => setAcctNoInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F4] border border-black/10 font-mono text-xs text-[#0A0D0C]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-black/[0.06]">
                <div className="flex flex-wrap items-center gap-6">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-[#0A0D0C] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paystackEnabled}
                      onChange={(e) => setPaystackEnabled(e.target.checked)}
                      className="accent-[#064E3B] w-4 h-4"
                    />
                    <span>Enable Paystack Gateway Rail</span>
                  </label>

                  <label className="inline-flex items-center gap-2 text-xs font-medium text-[#0A0D0C] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={transferEnabled}
                      onChange={(e) => setTransferEnabled(e.target.checked)}
                      className="accent-[#064E3B] w-4 h-4"
                    />
                    <span>Enable Manual Bank Transfer Fallback Rail</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#064E3B] text-white text-xs font-medium hover:bg-[#0A0D0C] transition-colors cursor-pointer"
                >
                  Save &amp; Broadcast Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Asymmetric 4-Cell Executive Metrics Bento */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* Cell 1 (4 cols): Total Verified Revenue */}
          <div className="lg:col-span-4 bg-black/[0.03] ring-1 ring-black/[0.07] p-1.5 rounded-3xl">
            <div className="bg-[#064E3B] text-white rounded-[calc(1.5rem-0.375rem)] p-6 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-200">
                  Verified Collection (2026/2027)
                </span>
                <CurrencyNgn size={20} className="text-emerald-300" />
              </div>
              <div className="my-3">
                <p className="text-3xl sm:text-4xl font-mono font-bold tracking-tight font-tabular">
                  {formatNaira(metrics.totalRevenue)}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-emerald-100/90 pt-3 border-t border-white/15">
                <span>Regular (₦{feeConfig.regularAmountNaira.toLocaleString()}): {metrics.regularPaidCount}</span>
                <span>Exec (₦{feeConfig.executiveAmountNaira.toLocaleString()}): {metrics.execPaidCount}</span>
              </div>
            </div>
          </div>

          {/* Cell 2 (3 cols): Cleared Students */}
          <div className="lg:col-span-3 bg-black/[0.03] ring-1 ring-black/[0.07] p-1.5 rounded-3xl">
            <div className="bg-white rounded-[calc(1.5rem-0.375rem)] p-6 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#525856]">
                  Cleared for Test 1
                </span>
                <ShieldCheck size={20} weight="fill" className="text-[#064E3B]" />
              </div>
              <div className="my-3">
                <p className="text-3xl font-mono font-bold text-[#0A0D0C] font-tabular">
                  {metrics.paidCount}{' '}
                  <span className="text-sm font-normal text-[#525856]">
                    / {students.length} roster
                  </span>
                </p>
              </div>
              <p className="text-xs text-[#525856]">
                {metrics.outstandingCount} students on roster yet to complete dues
              </p>
            </div>
          </div>

          {/* Cell 3 (2 cols): Pending Transfer Approvals */}
          <div className="lg:col-span-2 bg-black/[0.03] ring-1 ring-black/[0.07] p-1.5 rounded-3xl">
            <div className="bg-white rounded-[calc(1.5rem-0.375rem)] p-6 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#B45309]">
                  Pending Queue
                </span>
                <Clock size={20} weight="fill" className="text-[#B45309]" />
              </div>
              <div className="my-3">
                <p className="text-3xl font-mono font-bold text-[#0A0D0C] font-tabular">
                  {metrics.pendingCount}
                </p>
              </div>
              <p className="text-xs text-[#525856]">Awaiting 1-click bank verification</p>
            </div>
          </div>

          {/* Cell 4 (3 cols): Level Breakdown (100L - 400L) */}
          <div className="lg:col-span-3 bg-black/[0.03] ring-1 ring-black/[0.07] p-1.5 rounded-3xl">
            <div className="bg-[#FAF9F6] rounded-[calc(1.5rem-0.375rem)] p-5 h-full flex flex-col justify-between space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#525856]">
                Clearance by Academic Level
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {(['100L', '200L', '300L', '400L'] as AcademicLevel[]).map((lvl) => (
                  <div
                    key={lvl}
                    className="p-2 rounded-xl bg-white border border-black/[0.06] flex items-center justify-between"
                  >
                    <span className="font-semibold text-[#0A0D0C]">{lvl}</span>
                    <span className="text-[#064E3B] font-bold">
                      {metrics.byLevel[lvl].paid} paid
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Administrative Export & Filter Toolbar */}
        <section className="bg-black/[0.03] ring-1 ring-black/[0.07] p-2 rounded-[2rem]">
          <div className="bg-white rounded-[calc(2rem-0.5rem)] p-5 sm:p-6 space-y-5">
            {/* Export Presets Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-black/[0.07]">
              <div className="flex items-center gap-2">
                <ListChecks size={20} className="text-[#064E3B]" />
                <h2 className="text-base font-bold text-[#0A0D0C]">
                  Master Transaction &amp; Clearance Ledger
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono uppercase text-[#525856] mr-1">
                  Spreadsheet Exports:
                </span>
                <button
                  type="button"
                  onClick={() => downloadSpreadsheet('verified_only')}
                  className="px-3 py-1.5 rounded-full bg-emerald-950/[0.07] hover:bg-emerald-950/[0.14] text-[#064E3B] text-xs font-mono font-medium transition-colors cursor-pointer"
                >
                  ↓ Verified Paid Only
                </button>
                <button
                  type="button"
                  onClick={() => downloadSpreadsheet('by_level')}
                  className="px-3 py-1.5 rounded-full bg-[#F7F7F4] hover:bg-black/[0.08] text-[#0A0D0C] text-xs font-mono transition-colors cursor-pointer"
                >
                  ↓ Grouped by Level (100L–400L)
                </button>
                <button
                  type="button"
                  onClick={() => downloadSpreadsheet('outstanding_roster')}
                  className="px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-[#B45309] text-xs font-mono transition-colors cursor-pointer"
                >
                  ↓ Outstanding Students ({metrics.outstandingCount})
                </button>
                <button
                  type="button"
                  onClick={() => downloadSpreadsheet('all_attempts')}
                  className="px-3 py-1.5 rounded-full bg-[#F7F7F4] hover:bg-black/[0.08] text-[#525856] text-xs font-mono transition-colors cursor-pointer"
                >
                  ↓ All Attempts
                </button>
              </div>
            </div>

            {/* Search & Multi-Axis Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-5 relative">
                <MagnifyingGlass
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#525856]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Matric No (22AG...), Name, or Receipt No..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F7F4] border border-black/10 text-xs sm:text-sm text-[#0A0D0C] focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                />
              </div>

              <div className="lg:col-span-2">
                <select
                  aria-label="Filter by Level"
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F7F4] border border-black/10 text-xs font-mono text-[#0A0D0C]"
                >
                  <option value="ALL">All Levels (100L–400L)</option>
                  <option value="100L">100 Level</option>
                  <option value="200L">200 Level</option>
                  <option value="300L">300 Level</option>
                  <option value="400L">400 Level</option>
                  <option value="Postgrad">Postgraduate</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <select
                  aria-label="Filter by Classification"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F7F4] border border-black/10 text-xs font-mono text-[#0A0D0C]"
                >
                  <option value="ALL">All Roles (Reg &amp; Exec)</option>
                  <option value="regular">Regular (₦{feeConfig.regularAmountNaira.toLocaleString()})</option>
                  <option value="executive">Executive (₦{feeConfig.executiveAmountNaira.toLocaleString()})</option>
                </select>
              </div>

              <div className="lg:col-span-3">
                <select
                  aria-label="Filter by Payment Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F7F4] border border-black/10 text-xs font-mono text-[#0A0D0C]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="success">✓ Verified &amp; Cleared</option>
                  <option value="pending_verification">⏳ Pending Transfer Approval</option>
                  <option value="failed">✕ Declined / Failed</option>
                </select>
              </div>
            </div>

            {/* Responsive Ledger Table */}
            <div className="overflow-x-auto border border-black/[0.07] rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F7F4] border-b border-black/[0.07] text-[11px] font-mono uppercase tracking-wider text-[#525856]">
                    <th className="py-3 px-4">Student &amp; Matric No</th>
                    <th className="py-3 px-4">Level &amp; Tier</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Rail &amp; Reference</th>
                    <th className="py-3 px-4">Clearance Status</th>
                    <th className="py-3 px-4 text-right">Actions / Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] text-xs">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#0A0D0C]">{tx.studentName}</p>
                        <p className="font-mono text-[#525856] mt-0.5">{tx.matricNumber}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-semibold text-[#0A0D0C]">{tx.level}</span>
                        <span
                          className={`ml-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${
                            tx.roleType === 'executive'
                              ? 'bg-[#064E3B]/10 text-[#064E3B] font-semibold'
                              : 'bg-black/[0.05] text-[#525856]'
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
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#525856]">
                        <p className="text-[#0A0D0C] font-medium uppercase">{tx.paymentRail}</p>
                        <p>{tx.reference}</p>
                        {tx.transferSenderBank && (
                          <p className="text-[#B45309]">
                            {tx.transferSenderBank} · {tx.transferSessionId}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.status === 'success' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/[0.07] text-[#064E3B] font-mono text-[11px] font-semibold">
                            <CheckCircle size={14} weight="fill" />
                            {tx.receiptNumber}
                          </span>
                        )}
                        {tx.status === 'pending_verification' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-[#B45309] font-mono text-[11px] font-semibold">
                            <Clock size={14} weight="fill" />
                            Pending Approval
                          </span>
                        )}
                        {tx.status === 'failed' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-mono text-[11px]">
                            <XCircle size={14} weight="fill" />
                            Declined
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {tx.status === 'pending_verification' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApproveTransfer(tx.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#064E3B] text-white font-mono text-[11px] hover:bg-[#0A0D0C] cursor-pointer"
                            >
                              <Check size={12} weight="bold" />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectTransfer(tx.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-mono text-[11px] hover:bg-red-100 cursor-pointer"
                            >
                              <X size={12} weight="bold" />
                            </button>
                          </div>
                        ) : tx.receiptNumber ? (
                          <Link
                            href={`/verify/${tx.receiptNumber}`}
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-[#064E3B] hover:underline"
                          >
                            <span>View Receipt</span>
                            <ArrowUpRight size={13} />
                          </Link>
                        ) : (
                          <span className="text-[#525856] font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#525856] font-mono">
                        No transactions match the current search or filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Bottom Split: Outstanding Students Watchlist + Immutable Audit Log */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Outstanding Students on Roster (6 cols) */}
          <div className="lg:col-span-6 bg-black/[0.03] ring-1 ring-black/[0.07] p-2 rounded-[2rem]">
            <div className="bg-white rounded-[calc(2rem-0.5rem)] p-6 space-y-4">
              <div className="flex items-center justify-between">
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
                  Export Defaulters CSV →
                </button>
              </div>

              <div className="divide-y divide-black/[0.06]">
                {metrics.outstandingStudents.map((stu) => (
                  <div
                    key={stu.id}
                    className="py-3 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[#0A0D0C]">{stu.fullName}</p>
                      <p className="font-mono text-[#525856]">
                        {stu.matricNumber} · {stu.level} ·{' '}
                        {stu.roleType === 'executive'
                          ? `Executive (${stu.executiveTitle})`
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
                  <p className="py-4 text-xs font-mono text-[#064E3B]">
                    All pre-loaded roster students have been verified and cleared!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Audit Trail (6 cols) */}
          <div className="lg:col-span-6 bg-black/[0.03] ring-1 ring-black/[0.07] p-2 rounded-[2rem]">
            <div className="bg-white rounded-[calc(2rem-0.5rem)] p-6 space-y-4">
              <h3 className="text-sm font-bold text-[#0A0D0C]">
                Immutable Financial Audit Trail
              </h3>
              <div className="divide-y divide-black/[0.06] max-h-64 overflow-y-auto pr-1">
                {auditLogs.slice(0, 8).map((log) => (
                  <div key={log.id} className="py-2.5 text-xs space-y-0.5">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="font-semibold text-[#064E3B]">{log.action}</span>
                      <span className="text-[#525856]">
                        {new Date(log.createdAt).toLocaleTimeString('en-NG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[#0A0D0C]">{log.details}</p>
                    <p className="text-[10px] font-mono text-[#525856]">Actor: {log.actor}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
