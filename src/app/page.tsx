'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Buildings,
  ShieldCheck,
  MagnifyingGlass,
  ArrowUpRight,
  LockKey,
  CheckCircle,
  Clock,
  CreditCard,
  Bank,
  Copy,
  Check,
  Sparkle,
  UserCheck,
  WarningCircle,
  ArrowCounterClockwise,
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

export default function StudentPortalPage() {
  const [feeConfig, setFeeConfig] = useState<FeeConfig>(INITIAL_FEE_CONFIG);
  const [mounted, setMounted] = useState(false);

  // Lookup & Identity State
  const [matricInput, setMatricInput] = useState('');
  const [lookupPerformed, setLookupPerformed] = useState(false);
  const [matchedRosterStudent, setMatchedRosterStudent] = useState<StudentRecord | null>(null);

  // Editable Student Profile Fields (Auto-filled on match, or self-entered if new)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState<AcademicLevel>('400L');
  const [roleType, setRoleType] = useState<StudentRoleType>('regular');
  const [executiveTitle, setExecutiveTitle] = useState('');

  // Transaction & Checkout State
  const [activeReceipt, setActiveReceipt] = useState<TransactionRecord | null>(null);
  const [pendingTx, setPendingTx] = useState<TransactionRecord | null>(null);
  const [selectedRail, setSelectedRail] = useState<'paystack' | 'bank_transfer'>('paystack');
  const [isProcessingGateway, setIsProcessingGateway] = useState(false);

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

    if (targetMatric.length < 6) {
      setFormError('Please enter a valid Covenant University Matriculation Number (e.g. 22AG031042).');
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
      // Guess level from entry year prefix if e.g. 22AG, 23AG, 24AG, 25AG
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

  const currentDueTitle =
    roleType === 'executive' ? feeConfig.executiveTitle : feeConfig.regularTitle;

  const validateStudentIdentity = (): StudentRecord | null => {
    const cleanMatric = normalizeMatric(matricInput);
    if (cleanMatric.length < 6) {
      setFormError('Enter a valid Matriculation Number (e.g., 22AG031042).');
      return null;
    }
    if (fullName.trim().length < 3) {
      setFormError('Please enter your full name as it appears on your university records.');
      return null;
    }
    if (!email.includes('@')) {
      setFormError('Please enter a valid Covenant University or personal email address.');
      return null;
    }
    if (roleType === 'executive' && executiveTitle.trim().length < 2) {
      setFormError('Please specify your FINSA Executive Council portfolio/office.');
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

    setIsProcessingGateway(true);
    // Simulate secure Paystack inline modal & server-side webhook verification
    setTimeout(() => {
      const verifiedTx = recordVerifiedPaystackPayment({
        student,
      });
      setIsProcessingGateway(false);
      setActiveReceipt(verifiedTx);
      setPendingTx(null);
    }, 1100);
  };

  const handleBankTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const student = validateStudentIdentity();
    if (!student) return;

    if (senderBank.trim().length < 2) {
      setFormError('Please enter the sending bank name.');
      return;
    }
    if (transferSessionId.trim().length < 5) {
      setFormError('Please enter the NIP Session ID or Transfer Reference on your receipt.');
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
    <div className="min-h-[100dvh] flex flex-col justify-between">
      {/* Floating Glass Pill Navigation (Single-line desktop, <= 72px height) */}
      <header className="no-print sticky top-0 z-40 pt-5 px-4">
        <nav
          aria-label="Primary Navigation"
          className="max-w-7xl mx-auto h-16 px-5 rounded-full bg-white/85 backdrop-blur-2xl ring-1 ring-black/[0.07] shadow-[0_4px_24px_-6px_rgba(0,0,0,0.05)] flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#064E3B] text-white flex items-center justify-center shrink-0">
              <Buildings size={18} weight="regular" />
            </div>
            <div className="leading-tight">
              <span className="font-semibold text-sm tracking-tight text-[#0A0D0C] block">
                FINSA Online
              </span>
              <span className="text-[11px] font-mono text-[#525856] hidden sm:block">
                Covenant University · Dept. of Banking &amp; Finance
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/verify/FINSA-26-00101"
              className="text-xs font-mono text-[#525856] hover:text-[#0A0D0C] px-3 py-1.5 rounded-full hover:bg-black/[0.04] transition-colors"
            >
              Verify QR Receipt
            </Link>
            <Link
              href="/admin"
              className="group inline-flex items-center gap-2 rounded-full bg-[#0A0D0C] text-white pl-4 pr-1.5 py-1.5 text-xs font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#064E3B]"
            >
              <span>Admin Ledger</span>
              <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowUpRight size={13} />
              </span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content — Asymmetric Editorial & Ledger Split */}
      <main className="max-w-7xl w-full mx-auto px-4 pt-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* LEFT COLUMN (7 Cols): Interactive Student Clearance & Payment Ledger */}
          <div className="lg:col-span-7 space-y-6">
            {/* Hero Statement Block (Max 4 elements per Taste 4.7) */}
            <div className="no-print space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#064E3B]/[0.08] border border-[#064E3B]/20 px-3.5 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-[#064E3B] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                {feeConfig.academicSession} Session · {feeConfig.clearanceDeadlineLabel}
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tighter text-[#0A0D0C] leading-[1.06]">
                Course Dues &amp; Test 1 Financial Clearance.
              </h1>

              <p className="text-base text-[#525856] leading-relaxed max-w-[60ch]">
                Enter your Covenant University matriculation number to verify your assessment,
                complete your departmental dues, and download your QR-verified Test 1 clearance
                receipt.
              </p>
            </div>

            {/* Double-Bezel Interactive Ledger Card */}
            <div className="no-print bg-black/[0.035] ring-1 ring-black/[0.07] p-2 rounded-[2rem]">
              <div className="bg-white rounded-[calc(2rem-0.5rem)] shadow-[0_2px_16px_-4px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-6">
                {/* Step 1: Matriculation Number Lookup */}
                <form onSubmit={(e) => handleMatricLookup(e)} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="matric-input"
                      className="text-xs font-mono uppercase tracking-wider text-[#0A0D0C] font-semibold"
                    >
                      1. Student Matriculation Number
                    </label>
                    {lookupPerformed && (
                      <button
                        type="button"
                        onClick={resetLookup}
                        className="inline-flex items-center gap-1 text-xs font-mono text-[#064E3B] hover:underline cursor-pointer"
                      >
                        <ArrowCounterClockwise size={13} />
                        <span>Check Another Matric No.</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <MagnifyingGlass
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#525856]"
                      />
                      <input
                        id="matric-input"
                        type="text"
                        value={matricInput}
                        onChange={(e) => setMatricInput(e.target.value.toUpperCase())}
                        placeholder="e.g. 22AG031042 or 23AG033512"
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F7F7F4] border border-black/10 font-mono text-sm text-[#0A0D0C] placeholder:text-[#717875] focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:bg-white transition-all uppercase"
                      />
                    </div>
                    <button
                      type="submit"
                      className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#0A0D0C] text-white pl-6 pr-2.5 py-3 text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#064E3B] active:scale-[0.98] cursor-pointer shrink-0"
                    >
                      <span>Verify Status</span>
                      <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                        <ArrowUpRight size={15} />
                      </span>
                    </button>
                  </div>

                  {/* Quick Demo Presets for Instant Testing */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-mono text-[#525856] mr-1">
                      Quick test lookup:
                    </span>
                    <button
                      type="button"
                      onClick={() => quickFillSample('22AG031140')}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#F7F7F4] hover:bg-black/[0.07] text-[#0A0D0C] border border-black/[0.07] transition-colors cursor-pointer"
                    >
                      22AG031140 (Unpaid Regular · ₦10k)
                    </button>
                    <button
                      type="button"
                      onClick={() => quickFillSample('23AG033418')}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#F7F7F4] hover:bg-black/[0.07] text-[#0A0D0C] border border-black/[0.07] transition-colors cursor-pointer"
                    >
                      23AG033418 (Unpaid Exec · ₦15k)
                    </button>
                    <button
                      type="button"
                      onClick={() => quickFillSample('22AG031042')}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-950/[0.06] hover:bg-emerald-950/[0.12] text-[#064E3B] border border-[#064E3B]/20 transition-colors cursor-pointer"
                    >
                      22AG031042 (Already Paid · View Receipt)
                    </button>
                  </div>
                </form>

                {formError && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2.5">
                    <WarningCircle size={18} weight="fill" className="text-red-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* STATE A: Student has ALREADY paid -> Show Instant Verified Status */}
                {lookupPerformed && activeReceipt && (
                  <div className="p-5 rounded-2xl bg-[#064E3B]/[0.06] border border-[#064E3B]/20 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle size={24} weight="fill" className="text-[#064E3B] shrink-0" />
                        <div>
                          <h2 className="text-base font-semibold text-[#0A0D0C]">
                            Payment Verified &amp; Cleared for Test 1
                          </h2>
                          <p className="text-xs text-[#525856]">
                            Receipt <strong className="font-mono">{activeReceipt.receiptNumber}</strong>{' '}
                            is active on the departmental master ledger.
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-bold text-[#064E3B] font-tabular">
                        {formatNaira(activeReceipt.amountNaira)}
                      </span>
                    </div>
                  </div>
                )}

                {/* STATE B: Student has a PENDING Bank Transfer */}
                {lookupPerformed && !activeReceipt && pendingTx && (
                  <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-300/80 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Clock size={22} weight="fill" className="text-[#B45309] shrink-0" />
                        <div>
                          <h2 className="text-sm font-semibold text-[#0A0D0C]">
                            Transfer Logged · Awaiting Financial Secretary Approval
                          </h2>
                          <p className="text-xs text-[#525856] mt-0.5">
                            Ref: <span className="font-mono">{pendingTx.reference}</span> · Bank:{' '}
                            {pendingTx.transferSenderBank} ({pendingTx.transferSessionId})
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-bold text-[#B45309] font-tabular">
                        {formatNaira(pendingTx.amountNaira)}
                      </span>
                    </div>
                    <p className="text-xs text-[#525856] leading-relaxed">
                      Once the Financial Secretary reconciles your transfer in the{' '}
                      <Link href="/admin" className="text-[#064E3B] font-medium underline">
                        Admin Ledger
                      </Link>
                      , your downloadable PDF receipt and QR code will unlock automatically.
                    </p>
                  </div>
                )}

                {/* STATE C: Student needs to pay -> Show Hybrid Identity + Role-Based Dues + Dual-Rail Checkout */}
                {lookupPerformed && !activeReceipt && !pendingTx && (
                  <div className="space-y-6 pt-2 border-t border-black/[0.07]">
                    {/* Roster Match Badge */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-[#0A0D0C] font-semibold">
                        2. Student Identity &amp; Assessment Tier
                      </span>
                      {matchedRosterStudent ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/[0.06] text-[#064E3B] text-[11px] font-mono">
                          <UserCheck size={14} weight="bold" />
                          Roster Record Matched
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/[0.05] text-[#525856] text-[11px] font-mono">
                          <Sparkle size={13} />
                          New Self-Entry Registration
                        </span>
                      )}
                    </div>

                    {/* Student Details Form Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="student-name"
                          className="block text-xs font-medium text-[#0A0D0C]"
                        >
                          Full Name (Surname First)
                        </label>
                        <input
                          id="student-name"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Adeyemi Oluwatobiloba David"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F4] border border-black/10 text-sm text-[#0A0D0C] placeholder:text-[#717875] focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="student-email"
                          className="block text-xs font-medium text-[#0A0D0C]"
                        >
                          University Email Address
                        </label>
                        <input
                          id="student-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name.surname@stu.cu.edu.ng"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F4] border border-black/10 text-sm text-[#0A0D0C] placeholder:text-[#717875] focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="student-level"
                          className="block text-xs font-medium text-[#0A0D0C]"
                        >
                          Academic Level
                        </label>
                        <select
                          id="student-level"
                          value={level}
                          onChange={(e) => setLevel(e.target.value as AcademicLevel)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F4] border border-black/10 text-sm text-[#0A0D0C] focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:bg-white"
                        >
                          {LEVELS.map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl} — Banking &amp; Finance
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Role-Based Dues Selector: Regular (10,000) vs Executive (15,000) */}
                      <div className="space-y-1.5">
                        <span className="block text-xs font-medium text-[#0A0D0C]">
                          Student Classification
                        </span>
                        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F7F7F4] border border-black/10">
                          <button
                            type="button"
                            onClick={() => setRoleType('regular')}
                            className={`py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              roleType === 'regular'
                                ? 'bg-white text-[#0A0D0C] shadow-xs font-semibold'
                                : 'text-[#525856] hover:text-[#0A0D0C]'
                            }`}
                          >
                            Regular ({formatNaira(feeConfig.regularAmountNaira)})
                          </button>
                          <button
                            type="button"
                            onClick={() => setRoleType('executive')}
                            className={`py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              roleType === 'executive'
                                ? 'bg-[#064E3B] text-white shadow-xs font-semibold'
                                : 'text-[#525856] hover:text-[#0A0D0C]'
                            }`}
                          >
                            Executive ({formatNaira(feeConfig.executiveAmountNaira)})
                          </button>
                        </div>
                      </div>
                    </div>

                    {roleType === 'executive' && (
                      <div className="space-y-1.5">
                        <label
                          htmlFor="exec-title"
                          className="block text-xs font-medium text-[#0A0D0C]"
                        >
                          FINSA Executive Office / Portfolio
                        </label>
                        <input
                          id="exec-title"
                          type="text"
                          value={executiveTitle}
                          onChange={(e) => setExecutiveTitle(e.target.value)}
                          placeholder="e.g. Financial Secretary, Vice President, Public Relations Officer"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F4] border border-black/10 text-sm text-[#0A0D0C] placeholder:text-[#717875] focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:bg-white"
                        />
                      </div>
                    )}

                    {/* Assessment Summary Box */}
                    <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-black/[0.08] flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#064E3B] font-semibold block">
                          {roleType === 'executive'
                            ? 'Executive Council Assessment'
                            : 'Standard Departmental Assessment'}
                        </span>
                        <h3 className="text-sm font-semibold text-[#0A0D0C] mt-0.5">
                          {currentDueTitle}
                        </h3>
                        <p className="text-xs text-[#525856] mt-0.5">
                          Includes instant PDF receipt &amp; Test 1 Exam-Hall QR Clearance
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono text-[#525856] block">AMOUNT DUE</span>
                        <span className="text-2xl font-mono font-bold text-[#0A0D0C] font-tabular">
                          {mounted ? formatNaira(currentDueAmount) : '₦10,000'}
                        </span>
                      </div>
                    </div>

                    {/* Step 3: Dual-Rail Checkout Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase tracking-wider text-[#0A0D0C] font-semibold">
                          3. Select Payment Rail
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#525856]">
                          <LockKey size={13} />
                          Idempotent Server Verification
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {feeConfig.enablePaystackRail && (
                          <button
                            type="button"
                            onClick={() => setSelectedRail('paystack')}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                              selectedRail === 'paystack'
                                ? 'border-[#064E3B] bg-[#064E3B]/[0.04] ring-1 ring-[#064E3B]'
                                : 'border-black/10 bg-white hover:bg-[#F7F7F4]'
                            }`}
                          >
                            <CreditCard
                              size={20}
                              weight={selectedRail === 'paystack' ? 'fill' : 'regular'}
                              className="text-[#064E3B] shrink-0 mt-0.5"
                            />
                            <div>
                              <p className="text-xs font-semibold text-[#0A0D0C]">
                                Instant Gateway Checkout
                              </p>
                              <p className="text-[11px] text-[#525856] mt-0.5">
                                Card, USSD, or Instant Paystack Transfer · Immediate Receipt
                              </p>
                            </div>
                          </button>
                        )}

                        {feeConfig.enableBankTransferRail && (
                          <button
                            type="button"
                            onClick={() => setSelectedRail('bank_transfer')}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                              selectedRail === 'bank_transfer'
                                ? 'border-[#064E3B] bg-[#064E3B]/[0.04] ring-1 ring-[#064E3B]'
                                : 'border-black/10 bg-white hover:bg-[#F7F7F4]'
                            }`}
                          >
                            <Bank
                              size={20}
                              weight={selectedRail === 'bank_transfer' ? 'fill' : 'regular'}
                              className="text-[#064E3B] shrink-0 mt-0.5"
                            />
                            <div>
                              <p className="text-xs font-semibold text-[#0A0D0C]">
                                Direct Departmental Transfer
                              </p>
                              <p className="text-[11px] text-[#525856] mt-0.5">
                                Transfer to FINSA Account + Submit Session ID for Admin Approval
                              </p>
                            </div>
                          </button>
                        )}
                      </div>

                      {/* RAIL A: PAYSTACK INSTANT CHECKOUT */}
                      {selectedRail === 'paystack' && (
                        <div className="pt-2">
                          <button
                            type="button"
                            disabled={isProcessingGateway}
                            onClick={handlePaystackCheckout}
                            className="w-full group inline-flex items-center justify-between rounded-full bg-[#064E3B] text-white pl-6 pr-2.5 py-3.5 text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#0A0D0C] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                          >
                            <span>
                              {isProcessingGateway
                                ? 'Verifying Transaction with Gateway...'
                                : `Pay ${formatNaira(currentDueAmount)} & Generate Receipt`}
                            </span>
                            <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1">
                              <ShieldCheck size={18} weight="fill" />
                            </span>
                          </button>
                        </div>
                      )}

                      {/* RAIL B: DIRECT BANK TRANSFER FALLBACK */}
                      {selectedRail === 'bank_transfer' && (
                        <div className="p-4 rounded-2xl bg-[#F7F7F4] border border-black/10 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/[0.07]">
                            <div>
                              <p className="text-[11px] font-mono uppercase text-[#525856]">
                                {feeConfig.departmentalBankName}
                              </p>
                              <p className="text-base font-mono font-bold text-[#0A0D0C] font-tabular">
                                {feeConfig.departmentalAccountNumber}
                              </p>
                              <p className="text-xs text-[#525856]">
                                {feeConfig.departmentalAccountName}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={copyAccountNumber}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-black/10 text-xs font-mono text-[#0A0D0C] hover:bg-black/[0.04] cursor-pointer"
                            >
                              {copiedAccount ? <Check size={14} /> : <Copy size={14} />}
                              <span>{copiedAccount ? 'Copied Account' : 'Copy Account No.'}</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label
                                htmlFor="sender-bank"
                                className="block text-xs font-medium text-[#0A0D0C] mb-1"
                              >
                                Your Sending Bank
                              </label>
                              <input
                                id="sender-bank"
                                type="text"
                                value={senderBank}
                                onChange={(e) => setSenderBank(e.target.value)}
                                placeholder="e.g. GTBank, Zenith, Kuda"
                                className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs text-[#0A0D0C]"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="session-id"
                                className="block text-xs font-medium text-[#0A0D0C] mb-1"
                              >
                                Transfer Reference / Session ID
                              </label>
                              <input
                                id="session-id"
                                type="text"
                                value={transferSessionId}
                                onChange={(e) => setTransferSessionId(e.target.value)}
                                placeholder="e.g. 000013261107..."
                                className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs font-mono text-[#0A0D0C]"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleBankTransferSubmit}
                            className="w-full group inline-flex items-center justify-between rounded-full bg-[#0A0D0C] text-white pl-6 pr-2.5 py-3 text-xs font-medium transition-all hover:bg-[#064E3B] cursor-pointer"
                          >
                            <span>Submit Transfer Reference for Reconciliation</span>
                            <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                              <ArrowUpRight size={15} />
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (5 Cols): Live Official Bank-Note Receipt Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="no-print flex items-center justify-between px-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#525856]">
                {activeReceipt
                  ? 'Official Verified Clearance Receipt'
                  : 'Specimen Clearance Receipt Preview'}
              </span>
              <span className="text-xs font-mono text-[#064E3B] font-semibold">
                {activeReceipt ? 'READY FOR PDF PRINT' : 'LIVE LEDGER SYNC'}
              </span>
            </div>

            {activeReceipt ? (
              <BankNoteReceipt transaction={activeReceipt} compact />
            ) : (
              <div className="opacity-95">
                <BankNoteReceipt
                  compact
                  transaction={{
                    id: 'specimen',
                    reference: 'FINSA-TX-26-904182',
                    receiptNumber: 'FINSA-26-00101',
                    verificationHash: 'CU-FINSA-VERIFIED-22AG031042-00101',
                    studentId: 'stu-01',
                    matricNumber: matricInput || '22AG031042',
                    studentName: fullName || 'Adeyemi Oluwatobiloba David',
                    email: email || 'tobiloba.adeyemi@stu.cu.edu.ng',
                    level: level || '400L',
                    roleType: roleType,
                    executiveTitle:
                      roleType === 'executive' ? executiveTitle || 'FINSA Executive' : undefined,
                    categoryTitle: currentDueTitle,
                    amountNaira: currentDueAmount,
                    paymentRail: 'paystack',
                    status: 'success',
                    createdAt: new Date().toISOString(),
                    verifiedAt: new Date().toISOString(),
                  }}
                />
              </div>
            )}

            {/* Fee Schedule Transparency Strip */}
            <div className="no-print bg-black/[0.03] ring-1 ring-black/[0.06] p-1.5 rounded-3xl">
              <div className="bg-white rounded-[calc(1.5rem-0.375rem)] p-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-mono uppercase text-[#525856] block">
                    Regular Student Dues
                  </span>
                  <span className="text-lg font-mono font-bold text-[#0A0D0C] font-tabular">
                    {mounted ? formatNaira(feeConfig.regularAmountNaira) : '₦10,000'}
                  </span>
                  <span className="text-[11px] text-[#525856] block mt-0.5">
                    100L – 400L Regular Cohort
                  </span>
                </div>
                <div className="border-l border-black/[0.07] pl-4">
                  <span className="text-[11px] font-mono uppercase text-[#064E3B] font-semibold block">
                    FINSA Executive Dues
                  </span>
                  <span className="text-lg font-mono font-bold text-[#064E3B] font-tabular">
                    {mounted ? formatNaira(feeConfig.executiveAmountNaira) : '₦15,000'}
                  </span>
                  <span className="text-[11px] text-[#525856] block mt-0.5">
                    Departmental Executive Council
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Institutional Footer */}
      <footer className="no-print border-t border-black/[0.07] bg-white/60 py-6 px-4 text-xs text-[#525856]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} Department of Banking &amp; Finance (FINSA) · Covenant
            University, Ota.
          </p>
          <div className="flex items-center gap-4 font-mono">
            <span>Phase 1: Test 1 Financial Clearance Engine</span>
            <Link href="/admin" className="text-[#064E3B] hover:underline">
              Admin Console →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
