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
  Users,
  ShieldCheck,
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
  DownloadSimple,
  ChatCircleText,
  TrendUp,
  Buildings,
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
  normalizeIdentifier,
  getActiveSessionStudent,
  setActiveSessionStudent,
  authenticateStudent,
} from '@/lib/ledger-store';
import { BankNoteReceipt } from '@/components/BankNoteReceipt';
import { FinancialTicker } from '@/components/FinancialTicker';
import {
  FinancialGuillocheArt,
  CovenantLaurelShieldArt,
  LevelAestheticBadge,
  AppleLuminousAura,
} from '@/components/LineArtElements';

const POPULAR_BANKS = [
  'Zenith Bank',
  'Guaranty Trust Bank (GTBank)',
  'Access Bank',
  'First Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Kuda Microfinance Bank',
  'OPay / Palmpay',
  'Stanbic IBTC Bank',
  'Covenant Microfinance Bank',
  'Moniepoint Microfinance Bank',
];

// Curated demo personas covering all 4 calibrated cohorts
const DEMO_PERSONAS = [
  {
    identifier: '2601001',
    name: 'Oluwatosin Adebayo',
    level: '100L' as AcademicLevel,
    role: 'regular' as StudentRoleType,
    badgeText: '100L Freshman · Reg No',
    badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  },
  {
    identifier: '25AG037804',
    name: 'Munachimso Ezeife',
    level: '200L' as AcademicLevel,
    role: 'regular' as StudentRoleType,
    badgeText: '200L Sophomore · Cleared',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  },
  {
    identifier: '24AG035109',
    name: 'Kamsiyochukwu Nwosu',
    level: '300L' as AcademicLevel,
    role: 'regular' as StudentRoleType,
    badgeText: '300L Penultimate · Cleared',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  },
  {
    identifier: '22AG031042',
    name: 'Tobiloba Adeyemi',
    level: '400L' as AcademicLevel,
    role: 'executive' as StudentRoleType,
    badgeText: 'FINSA President · 400L',
    badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  },
];

// Departmental Syllabi by Level
const DEPARTMENTAL_SYLLABI: Record<
  AcademicLevel,
  { code: string; title: string; track: 'Finance' | 'FinTech' | 'General'; credits: number; lecturer: string }[]
> = {
  '100L': [
    { code: 'BFN111', title: 'Introduction to Banking & Financial Institutions', track: 'General', credits: 3, lecturer: 'Dr. O. A. Adetiloye' },
    { code: 'FTK111', title: 'Fundamentals of Financial Technologies & Python', track: 'FinTech', credits: 3, lecturer: 'Dr. A. O. Babajide' },
    { code: 'ECN111', title: 'Principles of Economics (Microeconomics)', track: 'General', credits: 3, lecturer: 'Prof. F. O. Olokoyo' },
    { code: 'ACC111', title: 'Introduction to Financial Accounting I', track: 'General', credits: 3, lecturer: 'Dr. K. S. Adegbite' },
  ],
  '200L': [
    { code: 'BFN211', title: 'Money, Banking and Financial Markets', track: 'Finance', credits: 3, lecturer: 'Dr. F. O. Olokoyo' },
    { code: 'FTK211', title: 'Algorithmic Financial Modeling & APIs', track: 'FinTech', credits: 3, lecturer: 'Dr. K. S. Babajide' },
    { code: 'BFN213', title: 'Corporate Finance & Valuation Foundations', track: 'Finance', credits: 3, lecturer: 'Prof. U. R. Efobi' },
    { code: 'FTK213', title: 'Database Architectures for Payment Rails', track: 'FinTech', credits: 3, lecturer: 'Dr. M. E. Agboola' },
  ],
  '300L': [
    { code: 'BFN311', title: 'Commercial Banking Operations & Risk Governance', track: 'Finance', credits: 3, lecturer: 'Prof. U. R. Efobi' },
    { code: 'FTK311', title: 'Decentralized Finance, Smart Contracts & Blockchain', track: 'FinTech', credits: 3, lecturer: 'Dr. O. A. Adetiloye' },
    { code: 'BFN313', title: 'Investment Analysis & Portfolio Management', track: 'Finance', credits: 3, lecturer: 'Dr. K. S. Babajide' },
    { code: 'BFN315', title: 'CIBN Professional Banking Law & Regulations', track: 'General', credits: 2, lecturer: 'Dean of CMSS Office' },
  ],
  '400L': [
    { code: 'BFN411', title: 'Advanced Corporate Restructuring & M&A', track: 'Finance', credits: 3, lecturer: 'Prof. F. O. Olokoyo' },
    { code: 'FTK411', title: 'FinTech Regulatory Sandbox, Open Banking & AI in Finance', track: 'FinTech', credits: 3, lecturer: 'Dr. K. S. Babajide' },
    { code: 'BFN413', title: 'International Finance & Sovereign Debt Markets', track: 'Finance', credits: 3, lecturer: 'Prof. U. R. Efobi' },
    { code: 'BFN499', title: 'Final Year Research Project / Capstone Defense', track: 'General', credits: 6, lecturer: 'Departmental Faculty Board' },
  ],
  'Postgrad': [
    { code: 'BFN811', title: 'Advanced Quantitative Financial Econometrics', track: 'General', credits: 4, lecturer: 'Prof. U. R. Efobi' },
  ],
};

// Executive Council Directory
const EXECUTIVE_COUNCIL = [
  {
    role: 'FINSA President',
    name: 'Adeyemi Oluwatobiloba David',
    matric: '22AG031042',
    level: '400L',
    course: 'Finance',
    initials: 'OA',
    telegram: 'https://t.me/finsacu',
  },
  {
    role: 'Vice President',
    name: 'Bakare Oluwadamilola Faith',
    matric: '23AG033201',
    level: '400L',
    course: 'Finance',
    initials: 'OF',
    telegram: 'https://t.me/finsacu',
  },
  {
    role: 'Financial Secretary',
    name: 'Chukwuemeka Chidinma Claire',
    matric: '22AG031089',
    level: '400L',
    course: 'Finance',
    initials: 'CC',
    telegram: 'https://t.me/finsacu',
  },
  {
    role: 'General Secretary',
    name: 'Ogunleye Inioluwa Emmanuel',
    matric: '23AG033418',
    level: '400L',
    course: 'FinTech',
    initials: 'IE',
    telegram: 'https://t.me/finsacu',
  },
  {
    role: 'Assistant Welfare Director',
    name: 'Osagie Osahon Joshua',
    matric: '24AG035277',
    level: '300L',
    course: 'Finance',
    initials: 'JO',
    telegram: 'https://t.me/finsacu',
  },
  {
    role: 'Director of FinTech & Innovation',
    name: 'Okoro Tobechukwu Samuel',
    matric: '24AG035198',
    level: '300L',
    course: 'FinTech',
    initials: 'TO',
    telegram: 'https://t.me/finsacu',
  },
];

export default function DepartmentalPortalPage() {
  const router = useRouter();
  const [feeConfig, setFeeConfig] = useState<FeeConfig>(INITIAL_FEE_CONFIG);
  const [mounted, setMounted] = useState(false);

  // Authentication State
  const [currentStudent, setCurrentStudent] = useState<StudentRecord | null>(null);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('finsaonline');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active view tab: 'overview' | 'clearance' | 'syllabi' | 'council'
  const [activeTab, setActiveTab] = useState<'overview' | 'clearance' | 'syllabi' | 'council'>('overview');

  // Student Clearance Transaction State
  const [activeReceipt, setActiveReceipt] = useState<TransactionRecord | null>(null);
  const [pendingTx, setPendingTx] = useState<TransactionRecord | null>(null);
  const [selectedRail, setSelectedRail] = useState<'paystack' | 'bank_transfer'>('paystack');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Anti-Fraud Manual Bank Transfer Fields
  const [senderBank, setSenderBank] = useState('Zenith Bank');
  const [senderName, setSenderName] = useState('');
  const [transferSessionId, setTransferSessionId] = useState('');
  const [payerRelationship, setPayerRelationship] = useState('self');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Syllabus Level Filter
  const [syllabusLevel, setSyllabusLevel] = useState<AcademicLevel>('100L');

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
    setSyllabusLevel(student.level);
    const identifier = student.matricNumber || student.regNo;
    const { paidTransaction, pendingTransaction } = lookupStudentByMatric(identifier);
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
    const res = authenticateStudent(loginIdentifier, loginPassword);
    if (!res.success || !res.student) {
      setLoginError(res.error || 'Login failed. Check your registration or matriculation number.');
      return;
    }
    loadStudentContext(res.student);
  };

  const handleQuickPersonaLogin = (identifier: string) => {
    setLoginError('');
    const res = authenticateStudent(identifier, 'finsaonline');
    if (res.success && res.student) {
      loadStudentContext(res.student);
    }
  };

  const handleLogout = () => {
    setActiveSessionStudent(null);
    setCurrentStudent(null);
    setActiveReceipt(null);
    setPendingTx(null);
    setLoginIdentifier('');
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
    setFormSuccess('');

    if (!senderName.trim()) {
      setFormError('Please enter the Depositor / Account Name that sent the transfer.');
      return;
    }

    if (transferSessionId.trim().length < 8) {
      setFormError('Please enter a valid bank transaction reference or session ID (at least 8 characters).');
      return;
    }

    const res = submitBankTransferClaim({
      student: currentStudent,
      senderName,
      senderBank,
      sessionId: transferSessionId,
      payerRelationship,
    });

    if (!res.success || !res.transaction) {
      setFormError(res.error || 'Failed to submit transfer claim.');
      return;
    }

    setPendingTx(res.transaction);
    setActiveReceipt(null);
    setFormSuccess('Transfer proof submitted. The FINSA Treasury Desk will reconcile and issue your clearance pass.');
    setSenderName('');
    setTransferSessionId('');
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

      {/* Wall Street & FinTech Market Ticker Marquee */}
      <FinancialTicker />

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

            <a
              href="https://t.me/finsacu"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1 text-zinc-500 hover:text-blue-600 font-medium transition-colors"
            >
              <ChatCircleText size={14} className="text-blue-500" />
              <span>Telegram Hub</span>
            </a>

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
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 flex-1">
        {/* ========================================================================= */}
        {/* CASE 1: NOT LOGGED IN - DUAL-KEY STUDENT AUTHENTICATION GATEWAY           */}
        {/* ========================================================================= */}
        {!currentStudent ? (
          <div className="space-y-8 py-2 max-w-4xl mx-auto">
            {/* Luminous Header & Guilloché Accent */}
            <div className="text-center space-y-3 relative pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100/80 shadow-xs">
                <Sparkle size={13} weight="fill" className="text-blue-600" />
                <span>Department of Banking &amp; Finance · CMSS</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
                Student Gateway &amp; Clearance Hub
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-lg mx-auto leading-relaxed">
                Sign in using your <strong>Registration Number</strong> (100L Freshmen) or <strong>Matriculation Number</strong> (200L–400L) to access your personalized course dues, syllabi, and clearance credential.
              </p>

              {/* Sophisticated Guilloché SVG Line Art */}
              <div className="pt-1 pb-1 overflow-hidden opacity-80">
                <FinancialGuillocheArt className="w-full h-14 sm:h-18 text-blue-600/40" />
              </div>
            </div>

            {/* Interactive Sign-In Card */}
            <div className="max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-2xl border border-black/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8 space-y-6">
              <div className="border-b border-zinc-100 pb-3">
                <h2 className="text-base font-semibold text-zinc-950 tracking-tight">
                  Student Portal Login
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Accepts either 7-digit Reg. No. or Matriculation No.
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
                    htmlFor="loginIdentifier"
                    className="block text-xs font-medium text-zinc-700"
                  >
                    Registration No. (100L) or Matric No.
                  </label>
                  <div className="relative">
                    <input
                      id="loginIdentifier"
                      name="loginIdentifier"
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value.toUpperCase())}
                      placeholder="e.g. 2601001 or 25AG032080"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-950 text-sm font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-tabular"
                    />
                  </div>
                  <span className="text-[11px] text-zinc-400 block">
                    100L freshmen can enter their 7-digit Reg No (e.g. 2601001).
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="loginPassword"
                      className="font-medium text-zinc-700"
                    >
                      Portal Security PIN / Password
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
                  <span>Access Departmental Portal</span>
                  <ArrowRight size={14} />
                </button>
              </form>

              {/* Quick Persona Picker for 1-Click Verification */}
              <div className="pt-4 border-t border-zinc-100 space-y-2.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
                  Quick Demo Access (1-Click Cohort Personas)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEMO_PERSONAS.map((p) => (
                    <button
                      key={p.identifier}
                      type="button"
                      onClick={() => handleQuickPersonaLogin(p.identifier)}
                      className="text-left p-2.5 rounded-lg border border-zinc-200/80 bg-zinc-50/70 hover:bg-zinc-100 hover:border-zinc-300 transition-all cursor-pointer group active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-zinc-900 group-hover:text-blue-600 transition-colors">
                          {p.name.split(' ')[0]}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">{p.identifier}</span>
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

            {/* Departmental Accreditation & Community Footnote */}
            <div className="text-center text-xs text-zinc-400 space-y-1.5">
              <p>Covenant University · College of Management and Social Sciences (CMSS)</p>
              <div className="flex items-center justify-center gap-3 text-[11px]">
                <span>CIBN Accredited Program</span>
                <span>·</span>
                <a
                  href="https://t.me/finsacu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <span>Official Telegram: @finsacu</span>
                  <ArrowUpRight size={11} />
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CASE 2: LOGGED IN - BESPOKE PERSONALIZED STUDENT PORTAL                   */
          /* ========================================================================= */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Student Identity Dossier & Personal Welcome */}
            <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-black/[0.07] p-5 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="w-13 h-13 rounded-2xl bg-zinc-950 text-white flex items-center justify-center font-semibold text-lg tracking-tight shadow-sm shrink-0 border border-white/10">
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
                      {currentStudent.matricNumber ? (
                        <>
                          <span className="text-zinc-900 font-semibold">{currentStudent.matricNumber}</span>
                          <span>·</span>
                          <span className="text-zinc-400">Reg: {currentStudent.regNo}</span>
                        </>
                      ) : (
                        <span className="text-blue-700 font-semibold">Reg No: {currentStudent.regNo} (100L Freshman)</span>
                      )}
                      <span>·</span>
                      <span className="text-blue-700 font-medium">{currentStudent.level} Scholar</span>
                      <span>·</span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-sans font-medium text-[10px]">
                        {currentStudent.course || 'Finance'} Track
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Clearance Status Pill */}
                <div className="flex items-center gap-3">
                  {activeReceipt ? (
                    <div className="flex items-center gap-3 bg-emerald-50/80 border border-emerald-200/80 px-4 py-2.5 rounded-xl">
                      <CheckCircle size={22} weight="fill" className="text-emerald-600 shrink-0" />
                      <div className="text-left">
                        <div className="font-semibold text-xs text-emerald-950">
                          Clearance Granted
                        </div>
                        <div className="font-mono text-[11px] text-emerald-700">
                          {activeReceipt.receiptNumber}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowReceiptModal(true)}
                        className="ml-2 px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors cursor-pointer"
                      >
                        View Pass
                      </button>
                    </div>
                  ) : pendingTx ? (
                    <div className="flex items-center gap-3 bg-amber-50/80 border border-amber-200/80 px-4 py-2.5 rounded-xl">
                      <Clock size={22} className="text-amber-600 shrink-0 animate-spin" />
                      <div className="text-left">
                        <div className="font-semibold text-xs text-amber-950">
                          Verification Pending
                        </div>
                        <div className="font-mono text-[11px] text-amber-700">
                          {pendingTx.reference}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab('clearance')}
                      className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium inline-flex items-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <CreditCard size={15} />
                      <span>Pay {formatNaira(currentDueAmount)} Dues</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-zinc-100 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'overview'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  Portal Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('clearance')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'clearance'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <span>Course Dues &amp; Clearance</span>
                  {activeReceipt ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('syllabi')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'syllabi'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  Course Syllabi &amp; Curriculum
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('council')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'council'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  Executive Council Directory
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* VIEW TAB 1: OVERVIEW DASHBOARD                                            */}
            {/* ========================================================================= */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 3 Academic Pillars for the Scholar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Pillar 1: Level Status & Course Track */}
                  <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                        <GraduationCap size={18} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                        {currentStudent.level}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">
                        {currentStudent.course || 'Banking & Finance'} Program
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        Enrolled in the College of Management &amp; Social Sciences. Chartered Institute of Bankers of Nigeria accredited syllabus.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                      <span>Curriculum Status</span>
                      <span className="font-mono text-emerald-600 font-medium">In Good Standing</span>
                    </div>
                  </div>

                  {/* Pillar 2: Financial Clearance Status */}
                  <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <CreditCard size={18} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {activeReceipt ? 'VERIFIED' : pendingTx ? 'IN REVIEW' : 'PENDING'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">
                        Session {feeConfig.academicSession} Dues
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        {activeReceipt
                          ? 'Departmental dues fully reconciled. Official QR examination pass issued.'
                          : pendingTx
                          ? 'Bank transfer claim currently undergoing verification by FINSA Treasury.'
                          : `Assessed mandatory dues: ${formatNaira(currentDueAmount)}. Dual-rail settlement available.`}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                      <button
                        type="button"
                        onClick={() => setActiveTab('clearance')}
                        className="text-blue-600 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>{activeReceipt ? 'View Credential' : 'Open Payment Desk'}</span>
                        <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Pillar 3: Department Academic Liaison */}
                  <div className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                        <Buildings size={18} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        CMSS FACULTY
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">
                        Level Academic Coordinator
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        {currentStudent.level === '100L' && 'Dr. O. A. Adetiloye · Level 100 Coordinator & Freshman Mentor'}
                        {currentStudent.level === '200L' && 'Dr. K. S. Babajide · Level 200 Coordinator & FinTech Lead'}
                        {currentStudent.level === '300L' && 'Dr. F. O. Olokoyo · Level 300 Coordinator & CIBN Liaison'}
                        {currentStudent.level === '400L' && 'Prof. U. R. Efobi · Level 400 Final Year Capstone Chair'}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                      <span>Office: CMSS 3rd Floor</span>
                      <a href="https://t.me/finsacu" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Contact via Telegram
                      </a>
                    </div>
                  </div>
                </div>

                {/* Executive Suite Quick Action if student has executive rank */}
                {currentStudent.roleType === 'executive' && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkle size={15} weight="fill" className="text-amber-700" />
                        <span className="text-xs font-semibold text-amber-950 uppercase tracking-wide">
                          Executive Council Console Access
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600">
                        Authenticated as <strong>{currentStudent.executiveTitle}</strong>. You hold administrative clearance and student roster review privileges.
                      </p>
                    </div>
                    <Link
                      href="/admin"
                      className="px-3.5 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium inline-flex items-center gap-1.5 shrink-0 transition-all active:scale-[0.98]"
                    >
                      <span>Open Admin Back Office</span>
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
                        <span>You are fully cleared for the {feeConfig.academicSession} academic session!</span>
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
                        Transfer Claim Under Review
                      </h3>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        Your direct bank transfer claim ({pendingTx.transferSenderBank} · Session ID: {pendingTx.transferSessionId}) is awaiting manual verification by the FINSA Treasury Desk.
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
                      <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200 flex items-start gap-2">
                        <WarningCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                        <span>{formError}</span>
                      </div>
                    )}

                    {formSuccess && (
                      <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                        <span>{formSuccess}</span>
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

                    {/* Bank Transfer Execution Section with Anti-Fraud Verification Fields */}
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

                        {/* Anti-Fraud Dossier Form Fields */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label htmlFor="senderBank" className="block text-xs font-medium text-zinc-700">
                                Sending Bank
                              </label>
                              <select
                                id="senderBank"
                                value={senderBank}
                                onChange={(e) => setSenderBank(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                              >
                                {POPULAR_BANKS.map((b) => (
                                  <option key={b} value={b}>
                                    {b}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label htmlFor="payerRelationship" className="block text-xs font-medium text-zinc-700">
                                Payer Relationship
                              </label>
                              <select
                                id="payerRelationship"
                                value={payerRelationship}
                                onChange={(e) => setPayerRelationship(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                              >
                                <option value="self">My Personal Account</option>
                                <option value="parent">Parent / Guardian</option>
                                <option value="sponsor">Sponsor / Relative</option>
                                <option value="other">Third-Party Agent</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label htmlFor="senderName" className="block text-xs font-medium text-zinc-700">
                              Depositor / Sender Account Name (as shown on debit alert)
                            </label>
                            <input
                              id="senderName"
                              name="senderName"
                              type="text"
                              required
                              value={senderName}
                              onChange={(e) => setSenderName(e.target.value)}
                              placeholder="e.g. Mr. Olusegun Adebayo"
                              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                            <span className="text-[10px] text-zinc-400 block">
                              Enables admin to match third-party transfers made by parents or sponsors.
                            </span>
                          </div>

                          <div className="space-y-1">
                            <label htmlFor="transferSessionId" className="block text-xs font-medium text-zinc-700">
                              Bank Session ID / NIP Transaction Reference
                            </label>
                            <input
                              id="transferSessionId"
                              name="transferSessionId"
                              type="text"
                              required
                              value={transferSessionId}
                              onChange={(e) => setTransferSessionId(e.target.value.toUpperCase())}
                              placeholder="e.g. 000015261108091522"
                              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs font-mono bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                            <span className="text-[10px] text-zinc-400 block">
                              Unique 12-30 digit reference. Duplicate session IDs are automatically rejected.
                            </span>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                        >
                          <span>Submit Transfer Claim for Verification</span>
                          <ArrowRight size={14} />
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW TAB 3: COURSE SYLLABI & CURRICULUM REPOSITORY                        */}
            {/* ========================================================================= */}
            {activeTab === 'syllabi' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-950 tracking-tight">
                      Departmental Course Syllabi &amp; Curriculum Outline
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Curated lecture outlines, credit allocations, and faculty contacts across levels.
                    </p>
                  </div>

                  {/* Level Switcher */}
                  <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl self-start sm:self-auto text-xs font-mono">
                    {(['100L', '200L', '300L', '400L'] as AcademicLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSyllabusLevel(lvl)}
                        className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                          syllabusLevel === lvl
                            ? 'bg-white text-zinc-950 shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-950'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Course List for Selected Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DEPARTMENTAL_SYLLABI[syllabusLevel]?.map((course) => (
                    <div
                      key={course.code}
                      className="p-5 rounded-2xl bg-white border border-black/[0.07] shadow-xs space-y-3 hover:border-zinc-300 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-zinc-950 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                          {course.code}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            course.track === 'FinTech'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : course.track === 'Finance'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}
                        >
                          {course.track} Track
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900 leading-snug">
                          {course.title}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1">
                          Instructor: {course.lecturer}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                        <span>{course.credits} Academic Credit Units</span>
                        <a
                          href="https://t.me/finsacu"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium text-[11px]"
                        >
                          <span>Lecture Notes</span>
                          <ArrowUpRight size={11} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW TAB 4: EXECUTIVE COUNCIL DIRECTORY & SECRETARIAT                     */}
            {/* ========================================================================= */}
            {activeTab === 'council' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-zinc-950 tracking-tight">
                    FINSA Executive Council &amp; Secretariat
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Official student leadership serving the Department of Banking &amp; Finance for the 2026/2027 Session.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {EXECUTIVE_COUNCIL.map((exec) => (
                    <div
                      key={exec.matric}
                      className="p-5 rounded-2xl bg-white border border-black/[0.07] shadow-xs space-y-3 hover:border-zinc-300 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs tracking-tight">
                          {exec.initials}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-zinc-950">
                            {exec.role}
                          </h3>
                          <p className="text-[11px] font-mono text-zinc-400">
                            {exec.level} · {exec.course}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-100">
                        <span className="font-semibold text-xs text-zinc-900 block">
                          {exec.name}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-400 block mt-0.5">
                          Matric: {exec.matric}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-zinc-400 font-mono">Council Office</span>
                        <a
                          href={exec.telegram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium text-[11px] inline-flex items-center gap-1"
                        >
                          <ChatCircleText size={13} />
                          <span>Telegram</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Receipt Modal when student clicks "View Pass" */}
      {showReceiptModal && activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
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
          <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
            <span>Covenant University · CMSS · Session {feeConfig.academicSession}</span>
            <span>·</span>
            <a
              href="https://t.me/finsacu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Telegram: @finsacu
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
