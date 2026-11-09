'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Bank,
  Copy,
  Check,
  UserCheck,
  WarningCircle,
  ArrowCounterClockwise,
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
} from '@/lib/ledger-store';
import { BankNoteReceipt } from '@/components/BankNoteReceipt';

const LEVELS: AcademicLevel[] = ['100L', '200L', '300L', '400L', 'Postgrad'];

export default function DepartmentalPortalPage() {
  const router = useRouter();
  const [feeConfig, setFeeConfig] = useState<FeeConfig>(INITIAL_FEE_CONFIG);
  const [mounted, setMounted] = useState(false);

  // Active view: 'hub' (all portal modules) or 'clearance' (dues module)
  const [activeTab, setActiveTab] = useState<'hub' | 'clearance'>('clearance');

  // Lookup & Identity State
  const [matricInput, setMatricInput] = useState('');
  const [lookupPerformed, setLookupPerformed] = useState(false);
  const [matchedRosterStudent, setMatchedRosterStudent] = useState<StudentRecord | null>(null);

  // Student Profile Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState<AcademicLevel>('400L');
  const [roleType, setRoleType] = useState<StudentRoleType>('regular');
  const [executiveTitle, setExecutiveTitle] = useState('');

  // Transaction State
  const [activeReceipt, setActiveReceipt] = useState<TransactionRecord | null>(null);
  const [pendingTx, setPendingTx] = useState<TransactionRecord | null>(null);
  const [selectedRail, setSelectedRail] = useState<'paystack' | 'bank_transfer'>('paystack');
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual Bank Transfer Fields
  const [senderBank, setSenderBank] = useState('');
  const [transferSessionId, setTransferSessionId] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const cfg = getFeeConfig();
    setFeeConfig(cfg);
    if (!cfg.enablePaystackRail && cfg.enableBankTransferRail) {
      setSelectedRail('bank_transfer');
    }
    setMounted(true);
  }, []);

  const handleMatricLookup = (e?: React.FormEvent, overrideMatric?: string) => {
    if (e) e.preventDefault();
    setFormError('');
    const targetMatric = normalizeMatric(overrideMatric ?? matricInput);

    if (targetMatric.length < 5) {
      setFormError('Enter a valid matriculation number (e.g. 22AG031042).');
      return;
    }

    setMatricInput(targetMatric);
    const { student, paidTransaction, pendingTransaction } = lookupStudentByMatric(targetMatric);
    setLookupPerformed(true);

    if (student) {
      setMatchedRosterStudent(student);
      setFullName(student.fullName);
      setEmail(student.email);
      setLevel(student.level);
      setRoleType(student.roleType);
      setExecutiveTitle(student.executiveTitle || '');
    } else {
      setMatchedRosterStudent(null);
      if (targetMatric.startsWith('22')) setLevel('400L');
      else if (targetMatric.startsWith('23')) setLevel('300L');
      else if (targetMatric.startsWith('24')) setLevel('200L');
      else if (targetMatric.startsWith('25')) setLevel('100L');
    }

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
  };

  const quickFillSample = (sampleMatric: string) => {
    setMatricInput(sampleMatric);
    handleMatricLookup(undefined, sampleMatric);
  };

  const currentDueAmount =
    roleType === 'executive' ? feeConfig.executiveAmountNaira : feeConfig.regularAmountNaira;

  const validateStudentIdentity = (): StudentRecord | null => {
    const cleanMatric = normalizeMatric(matricInput);
    if (cleanMatric.length < 5) {
      setFormError('Enter a valid matriculation number.');
      return null;
    }
    if (fullName.trim().length < 3) {
      setFormError('Enter your full legal name.');
      return null;
    }
    if (!email.includes('@')) {
      setFormError('Enter a valid university email address.');
      return null;
    }
    if (roleType === 'executive' && executiveTitle.trim().length < 2) {
      setFormError('Specify your executive portfolio.');
      return null;
    }

    return upsertStudent({
      matricNumber: cleanMatric,
      fullName,
      email,
      level,
      roleType,
      executiveTitle: roleType === 'executive' ? executiveTitle : undefined,
    });
  };

  const handlePaystackCheckout = () => {
    setFormError('');
    const student = validateStudentIdentity();
    if (!student) return;

    setIsProcessing(true);
    setTimeout(() => {
      const verifiedTx = recordVerifiedPaystackPayment({ student });
      setIsProcessing(false);
      setActiveReceipt(verifiedTx);
      setPendingTx(null);
    }, 700);
  };

  const handleBankTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const student = validateStudentIdentity();
    if (!student) return;

    if (senderBank.trim().length < 2) {
      setFormError('Enter the name of your sending bank.');
      return;
    }
    if (transferSessionId.trim().length < 5) {
      setFormError('Enter the bank transaction reference or session ID.');
      return;
    }

    const tx = submitBankTransferClaim({
      student,
      senderBank,
      sessionId: transferSessionId,
    });

    if (tx.status === 'success') {
      setActiveReceipt(tx);
    } else {
      setPendingTx(tx);
    }
  };

  const resetLookup = () => {
    setLookupPerformed(false);
    setActiveReceipt(null);
    setPendingTx(null);
    setMatchedRosterStudent(null);
    setMatricInput('');
    setFullName('');
    setEmail('');
    setExecutiveTitle('');
    setFormError('');
  };

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(feeConfig.departmentalAccountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-[#FAFAFA] text-[#09090B]">
      {/* Precision Institutional Navbar */}
      <header className="no-print border-b border-zinc-200 bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto h-14 px-4 sm:px-6 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <Link href="/" onClick={() => setActiveTab('hub')} className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <span className="font-mono font-bold text-xs tracking-wider bg-zinc-950 text-white px-2 py-0.5 rounded">
                FINSA
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-semibold text-zinc-950 text-sm tracking-tight">Portal</span>
                <span className="text-zinc-400">/</span>
                <span className="text-zinc-600 font-medium hidden sm:inline">Dept. of Banking &amp; Finance</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>{feeConfig.academicSession}</span>
            </div>

            <Link
              href="/verify/FINSA-26-00101"
              className="text-zinc-600 hover:text-zinc-950 transition-colors hidden sm:block px-2"
            >
              Verify Credential
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-900 hover:bg-zinc-50 font-medium transition-colors"
            >
              <span>Admin Console</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Portal View */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Departmental Banner */}
        <div className="border-b border-zinc-200/80 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider">
              <span>Covenant University</span>
              <span>·</span>
              <span>College of Management &amp; Social Sciences</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
              Department of Banking &amp; Finance
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
              Official student platform for departmental dues, clearance verification, academic administration, and student services.
            </p>
          </div>

          {/* Quick Segmented View Mode */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg text-xs font-medium self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('clearance')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'clearance'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Course Dues Clearance
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hub')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'hub'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              All Portal Modules
            </button>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: ALL PORTAL MODULES (The Broad Departmental Portal Grid)
           ========================================================================= */}
        {activeTab === 'hub' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-zinc-950">Departmental Services &amp; Modules</h2>
                <p className="text-xs text-zinc-500">Core operational modules for undergraduate and postgraduate finance students.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tile 1: Course Dues & Financial Clearance (ACTIVE) */}
              <div
                onClick={() => setActiveTab('clearance')}
                className="group relative rounded-xl border-2 border-zinc-950 bg-white p-5 space-y-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Active · Test 1 Clearance
                    </span>
                    <ArrowRight size={16} className="text-zinc-400 group-hover:text-zinc-950 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-950 group-hover:text-zinc-900">
                      Course Dues &amp; Financial Clearance
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Mandatory dues assessment, instant checkout via Paystack or direct bank transfer, and cryptographic certificate issuance.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Regular: ₦10,000</span>
                  <span className="font-medium text-zinc-950">Open Now →</span>
                </div>
              </div>

              {/* Tile 2: Course Registration & Syllabi */}
              <div className="rounded-xl border border-zinc-200 bg-white/70 p-5 space-y-4 flex flex-col justify-between opacity-85">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 bg-zinc-100">
                      <Lock size={12} />
                      Phase 2 · In Development
                    </span>
                    <BookOpen size={17} className="text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-900">Course Materials &amp; Syllabi</h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Access lecture notes, course packs, reading lists, and previous examination question archives.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-zinc-100 text-[11px] text-zinc-400 font-mono">
                  Available post-clearance
                </div>
              </div>

              {/* Tile 3: FINSA Executive Council */}
              <div className="rounded-xl border border-zinc-200 bg-white/70 p-5 space-y-4 flex flex-col justify-between opacity-85">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 bg-zinc-100">
                      <Lock size={12} />
                      Phase 2 · In Development
                    </span>
                    <Users size={17} className="text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-900">FINSA Executive Council</h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Executive committee directory, departmental constitution, budget reports, and student congress resolutions.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-zinc-100 text-[11px] text-zinc-400 font-mono">
                  Available post-clearance
                </div>
              </div>

              {/* Tile 4: Academic Calendar & Seminars */}
              <div className="rounded-xl border border-zinc-200 bg-white/70 p-5 space-y-4 flex flex-col justify-between opacity-85">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 bg-zinc-100">
                      <Lock size={12} />
                      Phase 2 · In Development
                    </span>
                    <Calendar size={17} className="text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-900">Academic Calendar &amp; Seminars</h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Departmental timetable, test schedules, guest executive lecture series, and the annual FINSA banking conference.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-zinc-100 text-[11px] text-zinc-400 font-mono">
                  Scheduled for Semester Week 4
                </div>
              </div>

              {/* Tile 5: Internship & Placement Hub */}
              <div className="rounded-xl border border-zinc-200 bg-white/70 p-5 space-y-4 flex flex-col justify-between opacity-85">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 bg-zinc-100">
                      <Lock size={12} />
                      Phase 2 · In Development
                    </span>
                    <Briefcase size={17} className="text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-900">Internship &amp; Placement Hub</h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      SIWES internships, commercial banking recruitment pipeline, fintech mentorship, and CV review network.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-zinc-100 text-[11px] text-zinc-400 font-mono">
                  Scheduled for Alpha Semester
                </div>
              </div>

              {/* Tile 6: Departmental Research & E-Library */}
              <div className="rounded-xl border border-zinc-200 bg-white/70 p-5 space-y-4 flex flex-col justify-between opacity-85">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 bg-zinc-100">
                      <Lock size={12} />
                      Phase 2 · In Development
                    </span>
                    <Buildings size={17} className="text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-900">Finance Research &amp; E-Library</h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Undergraduate thesis archive, CBN statistical bulletins, Bloomberg terminal booking, and academic papers.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-zinc-100 text-[11px] text-zinc-400 font-mono">
                  Scheduled for Omega Semester
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: COURSE DUES & CLEARANCE (The High-Priority Live Module)
           ========================================================================= */}
        {activeTab === 'clearance' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Context Navigation Strip */}
            <div className="flex items-center justify-between text-xs pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('hub')}
                  className="text-zinc-500 hover:text-zinc-950 hover:underline"
                >
                  ← Back to Portal Overview
                </button>
                <span className="text-zinc-300">/</span>
                <span className="font-medium text-zinc-950">Course Dues &amp; Financial Clearance</span>
              </div>
            </div>

            {/* PRIMARY SUBVIEW A: Issued Credential */}
            {activeReceipt ? (
              <div className="max-w-xl mx-auto space-y-6">
                <div className="no-print p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} weight="fill" className="text-emerald-700 shrink-0" />
                    <span>Clearance verified and recorded on master ledger.</span>
                  </div>
                  <span className="font-mono font-semibold">{activeReceipt.receiptNumber}</span>
                </div>

                <BankNoteReceipt transaction={activeReceipt} />

                <div className="no-print text-center pt-2">
                  <button
                    type="button"
                    onClick={resetLookup}
                    className="text-xs text-zinc-500 hover:text-zinc-950 hover:underline cursor-pointer"
                  >
                    ← Check or clear another student
                  </button>
                </div>
              </div>
            ) : (
              /* PRIMARY SUBVIEW B: The Clearance Register */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Side (7 cols): The Functional Assessment Form */}
                <div className="lg:col-span-7 rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs space-y-6">
                  {/* Step 1: Matriculation Lookup */}
                  <form onSubmit={(e) => handleMatricLookup(e)} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="matric-input" className="block text-xs font-medium text-zinc-700">
                        Matriculation Number
                      </label>
                      {lookupPerformed && (
                        <button
                          type="button"
                          onClick={resetLookup}
                          className="text-xs text-zinc-500 hover:text-zinc-950 hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        id="matric-input"
                        name="matricNumber"
                        type="text"
                        value={matricInput}
                        onChange={(e) => setMatricInput(e.target.value.toUpperCase())}
                        placeholder="e.g. 22AG031042"
                        className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 font-mono text-sm uppercase text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-zinc-950 text-white text-xs font-medium hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                      >
                        Lookup
                      </button>
                    </div>

                    {!lookupPerformed && (
                      <div className="pt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                        <span>Test Profiles:</span>
                        <button
                          type="button"
                          onClick={() => quickFillSample('22AG031140')}
                          className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
                        >
                          22AG031140 (Regular)
                        </button>
                        <button
                          type="button"
                          onClick={() => quickFillSample('23AG033418')}
                          className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
                        >
                          23AG033418 (Executive)
                        </button>
                        <button
                          type="button"
                          onClick={() => quickFillSample('22AG031042')}
                          className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer"
                        >
                          22AG031042 (Paid)
                        </button>
                      </div>
                    )}
                  </form>

                  {formError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                      {formError}
                    </div>
                  )}

                  {/* Pending Alert */}
                  {lookupPerformed && pendingTx && (
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                      <p className="font-semibold">Transfer Awaiting Verification</p>
                      <p className="text-zinc-600">
                        Payment claim of {formatNaira(pendingTx.amountNaira)} ({pendingTx.transferSenderBank} · Ref: {pendingTx.transferSessionId}) was submitted. It will unlock once verified by the Financial Secretary.
                      </p>
                    </div>
                  )}

                  {/* Step 2: Student Identity & Dues Assessment */}
                  {lookupPerformed && !pendingTx && (
                    <div className="space-y-5 pt-4 border-t border-zinc-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-700">Student Profile</span>
                        {matchedRosterStudent ? (
                          <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                            Roster Verified
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                            Unlisted Student
                          </span>
                        )}
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label htmlFor="student-name" className="block text-zinc-600 mb-1">
                            Full Legal Name
                          </label>
                          <input
                            id="student-name"
                            name="studentName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Afolabi Ayomide Samuel"
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs text-zinc-900 focus:border-zinc-950 focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="student-email" className="block text-zinc-600 mb-1">
                              University Email
                            </label>
                            <input
                              id="student-email"
                              name="studentEmail"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="name@stu.cu.edu.ng"
                              className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs text-zinc-900 focus:border-zinc-950 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label htmlFor="student-level" className="block text-zinc-600 mb-1">
                              Level
                            </label>
                            <select
                              id="student-level"
                              name="studentLevel"
                              value={level}
                              onChange={(e) => setLevel(e.target.value as AcademicLevel)}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs text-zinc-900 focus:border-zinc-950 focus:outline-none bg-white"
                            >
                              {LEVELS.map((lvl) => (
                                <option key={lvl} value={lvl}>
                                  {lvl} · Banking &amp; Finance
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-zinc-600 mb-1.5">Clearance Classification</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setRoleType('regular')}
                              className={`py-2 px-3 rounded-lg border text-xs text-left transition-colors cursor-pointer ${
                                roleType === 'regular'
                                  ? 'border-zinc-950 bg-zinc-950 text-white'
                                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                              }`}
                            >
                              <p className="font-semibold">Regular Student</p>
                              <p className={`text-[11px] font-mono mt-0.5 ${roleType === 'regular' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                {mounted ? formatNaira(feeConfig.regularAmountNaira) : '₦10,000'}
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRoleType('executive')}
                              className={`py-2 px-3 rounded-lg border text-xs text-left transition-colors cursor-pointer ${
                                roleType === 'executive'
                                  ? 'border-zinc-950 bg-zinc-950 text-white'
                                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                              }`}
                            >
                              <p className="font-semibold">Executive Council</p>
                              <p className={`text-[11px] font-mono mt-0.5 ${roleType === 'executive' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                {mounted ? formatNaira(feeConfig.executiveAmountNaira) : '₦15,000'}
                              </p>
                            </button>
                          </div>
                        </div>

                        {roleType === 'executive' && (
                          <div>
                            <label htmlFor="exec-title" className="block text-zinc-600 mb-1">
                              Executive Office / Portfolio
                            </label>
                            <input
                              id="exec-title"
                              name="execTitle"
                              type="text"
                              value={executiveTitle}
                              onChange={(e) => setExecutiveTitle(e.target.value)}
                              placeholder="e.g. Financial Secretary, Vice President"
                              className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs text-zinc-900 focus:border-zinc-950 focus:outline-none"
                            />
                          </div>
                        )}
                      </div>

                      {/* Assessment Breakdown Box */}
                      <div className="rounded-lg bg-zinc-50 border border-zinc-200/80 p-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-zinc-600">
                          <span>Departmental Dues ({feeConfig.academicSession})</span>
                          <span className="font-mono text-zinc-900">
                            {mounted ? formatNaira(currentDueAmount) : '₦10,000'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-semibold text-zinc-950 pt-2 border-t border-zinc-200">
                          <span>Total Amount Due</span>
                          <span className="font-mono text-sm font-bold font-tabular">
                            {mounted ? formatNaira(currentDueAmount) : '₦10,000'}
                          </span>
                        </div>
                      </div>

                      {/* Payment Rails */}
                      <div className="space-y-3 pt-1">
                        <div className="flex rounded-lg bg-zinc-100 p-1 text-xs">
                          {feeConfig.enablePaystackRail && (
                            <button
                              type="button"
                              onClick={() => setSelectedRail('paystack')}
                              className={`flex-1 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                                selectedRail === 'paystack'
                                  ? 'bg-white text-zinc-950 shadow-xs'
                                  : 'text-zinc-600 hover:text-zinc-950'
                              }`}
                            >
                              Instant Checkout
                            </button>
                          )}
                          {feeConfig.enableBankTransferRail && (
                            <button
                              type="button"
                              onClick={() => setSelectedRail('bank_transfer')}
                              className={`flex-1 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                                selectedRail === 'bank_transfer'
                                  ? 'bg-white text-zinc-950 shadow-xs'
                                  : 'text-zinc-600 hover:text-zinc-950'
                              }`}
                            >
                              Bank Transfer
                            </button>
                          )}
                        </div>

                        {selectedRail === 'paystack' && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={handlePaystackCheckout}
                            className="w-full py-2.5 rounded-lg bg-zinc-950 text-white text-xs font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                          >
                            {isProcessing
                              ? 'Verifying with payment gateway...'
                              : `Pay ${formatNaira(currentDueAmount)} & Generate Credential`}
                          </button>
                        )}

                        {selectedRail === 'bank_transfer' && (
                          <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3 text-xs">
                            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                              <div>
                                <p className="text-[11px] text-zinc-500">{feeConfig.departmentalBankName}</p>
                                <p className="font-mono font-bold text-sm text-zinc-950 mt-0.5">
                                  {feeConfig.departmentalAccountNumber}
                                </p>
                                <p className="text-[11px] text-zinc-500">{feeConfig.departmentalAccountName}</p>
                              </div>
                              <button
                                type="button"
                                onClick={copyAccountNumber}
                                className="px-2.5 py-1 rounded border border-zinc-200 font-mono text-[11px] text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                              >
                                {copiedAccount ? 'Copied' : 'Copy'}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label htmlFor="sender-bank" className="block text-zinc-600 text-[11px] mb-1">
                                  Sending Bank
                                </label>
                                <input
                                  id="sender-bank"
                                  name="senderBank"
                                  type="text"
                                  value={senderBank}
                                  onChange={(e) => setSenderBank(e.target.value)}
                                  placeholder="e.g. GTBank, Zenith"
                                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 text-xs focus:border-zinc-950 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label htmlFor="session-id" className="block text-zinc-600 text-[11px] mb-1">
                                  Session ID / Reference
                                </label>
                                <input
                                  id="session-id"
                                  name="sessionId"
                                  type="text"
                                  value={transferSessionId}
                                  onChange={(e) => setTransferSessionId(e.target.value)}
                                  placeholder="e.g. 00001326..."
                                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 font-mono text-xs focus:border-zinc-950 focus:outline-none"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={handleBankTransferSubmit}
                              className="w-full py-2 rounded-lg bg-zinc-950 text-white text-xs font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              Submit Transfer Reference
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side (5 cols): Guidelines & Fast Check */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Fast Verify Widget */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-2.5 text-xs shadow-xs">
                    <span className="font-semibold text-zinc-950 block">Quick Credential Verification</span>
                    <p className="text-zinc-500 leading-relaxed text-[11px]">
                      Enter any receipt number to check whether a student has been cleared for examinations.
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = (e.currentTarget.elements.namedItem('receiptCode') as HTMLInputElement)?.value;
                        if (input) router.push(`/verify/${encodeURIComponent(input.trim().toUpperCase())}`);
                      }}
                      className="flex gap-2 pt-1"
                    >
                      <input
                        id="verify-receipt-input"
                        name="receiptCode"
                        type="text"
                        placeholder="e.g. FINSA-26-00101"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-300 font-mono text-xs uppercase focus:border-zinc-950 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-medium transition-colors cursor-pointer"
                      >
                        Verify
                      </button>
                    </form>
                  </div>

                  {/* Treasury Bank Info */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-2 text-xs shadow-xs">
                    <span className="font-semibold text-zinc-950 block">Departmental Bank Details</span>
                    <div className="space-y-1 font-mono text-[11px] text-zinc-600">
                      <p><span className="text-zinc-400">Bank:</span> {feeConfig.departmentalBankName}</p>
                      <p><span className="text-zinc-400">Account No:</span> <strong className="text-zinc-950">{feeConfig.departmentalAccountNumber}</strong></p>
                      <p><span className="text-zinc-400">Account Name:</span> {feeConfig.departmentalAccountName}</p>
                    </div>
                  </div>

                  {/* Policy Summary */}
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-2 text-xs">
                    <span className="font-medium text-zinc-900 block">Clearance Policy</span>
                    <p className="text-zinc-500 leading-relaxed text-[11px]">
                      All students in the Department of Banking &amp; Finance (100L–400L) must possess financial clearance. Digital certificates are cryptographically verified and accepted at all departmental screening checkpoints.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Clean Institutional Footer */}
      <footer className="no-print border-t border-zinc-200 bg-white py-6 px-4 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Department of Banking &amp; Finance · Covenant University</p>
          <div className="flex items-center gap-4">
            <Link href="/verify/FINSA-26-00101" className="hover:text-zinc-950">
              Verification Scanner
            </Link>
            <span>·</span>
            <Link href="/admin" className="text-zinc-950 font-medium hover:underline">
              Admin Terminal →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
