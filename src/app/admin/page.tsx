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
  Plus,
  PencilSimple,
  Trash,
  ArrowsCounterClockwise,
  Student,
  Sparkle,
  IdentificationCard,
  Funnel,
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
  createBackofficeStudent,
  updateBackofficeStudent,
  deleteBackofficeStudent,
  manualClearStudent,
  resetStudentsToRosterSeed,
  formatNaira,
  normalizeMatric,
} from '@/lib/ledger-store';
import { CovenantLaurelShieldArt, AppleLuminousAura } from '@/components/LineArtElements';

const LEVELS: AcademicLevel[] = ['100L', '200L', '300L', '400L', 'Postgrad'];

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

  // Active Admin View Tab: 'roster' | 'transactions' | 'settings' | 'audit'
  const [activeTab, setActiveTab] = useState<'roster' | 'transactions' | 'settings' | 'audit'>('roster');

  // Notification Toast Banner
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // --- ROSTER BACK OFFICE STATE ---
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterLevelFilter, setRosterLevelFilter] = useState<string>('ALL');
  const [rosterCourseFilter, setRosterCourseFilter] = useState<string>('ALL');
  const [rosterStatusFilter, setRosterStatusFilter] = useState<string>('ALL');

  // Modals for Student Management
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);

  // New Student Form State
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentMatric, setNewStudentMatric] = useState('');
  const [newStudentRegNo, setNewStudentRegNo] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentLevel, setNewStudentLevel] = useState<AcademicLevel>('100L');
  const [newStudentCourse, setNewStudentCourse] = useState('FinTech');
  const [newStudentRole, setNewStudentRole] = useState<StudentRoleType>('regular');
  const [newStudentExecTitle, setNewStudentExecTitle] = useState('');
  const [formError, setFormError] = useState('');

  // --- TRANSACTIONS LEDGER STATE ---
  const [txSearch, setTxSearch] = useState('');
  const [txLevelFilter, setTxLevelFilter] = useState<string>('ALL');
  const [txStatusFilter, setTxStatusFilter] = useState<string>('ALL');

  // --- FEE SETTINGS STATE ---
  const [regInput, setRegInput] = useState(10000);
  const [execInput, setExecInput] = useState(15000);
  const [bankNameInput, setBankNameInput] = useState('');
  const [acctNoInput, setAcctNoInput] = useState('');
  const [acctNameInput, setAcctNameInput] = useState('');
  const [paystackEnabled, setPaystackEnabled] = useState(true);
  const [transferEnabled, setTransferEnabled] = useState(true);

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

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setActionFeedback({ message, type });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Student Clearance Lookup Mapping
  const clearanceStatusMap = useMemo(() => {
    const map = new Map<string, { status: 'cleared' | 'pending' | 'unpaid'; transaction?: TransactionRecord }>();
    const paidTxs = transactions.filter((t) => t.status === 'success');
    const pendingTxs = transactions.filter((t) => t.status === 'pending_verification');

    paidTxs.forEach((t) => {
      map.set(normalizeMatric(t.matricNumber), { status: 'cleared', transaction: t });
    });

    pendingTxs.forEach((t) => {
      if (!map.has(normalizeMatric(t.matricNumber))) {
        map.set(normalizeMatric(t.matricNumber), { status: 'pending', transaction: t });
      }
    });

    return map;
  }, [transactions]);

  // Back Office Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = rosterSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.fullName.toLowerCase().includes(q) ||
        s.matricNumber.toLowerCase().includes(q) ||
        (s.regNo && s.regNo.toLowerCase().includes(q)) ||
        s.email.toLowerCase().includes(q) ||
        (s.course && s.course.toLowerCase().includes(q));

      const matchesLevel = rosterLevelFilter === 'ALL' || s.level === rosterLevelFilter;
      const matchesCourse =
        rosterCourseFilter === 'ALL' ||
        (s.course && s.course.toLowerCase() === rosterCourseFilter.toLowerCase());

      const clearance = clearanceStatusMap.get(normalizeMatric(s.matricNumber))?.status || 'unpaid';
      const matchesStatus =
        rosterStatusFilter === 'ALL' ||
        (rosterStatusFilter === 'CLEARED' && clearance === 'cleared') ||
        (rosterStatusFilter === 'UNPAID' && clearance === 'unpaid') ||
        (rosterStatusFilter === 'PENDING' && clearance === 'pending');

      return matchesSearch && matchesLevel && matchesCourse && matchesStatus;
    });
  }, [students, rosterSearch, rosterLevelFilter, rosterCourseFilter, rosterStatusFilter, clearanceStatusMap]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const q = txSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.studentName.toLowerCase().includes(q) ||
        t.matricNumber.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q) ||
        (t.receiptNumber && t.receiptNumber.toLowerCase().includes(q));

      const matchesLevel = txLevelFilter === 'ALL' || t.level === txLevelFilter;
      const matchesStatus = txStatusFilter === 'ALL' || t.status === txStatusFilter;

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [transactions, txSearch, txLevelFilter, txStatusFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalStudents = students.length;
    let clearedCount = 0;
    let pendingCount = 0;
    let financeCount = 0;
    let fintechCount = 0;

    students.forEach((s) => {
      const c = clearanceStatusMap.get(normalizeMatric(s.matricNumber))?.status;
      if (c === 'cleared') clearedCount += 1;
      else if (c === 'pending') pendingCount += 1;

      const crs = (s.course || '').toLowerCase();
      if (crs.includes('fintech')) fintechCount += 1;
      else financeCount += 1;
    });

    const unpaidCount = totalStudents - clearedCount - pendingCount;
    const paidTxs = transactions.filter((t) => t.status === 'success');
    const totalRevenue = paidTxs.reduce((sum, t) => sum + t.amountNaira, 0);

    return {
      totalStudents,
      clearedCount,
      pendingCount,
      unpaidCount,
      financeCount,
      fintechCount,
      totalRevenue,
      clearancePercentage: totalStudents > 0 ? Math.round((clearedCount / totalStudents) * 100) : 0,
    };
  }, [students, transactions, clearanceStatusMap]);

  // --- ACTIONS: STUDENT LOG CRUD ---
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (newStudentName.trim().length < 3) {
      setFormError('Please enter the full legal name of the student.');
      return;
    }
    if (newStudentMatric.trim().length < 5) {
      setFormError('Please enter a valid matriculation number (e.g. 25AG032080).');
      return;
    }
    const emailToUse = newStudentEmail.trim() || `${normalizeMatric(newStudentMatric).toLowerCase()}@stu.cu.edu.ng`;

    createBackofficeStudent({
      fullName: newStudentName,
      matricNumber: newStudentMatric,
      regNo: newStudentRegNo || undefined,
      email: emailToUse,
      level: newStudentLevel,
      course: newStudentCourse,
      roleType: newStudentRole,
      executiveTitle: newStudentRole === 'executive' ? newStudentExecTitle : undefined,
    });

    refreshData();
    setIsAddModalOpen(false);
    resetNewStudentForm();
    triggerToast(`Enrolled student ${newStudentName} into official registry.`);
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    updateBackofficeStudent(editingStudent.id, {
      fullName: editingStudent.fullName,
      matricNumber: editingStudent.matricNumber,
      regNo: editingStudent.regNo,
      email: editingStudent.email,
      level: editingStudent.level,
      course: editingStudent.course,
      roleType: editingStudent.roleType,
      executiveTitle: editingStudent.roleType === 'executive' ? editingStudent.executiveTitle : undefined,
    });

    refreshData();
    setEditingStudent(null);
    triggerToast(`Saved changes for ${editingStudent.fullName}.`);
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from the back office registry?`)) {
      deleteBackofficeStudent(id);
      refreshData();
      triggerToast(`Archived ${name} from the student registry.`, 'info');
    }
  };

  const handleManualClear = (studentId: string, studentName: string) => {
    const tx = manualClearStudent(studentId);
    if (tx) {
      refreshData();
      triggerToast(`Official clearance credential ${tx.receiptNumber} generated for ${studentName}!`);
    }
  };

  const handleResetToSeed = () => {
    if (
      window.confirm(
        'Restore the official university roster seed? This restores all 150+ original Finance and FinTech student profiles.'
      )
    ) {
      resetStudentsToRosterSeed();
      refreshData();
      triggerToast('Restored official departmental student registry seed.');
    }
  };

  const resetNewStudentForm = () => {
    setNewStudentName('');
    setNewStudentMatric('');
    setNewStudentRegNo('');
    setNewStudentEmail('');
    setNewStudentLevel('100L');
    setNewStudentCourse('FinTech');
    setNewStudentRole('regular');
    setNewStudentExecTitle('');
    setFormError('');
  };

  // --- ACTIONS: TRANSACTIONS APPROVAL ---
  const handleApprove = (txId: string) => {
    const res = approveBankTransfer(txId, 'Financial Secretary');
    if (res) {
      refreshData();
      triggerToast(`Transfer verified! Credential ${res.receiptNumber} issued to ${res.matricNumber}.`);
    }
  };

  const handleReject = (txId: string) => {
    if (window.confirm('Are you sure you want to decline this transfer claim?')) {
      const res = rejectBankTransfer(txId, 'Financial Secretary');
      if (res) {
        refreshData();
        triggerToast(`Transfer claim declined for ${res.matricNumber}.`, 'error');
      }
    }
  };

  // --- ACTIONS: FEE SETTINGS ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateFeeConfig({
      regularAmountNaira: Number(regInput),
      executiveAmountNaira: Number(execInput),
      departmentalBankName: bankNameInput,
      departmentalAccountNumber: acctNoInput,
      departmentalAccountName: acctNameInput,
      enablePaystackRail: paystackEnabled,
      enableBankTransferRail: transferEnabled,
    });
    refreshData();
    triggerToast('Treasury fee schedule and payment rails updated.');
  };

  // --- CSV EXPORT ENGINE ---
  const exportRosterCSV = () => {
    const today = new Date().toISOString().split('T')[0];
    const headers = [
      'Full Legal Name',
      'Matriculation Number',
      'Registration Number',
      'Academic Level',
      'Departmental Track',
      'Role Classification',
      'Executive Portfolio',
      'Clearance Status',
      'Official Receipt Number',
      'University Email',
    ];

    const rows = filteredStudents.map((s) => {
      const cl = clearanceStatusMap.get(normalizeMatric(s.matricNumber));
      return [
        s.fullName,
        s.matricNumber,
        s.regNo || 'N/A',
        s.level,
        s.course || 'Finance',
        s.roleType.toUpperCase(),
        s.executiveTitle || '-',
        cl?.status.toUpperCase() || 'UNPAID',
        cl?.transaction?.receiptNumber || 'UNISSUED',
        s.email,
      ];
    });

    const escapeCsv = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FINSA_Student_Roster_Log_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(`Exported ${filteredStudents.length} student records to CSV.`);
  };

  if (!mounted) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#FAFAFA] text-zinc-400">
        <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] relative flex flex-col justify-between bg-[#FAFAFA] text-[#09090B]">
      {/* Apple-grade Luminous Ambient Depth */}
      <AppleLuminousAura />

      {/* Precision Admin Navigation Bar */}
      <header className="border-b border-black/[0.06] bg-white/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto h-14 px-4 sm:px-6 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg border border-zinc-200/90 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors active:scale-[0.98]"
              title="Return to Student Portal"
            >
              <ArrowLeft size={15} />
            </Link>
            <div className="flex items-center gap-2">
              <CovenantLaurelShieldArt className="w-5 h-5 text-zinc-900" />
              <div>
                <span className="font-semibold text-sm tracking-tight text-zinc-950 block">
                  FINSA Back Office &amp; Administration
                </span>
                <span className="text-[11px] text-zinc-500 hidden sm:block">
                  Department of Banking &amp; Finance · Master Student Registry &amp; Ledger
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-mono text-[11px] border border-blue-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>Session {feeConfig.academicSession}</span>
            </span>

            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs transition-all active:scale-[0.98]"
            >
              Student Portal →
            </Link>
          </div>
        </div>
      </header>

      {/* Floating Action Feedback Toast */}
      {actionFeedback && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-lg border text-xs font-medium flex items-center gap-2 ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-950 text-emerald-100 border-emerald-800'
                : actionFeedback.type === 'error'
                ? 'bg-red-950 text-red-100 border-red-800'
                : 'bg-zinc-900 text-zinc-100 border-zinc-700'
            }`}
          >
            {actionFeedback.type === 'success' && <CheckCircle size={16} weight="fill" className="text-emerald-400" />}
            {actionFeedback.type === 'error' && <XCircle size={16} weight="fill" className="text-red-400" />}
            {actionFeedback.type === 'info' && <WarningCircle size={16} weight="fill" className="text-blue-400" />}
            <span>{actionFeedback.message}</span>
          </div>
        </div>
      )}

      {/* Main Administrative Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 flex-1">
        {/* Top Operational Metrics Ribbon (4-Card Grid) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Enrolled */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-black/[0.07] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-mono uppercase tracking-wider">Enrolled Scholars</span>
              <Users size={18} className="text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-zinc-950 font-tabular">
                {metrics.totalStudents}
              </span>
              <span className="text-[11px] text-zinc-500 font-medium">
                ({metrics.fintechCount} FinTech · {metrics.financeCount} Fin)
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Verified departmental roster</p>
          </div>

          {/* Card 2: Cleared Count & Rate */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-black/[0.07] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-mono uppercase tracking-wider">Cleared Students</span>
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-700 font-tabular">
                {metrics.clearedCount}
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono font-medium">
                {metrics.clearancePercentage}% cleared
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Official certificates issued</p>
          </div>

          {/* Card 3: Defaulters / Outstanding */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-black/[0.07] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-mono uppercase tracking-wider">Uncleared Dues</span>
              <Clock size={18} className="text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-zinc-950 font-tabular">
                {metrics.unpaidCount}
              </span>
              {metrics.pendingCount > 0 && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-mono">
                  {metrics.pendingCount} pending review
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">Pending session fee clearance</p>
          </div>

          {/* Card 4: Total Revenue Collected */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-black/[0.07] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-mono uppercase tracking-wider">Total Treasury Inflow</span>
              <CurrencyNgn size={18} className="text-zinc-900" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-zinc-950 font-tabular">
                {formatNaira(metrics.totalRevenue)}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Session {feeConfig.academicSession} receipts</p>
          </div>
        </div>

        {/* Master Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 border-b border-black/[0.07] pb-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`pb-2.5 px-3 sm:px-4 text-xs font-medium transition-colors cursor-pointer relative whitespace-nowrap ${
              activeTab === 'roster' ? 'text-zinc-950 font-semibold' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span>Student Registry &amp; Roster Log</span>
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-zinc-100 text-zinc-600 font-mono text-[10px]">
              {students.length}
            </span>
            {activeTab === 'roster' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`pb-2.5 px-3 sm:px-4 text-xs font-medium transition-colors cursor-pointer relative whitespace-nowrap ${
              activeTab === 'transactions' ? 'text-zinc-950 font-semibold' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span>Transactions &amp; Claims</span>
            {metrics.pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-mono text-[10px] font-semibold animate-pulse">
                {metrics.pendingCount}
              </span>
            )}
            {activeTab === 'transactions' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3 sm:px-4 text-xs font-medium transition-colors cursor-pointer relative whitespace-nowrap ${
              activeTab === 'settings' ? 'text-zinc-950 font-semibold' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span>Treasury &amp; Fee Rules</span>
            {activeTab === 'settings' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 px-3 sm:px-4 text-xs font-medium transition-colors cursor-pointer relative whitespace-nowrap ${
              activeTab === 'audit' ? 'text-zinc-950 font-semibold' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span>Audit Trail</span>
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-zinc-100 text-zinc-600 font-mono text-[10px]">
              {auditLogs.length}
            </span>
            {activeTab === 'audit' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950 rounded-full" />
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: EDITABLE STUDENT ROSTER LOG (BACK OFFICE REGISTRY)                  */}
        {/* ========================================================================= */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            {/* Control Bar: Search, Filters & Actions */}
            <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-black/[0.07] shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <MagnifyingGlass
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    id="rosterSearchInput"
                    name="rosterSearchInput"
                    type="text"
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    placeholder="Search by student name, matric, reg no, or email..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200/90 text-xs bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-tabular"
                  />
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      resetNewStudentForm();
                      setIsAddModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Plus size={14} weight="bold" />
                    <span>Add Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={exportRosterCSV}
                    className="px-3 py-2 rounded-xl border border-zinc-200/90 hover:bg-zinc-50 text-zinc-800 text-xs font-medium inline-flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <DownloadSimple size={14} />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetToSeed}
                    title="Restore full official roster seed (150+ students)"
                    className="p-2 rounded-xl border border-zinc-200/90 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 transition-all cursor-pointer"
                  >
                    <ArrowsCounterClockwise size={15} />
                  </button>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-100 flex-wrap text-xs">
                {/* Level Filter */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase mr-1">Level:</span>
                  {['ALL', '100L', '200L', '300L', '400L'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setRosterLevelFilter(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        rosterLevelFilter === lvl
                          ? 'bg-zinc-950 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                {/* Course Track Filter */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase mr-1">Track:</span>
                  {['ALL', 'FinTech', 'Finance'].map((trk) => (
                    <button
                      key={trk}
                      type="button"
                      onClick={() => setRosterCourseFilter(trk)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        rosterCourseFilter === trk
                          ? 'bg-zinc-950 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80'
                      }`}
                    >
                      {trk}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase mr-1">Status:</span>
                  {[
                    { key: 'ALL', label: 'All' },
                    { key: 'CLEARED', label: 'Cleared' },
                    { key: 'UNPAID', label: 'Unpaid' },
                    { key: 'PENDING', label: 'Review' },
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setRosterStatusFilter(st.key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        rosterStatusFilter === st.key
                          ? 'bg-zinc-950 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Back Office Table */}
            <div className="bg-white rounded-2xl border border-black/[0.07] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200/80 bg-zinc-50/70 text-zinc-500 font-mono text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 font-medium">Student Name &amp; Email</th>
                      <th className="py-3 px-4 font-medium">Matriculation &amp; Reg No</th>
                      <th className="py-3 px-4 font-medium">Level &amp; Track</th>
                      <th className="py-3 px-4 font-medium">Role</th>
                      <th className="py-3 px-4 font-medium">Clearance Status</th>
                      <th className="py-3 px-4 font-medium text-right">Back Office Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-tabular">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-400 space-y-1">
                          <p className="font-medium text-zinc-600 text-sm">No students match your criteria</p>
                          <p className="text-xs">Try clearing the search or reset filters to display the full student body.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => {
                        const cl = clearanceStatusMap.get(normalizeMatric(s.matricNumber));
                        const isCleared = cl?.status === 'cleared';
                        const isPending = cl?.status === 'pending';

                        return (
                          <tr key={s.id} className="hover:bg-zinc-50/80 transition-colors">
                            {/* Name & Email */}
                            <td className="py-3 px-4">
                              <span className="font-semibold text-zinc-900 block text-xs">
                                {s.fullName}
                              </span>
                              <span className="text-[11px] text-zinc-400">{s.email}</span>
                            </td>

                            {/* Matric & Reg No */}
                            <td className="py-3 px-4 font-mono">
                              <span className="font-semibold text-zinc-900 block">
                                {s.matricNumber}
                              </span>
                              {s.regNo && (
                                <span className="text-[10px] text-zinc-400 block">
                                  Reg: {s.regNo}
                                </span>
                              )}
                            </td>

                            {/* Level & Track */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-zinc-800">{s.level}</span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                    (s.course || '').toLowerCase() === 'fintech'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {s.course || 'Finance'}
                                </span>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="py-3 px-4">
                              {s.roleType === 'executive' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                  <Sparkle size={10} weight="fill" className="text-amber-600" />
                                  <span>{s.executiveTitle || 'Executive'}</span>
                                </span>
                              ) : (
                                <span className="text-zinc-500 text-[11px]">Regular Scholar</span>
                              )}
                            </td>

                            {/* Clearance Status */}
                            <td className="py-3 px-4">
                              {isCleared ? (
                                <Link
                                  href={`/verify/${cl.transaction?.receiptNumber}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                >
                                  <CheckCircle size={12} weight="fill" className="text-emerald-600" />
                                  <span>{cl.transaction?.receiptNumber}</span>
                                </Link>
                              ) : isPending ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock size={12} className="text-amber-600" />
                                  <span>Awaiting Review</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                                  <span>Unpaid (₦10k)</span>
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isCleared && (
                                  <button
                                    type="button"
                                    onClick={() => handleManualClear(s.id, s.fullName)}
                                    title="Issue direct manual departmental clearance"
                                    className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] transition-all cursor-pointer active:scale-[0.98]"
                                  >
                                    Clear
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setEditingStudent(s)}
                                  title="Edit student record"
                                  className="p-1 rounded text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
                                >
                                  <PencilSimple size={15} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteStudent(s.id, s.fullName)}
                                  title="Archive student"
                                  className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  <Trash size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Count */}
              <div className="p-3 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-xs text-zinc-500 font-mono">
                <span>Showing {filteredStudents.length} of {students.length} students</span>
                <span>FINSA Registered Database</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: TRANSACTIONS & CLAIMS LEDGER                                       */}
        {/* ========================================================================= */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-black/[0.07] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  id="txSearchInput"
                  name="txSearchInput"
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Filter by student name, matric, or receipt..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 text-xs bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="text-zinc-400 font-mono text-[11px]">Level:</span>
                  {['ALL', '100L', '200L', '300L', '400L'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setTxLevelFilter(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        txLevelFilter === lvl ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-zinc-400 font-mono text-[11px]">Status:</span>
                  {[
                    { key: 'ALL', label: 'All' },
                    { key: 'success', label: 'Verified' },
                    { key: 'pending_verification', label: 'Pending Claim' },
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setTxStatusFilter(st.key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        txStatusFilter === st.key ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl border border-black/[0.07] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-500 font-mono text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 font-medium">Receipt / Reference</th>
                      <th className="py-3 px-4 font-medium">Student Identity</th>
                      <th className="py-3 px-4 font-medium">Level &amp; Role</th>
                      <th className="py-3 px-4 font-medium">Amount &amp; Rail</th>
                      <th className="py-3 px-4 font-medium">Status &amp; Verification</th>
                      <th className="py-3 px-4 font-medium text-right">Reconciliation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-tabular">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-zinc-400">
                          No transactions found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t) => {
                        const isVerified = t.status === 'success';
                        const isPendingClaim = t.status === 'pending_verification';

                        return (
                          <tr key={t.id} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono">
                              {t.receiptNumber ? (
                                <Link
                                  href={`/verify/${t.receiptNumber}`}
                                  className="font-semibold text-blue-600 hover:underline block"
                                >
                                  {t.receiptNumber}
                                </Link>
                              ) : (
                                <span className="text-zinc-500 block">{t.reference}</span>
                              )}
                              <span className="text-[10px] text-zinc-400 block">
                                {formatDeterministicTime(t.createdAt)}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-semibold text-zinc-900 block">{t.studentName}</span>
                              <span className="text-[11px] font-mono text-zinc-500">{t.matricNumber}</span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-medium text-zinc-800">{t.level}</span>
                              <span className="text-[10px] text-zinc-400 block">
                                {t.roleType === 'executive' ? (t.executiveTitle || 'Executive') : 'Regular'}
                              </span>
                            </td>

                            <td className="py-3 px-4 font-mono">
                              <span className="font-bold text-zinc-950 block">{formatNaira(t.amountNaira)}</span>
                              <span className="text-[10px] text-zinc-500 uppercase">
                                {t.paymentRail.replace('_', ' ')}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              {isVerified ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <CheckCircle size={12} weight="fill" className="text-emerald-600" />
                                  <span>Verified</span>
                                </span>
                              ) : isPendingClaim ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                    <Clock size={12} className="text-amber-600" />
                                    <span>Transfer Claim</span>
                                  </span>
                                  <span className="text-[10px] text-zinc-500 block font-mono">
                                    {t.transferSenderBank} · {t.transferSessionId}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-zinc-400 font-mono text-[11px]">{t.status}</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              {isPendingClaim ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(t.id)}
                                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-all active:scale-[0.98] cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReject(t.id)}
                                    className="px-2.5 py-1 rounded border border-zinc-200 hover:bg-red-50 hover:text-red-600 text-zinc-600 font-medium text-xs transition-colors cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                </div>
                              ) : (
                                <span className="text-zinc-400 text-[11px] font-mono">Reconciled</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TREASURY FEE SETTINGS                                              */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-black/[0.07] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <h2 className="text-base font-semibold text-zinc-950 tracking-tight">
                Treasury &amp; Departmental Dues Schedule
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Configure official session dues amounts and official collection bank account.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="regDueInput" className="font-medium text-zinc-700 block">
                    Regular Course Due (₦)
                  </label>
                  <input
                    id="regDueInput"
                    name="regDueInput"
                    type="number"
                    value={regInput}
                    onChange={(e) => setRegInput(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 font-mono text-xs text-zinc-900"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="execDueInput" className="font-medium text-zinc-700 block">
                    Executive Council Due (₦)
                  </label>
                  <input
                    id="execDueInput"
                    name="execDueInput"
                    type="number"
                    value={execInput}
                    onChange={(e) => setExecInput(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 font-mono text-xs text-zinc-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="deptBankInput" className="font-medium text-zinc-700 block">
                  Departmental Bank Name
                </label>
                <input
                  id="deptBankInput"
                  name="deptBankInput"
                  type="text"
                  value={bankNameInput}
                  onChange={(e) => setBankNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs text-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="deptAcctNoInput" className="font-medium text-zinc-700 block">
                    Account Number
                  </label>
                  <input
                    id="deptAcctNoInput"
                    name="deptAcctNoInput"
                    type="text"
                    value={acctNoInput}
                    onChange={(e) => setAcctNoInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 font-mono text-xs text-zinc-900"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="deptAcctNameInput" className="font-medium text-zinc-700 block">
                    Account Name
                  </label>
                  <input
                    id="deptAcctNameInput"
                    name="deptAcctNameInput"
                    type="text"
                    value={acctNameInput}
                    onChange={(e) => setAcctNameInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs text-zinc-900"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paystackEnabled}
                      onChange={(e) => setPaystackEnabled(e.target.checked)}
                      className="rounded text-zinc-950 focus:ring-0"
                    />
                    <span>Enable Paystack</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={transferEnabled}
                      onChange={(e) => setTransferEnabled(e.target.checked)}
                      className="rounded text-zinc-950 focus:ring-0"
                    />
                    <span>Enable Bank Transfer</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  Save Treasury Rules
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: AUDIT TRAIL                                                        */}
        {/* ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-black/[0.07] shadow-xs p-6 space-y-4">
            <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-zinc-950 tracking-tight">
                  Cryptographic System Audit Trail
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tamper-evident chronological log of all clearance issuances, payments, and administrative actions.
                </p>
              </div>
              <span className="font-mono text-xs text-zinc-400">{auditLogs.length} Events Logged</span>
            </div>

            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-zinc-50/70 border border-zinc-100 flex items-start justify-between gap-4 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-zinc-950 text-[11px] px-1.5 py-0.5 rounded bg-zinc-200">
                        {log.action}
                      </span>
                      <span className="text-zinc-600 font-medium">by {log.actor}</span>
                    </div>
                    <p className="text-zinc-700">{log.details}</p>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400 shrink-0">
                    {formatDeterministicTime(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: ADD STUDENT DIALOG                                                 */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-black/[0.08] shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-950">Add Scholar to Back Office Registry</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Enroll a student into the official Department of Banking &amp; Finance roster.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
                <WarningCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label htmlFor="newStudentName" className="font-medium text-zinc-700 block">
                  Full Legal Name
                </label>
                <input
                  id="newStudentName"
                  name="newStudentName"
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Adeyemi Ayotunde Immanuel"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-zinc-950 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="newStudentMatric" className="font-medium text-zinc-700 block">
                    Matriculation Number
                  </label>
                  <input
                    id="newStudentMatric"
                    name="newStudentMatric"
                    type="text"
                    required
                    value={newStudentMatric}
                    onChange={(e) => setNewStudentMatric(e.target.value.toUpperCase())}
                    placeholder="e.g. 25AG031075"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 font-mono text-zinc-950 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="newStudentRegNo" className="font-medium text-zinc-700 block">
                    Registration No (Optional)
                  </label>
                  <input
                    id="newStudentRegNo"
                    name="newStudentRegNo"
                    type="text"
                    value={newStudentRegNo}
                    onChange={(e) => setNewStudentRegNo(e.target.value)}
                    placeholder="e.g. 2501075"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 font-mono text-zinc-950 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="newStudentLevel" className="font-medium text-zinc-700 block">
                    Academic Level
                  </label>
                  <select
                    id="newStudentLevel"
                    name="newStudentLevel"
                    value={newStudentLevel}
                    onChange={(e) => setNewStudentLevel(e.target.value as AcademicLevel)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-zinc-950 bg-white"
                  >
                    {LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="newStudentCourse" className="font-medium text-zinc-700 block">
                    Departmental Track
                  </label>
                  <select
                    id="newStudentCourse"
                    name="newStudentCourse"
                    value={newStudentCourse}
                    onChange={(e) => setNewStudentCourse(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-zinc-950 bg-white"
                  >
                    <option value="FinTech">FinTech</option>
                    <option value="Finance">Finance</option>
                    <option value="Banking & Finance">Banking &amp; Finance</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="newStudentRole" className="font-medium text-zinc-700 block">
                  Classification Role
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="roleType"
                      checked={newStudentRole === 'regular'}
                      onChange={() => setNewStudentRole('regular')}
                      className="text-zinc-950"
                    />
                    <span>Regular Student</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="roleType"
                      checked={newStudentRole === 'executive'}
                      onChange={() => setNewStudentRole('executive')}
                      className="text-zinc-950"
                    />
                    <span>Executive Officer</span>
                  </label>
                </div>
              </div>

              {newStudentRole === 'executive' && (
                <div className="space-y-1">
                  <label htmlFor="newStudentExecTitle" className="font-medium text-zinc-700 block">
                    Executive Portfolio Title
                  </label>
                  <input
                    id="newStudentExecTitle"
                    name="newStudentExecTitle"
                    type="text"
                    required
                    value={newStudentExecTitle}
                    onChange={(e) => setNewStudentExecTitle(e.target.value)}
                    placeholder="e.g. FINSA Public Relations Officer"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-zinc-950 bg-white"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white font-medium active:scale-[0.98]"
                >
                  Enroll Scholar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT STUDENT DIALOG                                                */}
      {/* ========================================================================= */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-black/[0.08] shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-950">Edit Scholar Record</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Modify registered academic information for {editingStudent.matricNumber}.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label htmlFor="editStudentName" className="font-medium text-zinc-700 block">
                  Full Legal Name
                </label>
                <input
                  id="editStudentName"
                  name="editStudentName"
                  type="text"
                  required
                  value={editingStudent.fullName}
                  onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-zinc-950 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="editStudentMatric" className="font-medium text-zinc-700 block">
                    Matriculation Number
                  </label>
                  <input
                    id="editStudentMatric"
                    name="editStudentMatric"
                    type="text"
                    required
                    value={editingStudent.matricNumber}
                    onChange={(e) => setEditingStudent({ ...editingStudent, matricNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 font-mono text-zinc-950 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="editStudentRegNo" className="font-medium text-zinc-700 block">
                    Registration No
                  </label>
                  <input
                    id="editStudentRegNo"
                    name="editStudentRegNo"
                    type="text"
                    value={editingStudent.regNo || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, regNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 font-mono text-zinc-950 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="editStudentEmail" className="font-medium text-zinc-700 block">
                  Email Address
                </label>
                <input
                  id="editStudentEmail"
                  name="editStudentEmail"
                  type="email"
                  required
                  value={editingStudent.email}
                  onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-zinc-950 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="editStudentLevel" className="font-medium text-zinc-700 block">
                    Academic Level
                  </label>
                  <select
                    id="editStudentLevel"
                    name="editStudentLevel"
                    value={editingStudent.level}
                    onChange={(e) => setEditingStudent({ ...editingStudent, level: e.target.value as AcademicLevel })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-zinc-950 bg-white"
                  >
                    {LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="editStudentCourse" className="font-medium text-zinc-700 block">
                    Departmental Track
                  </label>
                  <select
                    id="editStudentCourse"
                    name="editStudentCourse"
                    value={editingStudent.course || 'Finance'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, course: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-zinc-950 bg-white"
                  >
                    <option value="FinTech">FinTech</option>
                    <option value="Finance">Finance</option>
                    <option value="Banking & Finance">Banking &amp; Finance</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-zinc-700 block">Classification Role</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="editRoleType"
                      checked={editingStudent.roleType === 'regular'}
                      onChange={() => setEditingStudent({ ...editingStudent, roleType: 'regular' })}
                      className="text-zinc-950"
                    />
                    <span>Regular Student</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="editRoleType"
                      checked={editingStudent.roleType === 'executive'}
                      onChange={() => setEditingStudent({ ...editingStudent, roleType: 'executive' })}
                      className="text-zinc-950"
                    />
                    <span>Executive Officer</span>
                  </label>
                </div>
              </div>

              {editingStudent.roleType === 'executive' && (
                <div className="space-y-1">
                  <label htmlFor="editStudentExecTitle" className="font-medium text-zinc-700 block">
                    Executive Portfolio Title
                  </label>
                  <input
                    id="editStudentExecTitle"
                    name="editStudentExecTitle"
                    type="text"
                    value={editingStudent.executiveTitle || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, executiveTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-zinc-950 bg-white"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3.5 py-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white font-medium active:scale-[0.98]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Institutional Precision Footer */}
      <footer className="border-t border-black/[0.06] bg-white py-6 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-900">FINSA Command</span>
            <span>·</span>
            <span>Back Office Student Administration</span>
          </div>
          <div className="font-mono text-[11px] text-zinc-400">
            <span>Covenant University · College of Management and Social Sciences</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
