'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Bank,
  Copy,
  Check,
  CheckCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Calendar,
  Briefcase,
  Users,
  Lock,
  ShieldCheck,
  Buildings,
  ArrowUpRight,
  Sparkle,
  Student,
  SignOut,
  Eye,
  EyeSlash,
  GraduationCap,
  IdentificationBadge,
  FileText,
  CaretRight,
  WarningCircle,
} from '@phosphor-icons/react';
import {
  AcademicLevel,
  StudentRoleType,
  StudentRecord,
  TransactionRecord,
  FeeConfig,
  INITIAL_FEE_CONFIG,
  getFeeConfig,
  lookupStudentByMatric,
  upsertStudent,
  recordVerifiedPaystackPayment,
  submitBankTransferClaim,
  formatNaira,
  normalizeMatric,
  getActiveSessionStudent,
  setActiveSessionStudent,
  authenticateStudent,
  getSampleDemoStudents,
} from '@/lib/ledger-store';
import { BankNoteReceipt } from '@/components/BankNoteReceipt';
import {
  FinancialGuillocheArt,
  CovenantLaurelShieldArt,
  LevelAestheticBadge,
  AppleLuminousAura,
} from '@/components/LineArtElements';

const LEVELS: AcademicLevel[] = ['100L', '200L', '300L', '400L', 'Postgrad'];

// Curated demo personas for quick 1-click evaluation
const DEMO_PERSONAS = [
  {
    matric: '22AG031140',
    name: 'Ayomide Afolabi',
    level: '400L' as AcademicLevel,
    role: 'regular' as StudentRoleType,
    badgeText: '400L · Pending Dues',
    badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  },
  {
    matric: '22AG031042',
    name: 'Tobiloba Adeyemi',
    level: '400L' as AcademicLevel,
    role: 'executive' as StudentRoleType,
    badgeText: 'FINSA President · Cleared',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  },
  {
    matric: '23AG033512',
    name: 'Moyosore Bello',
    level: '300L' as AcademicLevel,
    role: 'regular' as StudentRoleType,
    badgeText: '300L · Cleared',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  },
  {
    matric: '25AG037804',
    name: 'Munachimso Ezeife',
    level: '100L' as AcademicLevel,
    role: 'regular' as StudentRoleType,
    badgeText: '100L Freshman · Unpaid',
    badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  },
];

export default function DepartmentalPortalPage() {
  const router = useRouter();
  const [feeConfig, setFeeConfig] = useState<FeeConfig>(INITIAL_FEE_CONFIG);
  const [mounted, setMounted] = useState(false);

  // Authentication State
  const [currentStudent, setCurrentStudent] = useState<StudentRecord | null>(null);
  const [loginMatric, setLoginMatric] = useState('');
  const [loginPassword, setLoginPassword] = useState('finsaonline');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active view tab inside personalized portal: 'overview' | 'clearance' | 'modules'
  const [activeTab, setActiveTab] = useState<'overview' | 'clearance' | 'modules'>('overview');

  // Student Clearance Transaction State
  const [activeReceipt, setActiveReceipt] = useState<TransactionRecord | null>(null);
  const [pendingTx, setPendingTx] = useState<TransactionRecord | null>(null);
  const [selectedRail, setSelectedRail] = useState<'paystack' | 'bank_transfer'>('paystack');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Manual Bank Transfer Fields
  const [senderBank, setSenderBank] = useState('');
  const [transferSessionId, setTransferSessionId] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [formError, setFormError] = useState('');

  // Initialize from client storage
  useEffect(() => {
    const cfg = getFeeConfig();
    setFeeConfig(cfg);
    if (!cfg.enablePaystackRail && cfg.enableBankTransferRail) {
      setSelectedRail('bank_transfer');
    }

    const savedSession = getActiveSessionStudent();
    if (savedSession) {
      loadStudentContext(savedSession);
    }
    setMounted(true);
  }, []);

  const loadStudentContext = (student: StudentRecord) => {
    setCurrentStudent(student);
    const { paidTransaction, pendingTransaction } = lookupStudentByMatric(student.matricNumber);
    if (paidTransaction) {
      setActiveReceipt(paidTransaction);
      setPendingTx(null);
    } else if (pendingTransaction) {
      setPendingTx(pendingTransaction);
      setActiveReceipt(null);
    } else {
      setActiveReceipt(null);
      setPendingTx(null);
    }
    setFormError('');
    setLoginError('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = authenticateStudent(loginMatric, loginPassword);
    if (!res.success || !res.student) {
      setLoginError(res.error || 'Login failed. Check your credentials.');
      return;
    }
    loadStudentContext(res.student);
  };

  const handleQuickPersonaLogin = (matric: string) => {
    setLoginError('');
    const res = authenticateStudent(matric, 'finsaonline');
    if (res.success && res.student) {
      loadStudentContext(res.student);
    }
  };

  const handleLogout = () => {
    setActiveSessionStudent(null);
    setCurrentStudent(null);
    setActiveReceipt(null);
    setPendingTx(null);
    setLoginMatric('');
    setLoginPassword('finsaonline');
    setActiveTab('overview');
  };

  const currentDueAmount =
    currentStudent?.roleType === 'executive'
      ? feeConfig.executiveAmountNaira
      : feeConfig.regularAmountNaira;

  const handlePaystackCheckout = () => {
    if (!currentStudent) return;
    setFormError('');
    setIsProcessing(true);

    setTimeout(() => {
      const verifiedTx = recordVerifiedPaystackPayment({ student: currentStudent });
      setIsProcessing(false);
      setActiveReceipt(verifiedTx);
      setPendingTx(null);
      setShowReceiptModal(true);
    }, 750);
  };

  const handleBankTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;
    setFormError('');

    if (senderBank.trim().length < 2) {
      setFormError('Enter the name of your sending bank.');
      return;
    }
    if (transferSessionId.trim().length < 5) {
      setFormError('Enter the bank transaction reference or session ID.');
      return;
    }

    const tx = submitBankTransferClaim({
      student: currentStudent,
      senderBank,
      sessionId: transferSessionId,
    });

    if (tx.status === 'success') {
      setActiveReceipt(tx);
      setPendingTx(null);
      setShowReceiptModal(true);
    } else {
      setPendingTx(tx);
      setActiveReceipt(null);
    }
  };

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(feeConfig.departmentalAccountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  if (!mounted) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#FAFAFA] text-zinc-400">
        <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] relative flex flex-col justify-between bg-[#FAFAFA] text-[#09090B] selection:bg-blue-600/10 selection:text-blue-900">
      {/* Apple-grade Luminous Ambient Depth (NO GRID LINES) */}
      <AppleLuminousAura />

      {/* Top Precision Institutional Navigation Bar */}
      <header className="no-print border-b border-black/[0.06] bg-white/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-6xl mx-auto h-14 px-4 sm:px-6 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2.5 hover:opacity-85 transition-opacity"
            >
              <CovenantLaurelShieldArt className="w-6 h-6 text-zinc-950" />
              <div className="flex items-baseline gap-1.5">
                <span className="font-semibold text-zinc-950 text-sm tracking-tight">FINSA</span>
                <span className="text-zinc-300">/</span>
                <span className="text-zinc-500 font-medium hidden sm:inline">
                  Dept. of Banking &amp; Finance
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100/80 text-zinc-600 font-mono text-[11px] border border-black/[0.04]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Session {feeConfig.academicSession}</span>
            </div>

            <Link
              href="/verify/FINSA-26-00101"
              className="text-zinc-500 hover:text-zinc-900 transition-colors hidden sm:inline-block px-1.5 font-medium"
            >
              Verify Credential
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-zinc-200/90 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 font-medium transition-all active:scale-[0.98]"
            >
              <span>Admin</span>
              <ArrowUpRight size={12} />
            </Link>

            {/* If logged in, show student pill + logout */}
            {currentStudent ? (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
                <div className="flex items-center gap-1.5 bg-zinc-100/90 hover:bg-zinc-100 px-2.5 py-1 rounded-full border border-black/[0.05]">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center font-mono text-[10px] font-semibold">
                    {currentStudent.fullName.charAt(0)}
                  </span>
                  <span className="font-medium text-zinc-900 text-xs hidden sm:inline">
                    {currentStudent.fullName.split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-zinc-200/80 text-zinc-700 rounded">
                    {currentStudent.level}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign out of portal"
                  className="p-1.5 text-zinc-400 hover:text-zinc-800 transition-colors rounded-md hover:bg-zinc-100 cursor-pointer"
                >
                  <SignOut size={16} />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8 flex-1">
        {/* ========================================================================= */}
        {/* CASE 1: NOT LOGGED IN - STUDENT AUTHENTICATION GATEWAY                    */}
        {/* ========================================================================= */}
        {!currentStudent ? (
          <div className="space-y-10 py-4 max-w-4xl mx-auto">
            {/* Luminous Header & Guilloché Accent */}
            <div className="text-center space-y-3 relative pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100/80 shadow-xs">
                <Sparkle size={13} weight="fill" className="text-blue-600" />
                <span>Department of Banking &amp; Finance Portal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
                Student Gateway &amp; Clearance Hub
              </h1>
              <p className="text-sm text-zinc-500 max-w-lg mx-auto leading-relaxed">
                Enter your Covenant University matriculation number and security password to access your personalized academic dashboard and clearance.
              </p>

              {/* Sophisticated Guilloché SVG Line Art */}
              <div className="pt-2 pb-1 overflow-hidden opacity-80">
                <FinancialGuillocheArt className="w-full h-16 sm:h-20 text-blue-600/40" />
              </div>
            </div>

            {/* Interactive Sign-In Card */}
            <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md rounded-2xl border border-black/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8 space-y-6">
              <div className="border-b border-zinc-100 pb-4">
                <h2 className="text-base font-semibold text-zinc-950 tracking-tight">
                  Student Sign In
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Secure access for registered Banking &amp; Finance scholars.
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-lg bg-red-50/80 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <WarningCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="loginMatric"
                    className="block text-xs font-medium text-zinc-700"
                  >
                    Matriculation Number
                  </label>
                  <div className="relative">
                    <input
                      id="loginMatric"
                      name="loginMatric"
                      type="text"
                      required
                      value={loginMatric}
                      onChange={(e) => setLoginMatric(e.target.value.toUpperCase())}
                      placeholder="e.g. 22AG031140"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-950 text-sm font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-tabular"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="loginPassword"
                      className="font-medium text-zinc-700"
                    >
                      Portal Password / PIN
                    </label>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Default: finsaonline
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="loginPassword"
                      name="loginPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-950 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-0.5"
                    >
                      {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                >
                  <span>Access Personalized Portal</span>
                  <ArrowRight size={14} />
                </button>
              </form>

              {/* Quick Persona Picker for Effortless Testing */}
              <div className="pt-4 border-t border-zinc-100 space-y-2.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
                  Quick Demo Access (1-Click Student Login)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEMO_PERSONAS.map((p) => (
                    <button
                      key={p.matric}
                      type="button"
                      onClick={() => handleQuickPersonaLogin(p.matric)}
                      className="text-left p-2.5 rounded-lg border border-zinc-200/80 bg-zinc-50/70 hover:bg-zinc-100 hover:border-zinc-300 transition-all cursor-pointer group active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-zinc-900 group-hover:text-blue-600 transition-colors">
                          {p.name.split(' ')[0]}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">{p.matric}</span>
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${p.badgeColor}`}
                        >
                          {p.badgeText}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Departmental Accreditation Footnote */}
            <div className="text-center text-xs text-zinc-400 space-y-1">
              <p>Covenant University · College of Management and Social Sciences</p>
              <p className="font-mono text-[11px]">
                Chartered Institute of Bankers of Nigeria (CIBN) Accredited Program
              </p>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CASE 2: LOGGED IN - BESPOKE PERSONALIZED STUDENT PORTAL                   */
          /* ========================================================================= */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Student Identity Dossier & Personal Welcome */}
            <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-black/[0.07] p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-950 text-white flex items-center justify-center font-semibold text-xl tracking-tight shadow-sm shrink-0 border border-white/10">
                    {currentStudent.fullName.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950">
                        {currentStudent.fullName}
                      </h1>
                      {currentStudent.roleType === 'executive' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          <Sparkle size={12} weight="fill" className="text-amber-600" />
                          <span>{currentStudent.executiveTitle || 'Executive Council'}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono flex-wrap">
                      <span className="text-zinc-900 font-semibold">{currentStudent.matricNumber}</span>
                      <span>·</span>
                      <span className="text-blue-700 font-medium">{currentStudent.level} Scholar</span>
                      <span>·</span>
                      <span>Dept. of Banking &amp; Finance</span>
                    </div>
                  </div>
                </div>

                {/* Clearance Status Pass Indicator */}
                <div className="flex items-center gap-3">
                  {activeReceipt ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <CheckCircle size={18} weight="fill" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                          <span>Departmental Clearance Verified</span>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-700 block mt-0.5">
                          Receipt: {activeReceipt.receiptNumber}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowReceiptModal(true)}
                        className="ml-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-all active:scale-[0.98] cursor-pointer"
                      >
                        View Credential
                      </button>
                    </div>
                  ) : pendingTx ? (
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-3">
                      <Clock size={20} className="text-amber-600 shrink-0 animate-pulse" />
                      <div>
                        <span className="text-xs font-semibold text-amber-900 block">
                          Bank Transfer Under Verification
                        </span>
                        <span className="text-[11px] font-mono text-amber-700 block">
                          Session Ref: {pendingTx.transferSessionId}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-blue-950 block">
                          Dues Clearance Pending
                        </span>
                        <span className="text-[11px] text-blue-700 font-mono">
                          Assessment: {formatNaira(currentDueAmount)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('clearance')}
                        className="ml-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-all active:scale-[0.98] cursor-pointer"
                      >
                        Clear Now
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Subdued Line Art Wave in dossier */}
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                <span className="font-mono text-[11px]">
                  Academic Year {feeConfig.academicSession} · CMSS Covenant
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hover:text-zinc-900 transition-colors cursor-pointer text-[11px] font-medium"
                >
                  Switch Student Account →
                </button>
              </div>
            </div>

            {/* Personalized Tab Switcher */}
            <div className="flex items-center gap-2 border-b border-black/[0.06] pb-1">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer relative ${
                  activeTab === 'overview'
                    ? 'text-zinc-950 font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <span>My Level Hub ({currentStudent.level})</span>
                {activeTab === 'overview' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950 rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('clearance')}
                className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer relative ${
                  activeTab === 'clearance'
                    ? 'text-zinc-950 font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <span>Financial Dues &amp; Clearance</span>
                {activeTab === 'clearance' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950 rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('modules')}
                className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer relative ${
                  activeTab === 'modules'
                    ? 'text-zinc-950 font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <span>All Department Services</span>
                {activeTab === 'modules' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950 rounded-full" />
                )}
              </button>
            </div>

            {/* ========================================================================= */}
            {/* VIEW TAB 1: MY LEVEL HUB (PERSONALIZED CONTENT FOR 100L, 200L, 300L, 400L) */}
            {/* ========================================================================= */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Level Specific Banner */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-zinc-50/80 border border-black/[0.07] shadow-xs flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <LevelAestheticBadge level={currentStudent.level} className="w-5 h-5 text-zinc-900" />
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                        Curriculum Stream
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-zinc-950 tracking-tight">
                      {currentStudent.level === '100L' && 'Freshman Foundation & Gateway'}
                      {currentStudent.level === '200L' && 'Intermediate Financial Economics'}
                      {currentStudent.level === '300L' && 'Corporate Finance & SIWES Internship Hub'}
                      {currentStudent.level === '400L' && 'Final Year Capstone, Thesis & Degree Clearance'}
                      {currentStudent.level === 'Postgrad' && 'Postgraduate Research Colloquium'}
                    </h2>
                    <p className="text-xs text-zinc-500 max-w-xl">
                      {currentStudent.level === '100L' &&
                        'Welcome to the Department of Banking & Finance! Complete your course dues to unlock course lecture packets and study groups.'}
                      {currentStudent.level === '200L' &&
                        'Access financial institution syllabi, past question banks, and CIBN Student Membership guidelines.'}
                      {currentStudent.level === '300L' &&
                        'Official banking internship partner attachments (Zenith, Access, GTBank, Central Bank of Nigeria) and corporate finance resources.'}
                      {currentStudent.level === '400L' &&
                        'Your degree clearance sign-off desk, Final Year Project (FYP) supervisor communications, and valedictory preparations.'}
                    </p>
                  </div>

                  <div className="hidden sm:block text-right font-mono text-xs text-zinc-400 shrink-0">
                    <span className="block text-zinc-950 font-semibold text-base">
                      {currentStudent.level}
                    </span>
                    <span>Active Cohort</span>
                  </div>
                </div>

                {/* Level-Specific Service Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Core Academic Syllabus */}
                  <div className="p-5 rounded-xl bg-white border border-black/[0.06] shadow-xs space-y-3 hover:border-zinc-300 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">
                        {currentStudent.level === '100L' && 'BFN 111 & 112 Syllabi'}
                        {currentStudent.level === '200L' && 'BFN 211 & 213 Materials'}
                        {currentStudent.level === '300L' && 'BFN 311 Corporate Finance'}
                        {currentStudent.level === '400L' && 'Final Year Thesis Guidelines'}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        {currentStudent.level === '100L' &&
                          'Fundamental principles of banking, monetary system, and recommended text repos.'}
                        {currentStudent.level === '200L' &&
                          'Financial markets, commercial banking operations, and microeconomics packets.'}
                        {currentStudent.level === '300L' &&
                          'Advanced valuation models, capital budgeting case studies, and corporate financial policy.'}
                        {currentStudent.level === '400L' &&
                          'Departmental project defense criteria, ethical research sign-offs, and supervisor allocation.'}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                      <span>Curriculum Verified</span>
                      <span className="font-mono text-[10px]">PDF / Notes</span>
                    </div>
                  </div>

                  {/* Card 2: Career / Mentorship / Placement */}
                  <div className="p-5 rounded-xl bg-white border border-black/[0.06] shadow-xs space-y-3 hover:border-zinc-300 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">
                        {currentStudent.level === '100L' && 'Freshman Orientation Guide'}
                        {currentStudent.level === '200L' && 'CIBN Student Chapter'}
                        {currentStudent.level === '300L' && 'SIWES Banking Internship'}
                        {currentStudent.level === '400L' && 'Alumni & Graduate Fast-Track'}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        {currentStudent.level === '100L' &&
                          'Student handbook, department executive contacts, and university honor code.'}
                        {currentStudent.level === '200L' &&
                          'Professional banking certification route and examination syllabus registration.'}
                        {currentStudent.level === '300L' &&
                          'Pre-approved financial institutions list: Zenith, Access, CBN, Stanbic IBTC, and SEC.'}
                        {currentStudent.level === '400L' &&
                          'Investment banking interview coaching, corporate finance networks, and alumni directory.'}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                      <span>Professional Link</span>
                      <span className="font-mono text-[10px]">Active</span>
                    </div>
                  </div>

                  {/* Card 3: Academic Adviser & Department Liaison */}
                  <div className="p-5 rounded-xl bg-white border border-black/[0.06] shadow-xs space-y-3 hover:border-zinc-300 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                      <GraduationCap size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">
                        Level Academic Adviser
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        {currentStudent.level === '100L' && 'Dr. O. A. Adetiloye · Level 100 Coordinator'}
                        {currentStudent.level === '200L' && 'Dr. K. S. Babajide · Level 200 Coordinator'}
                        {currentStudent.level === '300L' && 'Dr. F. O. Olokoyo · Level 300 Coordinator'}
                        {currentStudent.level === '400L' && 'Prof. U. R. Efobi · Level 400 Coordinator'}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                      <span>Faculty Liaison</span>
                      <span className="font-mono text-[10px]">CMSS Dept. Office</span>
                    </div>
                  </div>
                </div>

                {/* If student is an executive, show Executive Suite tile */}
                {currentStudent.roleType === 'executive' && (
                  <div className="p-5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkle size={15} weight="fill" className="text-amber-700" />
                        <span className="text-xs font-semibold text-amber-950 uppercase tracking-wide">
                          Executive Council Module
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600">
                        You are authenticated as <strong>{currentStudent.executiveTitle}</strong>. You have privilege access to the departmental administration and clearance registry.
                      </p>
                    </div>
                    <Link
                      href="/admin"
                      className="px-3.5 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium inline-flex items-center gap-1.5 shrink-0 transition-all active:scale-[0.98]"
                    >
                      <span>Open Admin Console</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW TAB 2: FINANCIAL DUES & CLEARANCE CHECKOUT                           */}
            {/* ========================================================================= */}
            {activeTab === 'clearance' && (
              <div className="space-y-6 max-w-2xl mx-auto">
                {activeReceipt ? (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={18} weight="fill" className="text-emerald-700" />
                        <span>You are fully cleared for the {feeConfig.academicSession} session!</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowReceiptModal(true)}
                        className="font-medium text-emerald-800 underline hover:text-emerald-950 cursor-pointer"
                      >
                        Print Credential
                      </button>
                    </div>

                    {/* Show Credential View directly on page */}
                    <BankNoteReceipt transaction={activeReceipt} />
                  </div>
                ) : pendingTx ? (
                  <div className="p-6 rounded-2xl bg-white border border-black/[0.07] shadow-xs space-y-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                      <Clock size={24} className="animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-zinc-950">
                        Transfer Claim Submitted
                      </h3>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        Your direct bank transfer claim ({pendingTx.transferSenderBank} · Ref: {pendingTx.transferSessionId}) is awaiting manual verification by the FINSA Treasury Desk.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-50 font-mono text-xs text-zinc-600 inline-block border border-zinc-200">
                      Tracking Ref: {pendingTx.reference}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Clearance credentials will be automatically released upon verification. You can also view updates in the Admin Console.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-black/[0.08] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-6">
                    <div className="border-b border-zinc-100 pb-4 flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-base font-semibold text-zinc-950 tracking-tight">
                          Departmental Course Dues Assessment
                        </h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Session {feeConfig.academicSession} · Mandated by Department of Banking &amp; Finance
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-zinc-400 block">Assessed Due</span>
                        <span className="text-lg font-bold font-mono text-zinc-950 font-tabular">
                          {formatNaira(currentDueAmount)}
                        </span>
                      </div>
                    </div>

                    {formError && (
                      <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
                        <WarningCircle size={15} />
                        <span>{formError}</span>
                      </div>
                    )}

                    {/* Payment Rail Selector */}
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-zinc-700 block">
                        Select Settlement Rail
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        {feeConfig.enablePaystackRail && (
                          <button
                            type="button"
                            onClick={() => setSelectedRail('paystack')}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              selectedRail === 'paystack'
                                ? 'border-zinc-900 bg-zinc-50/90 ring-1 ring-zinc-900/10'
                                : 'border-zinc-200 hover:border-zinc-300'
                            }`}
                          >
                            <CreditCard size={18} className="text-zinc-800" />
                            <span className="font-semibold text-xs text-zinc-950 block mt-1.5">
                              Instant Paystack
                            </span>
                            <span className="text-[10px] text-zinc-500 block">
                              Card, USSD, Apple Pay
                            </span>
                          </button>
                        )}

                        {feeConfig.enableBankTransferRail && (
                          <button
                            type="button"
                            onClick={() => setSelectedRail('bank_transfer')}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              selectedRail === 'bank_transfer'
                                ? 'border-zinc-900 bg-zinc-50/90 ring-1 ring-zinc-900/10'
                                : 'border-zinc-200 hover:border-zinc-300'
                            }`}
                          >
                            <Bank size={18} className="text-zinc-800" />
                            <span className="font-semibold text-xs text-zinc-950 block mt-1.5">
                              Treasury Transfer
                            </span>
                            <span className="text-[10px] text-zinc-500 block">
                              Direct Bank Transfer
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Paystack Execution Section */}
                    {selectedRail === 'paystack' && (
                      <div className="space-y-4 pt-2">
                        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
                          <p className="font-medium">Direct Instant Credential Issuance</p>
                          <p className="text-blue-700/90 text-[11px] leading-relaxed">
                            Payments through Paystack are verified immediately via cryptographic webhooks, automatically issuing your QR clearance certificate.
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={handlePaystackCheckout}
                          className="w-full py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Confirming Settlement...</span>
                            </>
                          ) : (
                            <>
                              <span>Pay {formatNaira(currentDueAmount)} with Paystack</span>
                              <ArrowRight size={14} />
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Bank Transfer Execution Section */}
                    {selectedRail === 'bank_transfer' && (
                      <form onSubmit={handleBankTransferSubmit} className="space-y-4 pt-2">
                        {/* Official Account Details */}
                        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500">Beneficiary Bank</span>
                            <span className="font-medium text-zinc-900">
                              {feeConfig.departmentalBankName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500">Account Name</span>
                            <span className="font-medium text-zinc-900">
                              {feeConfig.departmentalAccountName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60">
                            <span className="text-zinc-500">Account Number</span>
                            <button
                              type="button"
                              onClick={copyAccountNumber}
                              className="font-mono font-bold text-zinc-950 flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              <span>{feeConfig.departmentalAccountNumber}</span>
                              {copiedAccount ? (
                                <Check size={14} className="text-emerald-600" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label
                              htmlFor="senderBank"
                              className="block text-xs font-medium text-zinc-700"
                            >
                              Sending Bank
                            </label>
                            <input
                              id="senderBank"
                              name="senderBank"
                              type="text"
                              required
                              value={senderBank}
                              onChange={(e) => setSenderBank(e.target.value)}
                              placeholder="e.g. GTBank, Kuda, Zenith"
                              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                          </div>

                          <div className="space-y-1">
                            <label
                              htmlFor="transferSessionId"
                              className="block text-xs font-medium text-zinc-700"
                            >
                              Transaction Reference / Session ID
                            </label>
                            <input
                              id="transferSessionId"
                              name="transferSessionId"
                              type="text"
                              required
                              value={transferSessionId}
                              onChange={(e) => setTransferSessionId(e.target.value)}
                              placeholder="e.g. 1000049281928"
                              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs font-mono bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                        >
                          <span>Submit Transfer Claim</span>
                          <ArrowRight size={14} />
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW TAB 3: ALL DEPARTMENTAL SERVICES (EXPANSIVE INSTITUTIONAL SCOPE)    */}
            {/* ========================================================================= */}
            {activeTab === 'modules' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-zinc-950 tracking-tight">
                    All Departmental Modules &amp; Academic Services
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Integrated platforms operated by the FINSA Executive Council and Department Leadership.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Module 1: Course Dues Clearance (ACTIVE) */}
                  <div
                    onClick={() => setActiveTab('clearance')}
                    className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-3 hover:border-zinc-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <CreditCard size={20} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                        ACTIVE
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-700 transition-colors">
                        Course Dues Clearance
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        Dual-rail financial settlement, digital credential generation, and instant QR verification.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-emerald-800 font-medium">
                      <span>Launch Module</span>
                      <ArrowRight size={13} />
                    </div>
                  </div>

                  {/* Module 2: Course Materials & Syllabi */}
                  <div className="p-5 rounded-2xl bg-zinc-50/60 border border-zinc-200/60 space-y-3 opacity-90">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center">
                        <BookOpen size={20} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                        PHASE 2
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-800">
                        Course Materials &amp; Syllabi
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        Curated departmental lecture repositories, past papers, and financial case studies.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                      <span>Curriculum Office</span>
                      <span>Restricted</span>
                    </div>
                  </div>

                  {/* Module 3: Executive Council Hub */}
                  <div className="p-5 rounded-2xl bg-zinc-50/60 border border-zinc-200/60 space-y-3 opacity-90">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center">
                        <Users size={20} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                        PHASE 2
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-800">
                        FINSA Executive Council
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        Departmental administration, executive portfolios, and general assembly records.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                      <span>Secretariat</span>
                      <span>Restricted</span>
                    </div>
                  </div>

                  {/* Module 4: Academic Calendar */}
                  <div className="p-5 rounded-2xl bg-zinc-50/60 border border-zinc-200/60 space-y-3 opacity-90">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center">
                        <Calendar size={20} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                        PHASE 2
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-800">
                        Academic Calendar &amp; Seminars
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        Departmental colloquiums, public lectures, defense schedules, and guest speakers.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                      <span>Dean's Desk</span>
                      <span>Upcoming</span>
                    </div>
                  </div>

                  {/* Module 5: Internship & SIWES */}
                  <div className="p-5 rounded-2xl bg-zinc-50/60 border border-zinc-200/60 space-y-3 opacity-90">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center">
                        <Briefcase size={20} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                        PHASE 2
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-800">
                        Internship &amp; Placement Hub
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        Industry liaison with commercial banks, asset management firms, and regulatory bodies.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                      <span>Liaison Desk</span>
                      <span>Upcoming</span>
                    </div>
                  </div>

                  {/* Module 6: Research E-Library */}
                  <div className="p-5 rounded-2xl bg-zinc-50/60 border border-zinc-200/60 space-y-3 opacity-90">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center">
                        <Buildings size={20} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                        PHASE 2
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-800">
                        Research &amp; E-Library
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        Direct connection to financial databases, central bank publications, and research archives.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                      <span>CLL Library</span>
                      <span>Upcoming</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Receipt Modal when student clicks "View Credential" */}
      {showReceiptModal && activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl my-8 relative">
            <button
              type="button"
              onClick={() => setShowReceiptModal(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-xs font-mono cursor-pointer flex items-center gap-1"
            >
              <span>Close [ESC]</span>
            </button>
            <BankNoteReceipt transaction={activeReceipt} />
          </div>
        </div>
      )}

      {/* Institutional Precision Footer */}
      <footer className="no-print border-t border-black/[0.06] bg-white py-6 text-xs text-zinc-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-900">FINSA Online</span>
            <span>·</span>
            <span>Finance and Investment Students’ Association</span>
          </div>
          <div className="font-mono text-[11px] text-zinc-400">
            <span>Covenant University · CMSS · Session {feeConfig.academicSession}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
