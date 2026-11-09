'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  QrCode,
  FileText,
  SealCheck,
  Student,
  Certificate,
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
  const router = useRouter();
  const [feeConfig, setFeeConfig] = useState<FeeConfig>(INITIAL_FEE_CONFIG);
  const [mounted, setMounted] = useState(false);

  // Quick verify input
  const [quickVerifyInput, setQuickVerifyInput] = useState('');

  // Lookup & Identity State
  const [matricInput, setMatricInput] = useState('');
  const [lookupPerformed, setLookupPerformed] = useState(false);
  const [matchedRosterStudent, setMatchedRosterStudent] = useState<StudentRecord | null>(null);

  // Editable Student Profile Fields
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

    if (targetMatric.length < 5) {
      setFormError('Please enter a valid Covenant University Matric Number (e.g. 22AG031042).');
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

  const currentDueTitle =
    roleType === 'executive' ? feeConfig.executiveTitle : feeConfig.regularTitle;

  const validateStudentIdentity = (): StudentRecord | null => {
    const cleanMatric = normalizeMatric(matricInput);
    if (cleanMatric.length < 5) {
      setFormError('Enter a valid Matriculation Number (e.g., 22AG031042).');
      return null;
    }
    if (fullName.trim().length < 3) {
      setFormError('Please enter your full name as it appears on official records.');
      return null;
    }
    if (!email.includes('@')) {
      setFormError('Please enter a valid university email address.');
      return null;
    }
    if (roleType === 'executive' && executiveTitle.trim().length < 2) {
      setFormError('Please specify your FINSA Executive Council portfolio.');
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
    setTimeout(() => {
      const verifiedTx = recordVerifiedPaystackPayment({
        student,
      });
      setIsProcessingGateway(false);
      setActiveReceipt(verifiedTx);
      setPendingTx(null);
    }, 1000);
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
      setFormError('Please enter the Transfer Reference or Session ID.');
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

  const handleQuickVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickVerifyInput.trim()) return;
    router.push(`/verify/${encodeURIComponent(quickVerifyInput.trim().toUpperCase())}`);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-[#F8F9FA] text-[#09120E]">
      {/* =========================================================================
          ROYAL CANOPY: Authoritative Academic Treasury Banner
         ========================================================================= */}
      <section className="bg-guilloche-dark text-white pt-5 pb-16 px-4 sm:px-6 relative overflow-hidden border-b border-[#C5A059]/30">
        {/* Subtle decorative gold watermarks */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border border-[#C5A059]/10 pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full border border-[#C5A059]/10 pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          {/* Translucent Frosted Pill Navigation */}
          <nav
            aria-label="Primary Navigation"
            className="h-14 px-4 sm:px-6 rounded-full bg-[#031D16]/80 backdrop-blur-xl border border-[#C5A059]/30 shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C5A059] to-[#8E7134] text-[#031D16] flex items-center justify-center shrink-0 shadow-sm font-bold text-xs">
                CU
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif-title font-bold text-sm sm:text-base tracking-wider text-white uppercase">
                  FINSA Treasury
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A059] hidden md:inline">
                  Dept. of Banking &amp; Finance
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-[11px] font-mono border border-white/15">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span>{feeConfig.academicSession} Active</span>
              </div>

              <Link
                href="/verify/FINSA-26-00101"
                className="text-xs font-mono text-emerald-100/80 hover:text-white transition-colors hidden sm:block px-2"
              >
                Verify Credential
              </Link>

              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#031D16] px-4 py-1.5 text-xs font-semibold tracking-tight transition-all duration-150 active:scale-[0.97] hover:brightness-110 shadow-sm"
              >
                <span>Admin Console</span>
                <ArrowUpRight size={13} weight="bold" />
              </Link>
            </div>
          </nav>

          {/* Majestic Hero Headline Section */}
          <div className="pt-4 pb-2 space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#E5C378] text-[10px] sm:text-[11px] font-mono tracking-widest uppercase">
              <span>✦ Covenant University · College of Management &amp; Social Sciences · Est. 2002 ✦</span>
            </div>

            <h1 className="font-serif-title text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
              Department of Banking &amp; Finance
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/85 leading-relaxed max-w-2xl font-light">
              Official Course Dues Assessment, Payment Verification &amp; Tamper-Evident Digital Clearance Credential Terminal.
            </p>
          </div>

          {/* UPFRONT DUES ARCHITECTURE: Banknote-Styled Fee Structure */}
          {!activeReceipt && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 max-w-4xl">
              {/* Regular Dues Banknote Card */}
              <div className="relative rounded-2xl bg-white/[0.06] backdrop-blur-md border border-[#C5A059]/30 p-5 space-y-3 overflow-hidden group hover:border-[#C5A059]/60 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A059]/5 rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#E5C378]">
                    Category A · Undergraduate
                  </span>
                  <span className="text-xs font-mono text-emerald-200/70">Per Academic Session</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="font-serif-title text-base font-bold text-white">
                      Regular Student Dues
                    </h3>
                    <p className="text-xs text-emerald-100/70">
                      Standard course materials, library access &amp; departmental clearance
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-2xl sm:text-3xl font-bold text-[#E5C378] font-tabular">
                      {mounted ? formatNaira(feeConfig.regularAmountNaira) : '₦10,000'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Executive Dues Banknote Card */}
              <div className="relative rounded-2xl bg-[#063A2D]/80 backdrop-blur-md border border-[#C5A059]/40 p-5 space-y-3 overflow-hidden group hover:border-[#C5A059]/80 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A059]/10 rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#E5C378] font-semibold">
                    Category B · Executive Council
                  </span>
                  <span className="text-xs font-mono text-[#E5C378]">Exco Council Certified</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="font-serif-title text-base font-bold text-white">
                      Executive Council Dues
                    </h3>
                    <p className="text-xs text-emerald-100/70">
                      Includes regular course dues + FINSA Executive Leadership Levy
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-2xl sm:text-3xl font-bold text-[#E5C378] font-tabular">
                      {mounted ? formatNaira(feeConfig.executiveAmountNaira) : '₦15,000'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          MAIN INTERACTIVE TREASURY WORKSPACE
         ========================================================================= */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 -mt-8 pb-20 relative z-20 space-y-8">
        {/* VIEW A: Verified Credential Card */}
        {activeReceipt ? (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="no-print text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[#064E3B] text-xs font-mono font-semibold">
                <SealCheck size={18} weight="fill" className="text-[#C5A059]" />
                <span>Verification Confirmed on Master Ledger</span>
              </div>
              <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#09120E] tracking-tight">
                Official Clearance Credential
              </h2>
            </div>

            <BankNoteReceipt transaction={activeReceipt} />

            <div className="no-print text-center pt-2">
              <button
                type="button"
                onClick={resetLookup}
                className="text-xs font-mono text-[#53645E] hover:text-[#09120E] hover:underline cursor-pointer"
              >
                ← Check or pay for another student
              </button>
            </div>
          </div>
        ) : (
          /* VIEW B: Asymmetric Master Ledger & Interactive Register */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (7 cols): The Clearance Register */}
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-3xl bg-white border border-black/[0.08] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-7">
                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#04241B] text-[#E5C378] flex items-center justify-center font-bold shadow-xs">
                      <Certificate size={20} weight="bold" />
                    </div>
                    <div>
                      <h2 className="font-serif-title text-lg font-bold text-[#09120E] tracking-tight">
                        Clearance Register
                      </h2>
                      <p className="text-[11px] font-mono text-[#53645E]">
                        Step 1: Authenticate Matriculation Identity
                      </p>
                    </div>
                  </div>

                  {lookupPerformed && (
                    <button
                      type="button"
                      onClick={resetLookup}
                      className="inline-flex items-center gap-1 text-xs font-mono text-[#064E3B] hover:underline cursor-pointer"
                    >
                      <ArrowCounterClockwise size={13} />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                {/* Step 1: Matriculation Number Form */}
                <form onSubmit={(e) => handleMatricLookup(e)} className="space-y-3">
                  <label
                    htmlFor="matric-input"
                    className="block text-xs font-mono uppercase tracking-wider text-[#53645E] font-medium"
                  >
                    Matriculation Number (CU Format)
                  </label>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MagnifyingGlass
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#53645E]"
                      />
                      <input
                        id="matric-input"
                        name="matricNumber"
                        type="text"
                        value={matricInput}
                        onChange={(e) => setMatricInput(e.target.value.toUpperCase())}
                        placeholder="e.g. 22AG031042"
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F7F7F6] border border-black/10 font-mono text-sm sm:text-base text-[#09120E] placeholder:text-[#9AA09D] focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:bg-white transition-all uppercase font-semibold"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-3.5 rounded-2xl bg-[#04241B] text-[#E5C378] text-xs font-mono uppercase tracking-wider font-bold transition-transform duration-150 active:scale-[0.97] hover:bg-[#064E3B] cursor-pointer shrink-0 shadow-sm"
                    >
                      Lookup
                    </button>
                  </div>

                  {/* Sample test shortcuts */}
                  {!lookupPerformed && (
                    <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#53645E]">
                      <span>Quick Test:</span>
                      <button
                        type="button"
                        onClick={() => quickFillSample('22AG031140')}
                        className="px-2.5 py-1 rounded-md bg-[#F0F0EE] hover:bg-black/10 font-mono text-[#09120E] transition-colors cursor-pointer"
                      >
                        Regular (₦10k)
                      </button>
                      <button
                        type="button"
                        onClick={() => quickFillSample('23AG033418')}
                        className="px-2.5 py-1 rounded-md bg-[#F0F0EE] hover:bg-black/10 font-mono text-[#09120E] transition-colors cursor-pointer"
                      >
                        Executive (₦15k)
                      </button>
                      <button
                        type="button"
                        onClick={() => quickFillSample('22AG031042')}
                        className="px-2.5 py-1 rounded-md bg-emerald-50 text-[#064E3B] font-mono border border-emerald-200/60 transition-colors cursor-pointer"
                      >
                        ✓ Cleared Student
                      </button>
                    </div>
                  )}
                </form>

                {formError && (
                  <div className="p-3.5 rounded-2xl bg-red-50/90 border border-red-200 text-red-900 text-xs flex items-center gap-2.5">
                    <WarningCircle size={18} weight="fill" className="text-red-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Pending Transfer Alert */}
                {lookupPerformed && pendingTx && (
                  <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 text-xs font-semibold">
                      <Clock size={16} weight="fill" className="text-[#B45309]" />
                      <span>Bank Transfer Awaiting Administrative Verification</span>
                    </div>
                    <p className="text-xs text-[#53645E] leading-relaxed">
                      Transfer claim of <strong>{formatNaira(pendingTx.amountNaira)}</strong> ({pendingTx.transferSenderBank} · Session ID: {pendingTx.transferSessionId}) was received. Once approved in the Treasury Ledger, your clearance certificate will unlock here.
                    </p>
                  </div>
                )}

                {/* Step 2: Student Identity & Dues Assessment */}
                {lookupPerformed && !pendingTx && (
                  <div className="space-y-6 pt-4 border-t border-black/[0.06] animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-[#53645E] font-medium">
                        Student Identity Dossier
                      </span>
                      {matchedRosterStudent ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-[#064E3B] border border-emerald-200 text-[11px] font-mono font-semibold">
                          <UserCheck size={14} weight="bold" />
                          Roster Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/[0.04] text-[#53645E] text-[11px] font-mono">
                          <Sparkle size={13} />
                          Self Registration
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="student-name" className="text-xs font-medium text-[#09120E]">
                          Student Full Name
                        </label>
                        <input
                          id="student-name"
                          name="studentName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Adeyemi Oluwatobiloba David"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F6] border border-black/10 text-xs sm:text-sm text-[#09120E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="student-email" className="text-xs font-medium text-[#09120E]">
                          University Email Address
                        </label>
                        <input
                          id="student-email"
                          name="studentEmail"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@stu.cu.edu.ng"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F6] border border-black/10 text-xs sm:text-sm text-[#09120E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="student-level" className="text-xs font-medium text-[#09120E]">
                          Academic Level
                        </label>
                        <select
                          id="student-level"
                          name="studentLevel"
                          value={level}
                          onChange={(e) => setLevel(e.target.value as AcademicLevel)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F6] border border-black/10 text-xs sm:text-sm text-[#09120E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                        >
                          {LEVELS.map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl} · Banking &amp; Finance
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Classification Segmented Control */}
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-[#09120E] block">
                          Clearance Classification
                        </span>
                        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F0F0EE] text-xs font-medium">
                          <button
                            type="button"
                            onClick={() => setRoleType('regular')}
                            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                              roleType === 'regular'
                                ? 'bg-white text-[#09120E] shadow-xs font-semibold'
                                : 'text-[#53645E] hover:text-[#09120E]'
                            }`}
                          >
                            Regular (₦{(feeConfig.regularAmountNaira / 1000)}k)
                          </button>
                          <button
                            type="button"
                            onClick={() => setRoleType('executive')}
                            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                              roleType === 'executive'
                                ? 'bg-[#04241B] text-[#E5C378] shadow-xs font-semibold'
                                : 'text-[#53645E] hover:text-[#09120E]'
                            }`}
                          >
                            Executive (₦{(feeConfig.executiveAmountNaira / 1000)}k)
                          </button>
                        </div>
                      </div>
                    </div>

                    {roleType === 'executive' && (
                      <div className="space-y-1">
                        <label htmlFor="exec-title" className="text-xs font-medium text-[#09120E]">
                          Executive Portfolio / Office
                        </label>
                        <input
                          id="exec-title"
                          name="execTitle"
                          type="text"
                          value={executiveTitle}
                          onChange={(e) => setExecutiveTitle(e.target.value)}
                          placeholder="e.g. Financial Secretary, Vice President"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F6] border border-black/10 text-xs sm:text-sm text-[#09120E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                        />
                      </div>
                    )}

                    {/* Dues Calculation Strip */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#04241B]/[0.04] to-[#C5A059]/[0.08] border border-[#C5A059]/25 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#064E3B] font-bold block">
                          Assessed Course Dues
                        </span>
                        <p className="text-xs font-bold text-[#09120E] mt-0.5">
                          {currentDueTitle}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-mono font-bold text-[#04241B] font-tabular">
                          {mounted ? formatNaira(currentDueAmount) : '₦10,000'}
                        </span>
                      </div>
                    </div>

                    {/* Step 3: Payment Rail Selection */}
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F0F0EE] text-xs font-medium">
                        {feeConfig.enablePaystackRail && (
                          <button
                            type="button"
                            onClick={() => setSelectedRail('paystack')}
                            className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              selectedRail === 'paystack'
                                ? 'bg-white text-[#09120E] shadow-xs font-semibold'
                                : 'text-[#53645E] hover:text-[#09120E]'
                            }`}
                          >
                            <CreditCard size={16} />
                            <span>Instant Gateway Settlement</span>
                          </button>
                        )}

                        {feeConfig.enableBankTransferRail && (
                          <button
                            type="button"
                            onClick={() => setSelectedRail('bank_transfer')}
                            className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              selectedRail === 'bank_transfer'
                                ? 'bg-white text-[#09120E] shadow-xs font-semibold'
                                : 'text-[#53645E] hover:text-[#09120E]'
                            }`}
                          >
                            <Bank size={16} />
                            <span>Treasury Bank Transfer</span>
                          </button>
                        )}
                      </div>

                      {/* Rail 1: Instant Gateway Checkout */}
                      {selectedRail === 'paystack' && (
                        <button
                          type="button"
                          disabled={isProcessingGateway}
                          onClick={handlePaystackCheckout}
                          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#04241B] to-[#063A2D] text-[#E5C378] py-4 text-sm font-bold tracking-wide transition-all duration-150 active:scale-[0.98] hover:brightness-110 disabled:opacity-60 cursor-pointer shadow-md"
                        >
                          <LockKey size={17} weight="bold" />
                          <span>
                            {isProcessingGateway
                              ? 'Verifying Settlement With Gateway...'
                              : `Authorize ${formatNaira(currentDueAmount)} & Issue Credential`}
                          </span>
                        </button>
                      )}

                      {/* Rail 2: Direct Bank Transfer */}
                      {selectedRail === 'bank_transfer' && (
                        <div className="p-5 rounded-2xl bg-[#F7F7F5] border border-black/10 space-y-4">
                          <div className="flex items-center justify-between gap-2 pb-3 border-b border-black/[0.06]">
                            <div>
                              <p className="text-[10px] font-mono uppercase text-[#53645E]">
                                {feeConfig.departmentalBankName}
                              </p>
                              <p className="text-base font-mono font-bold text-[#09120E] font-tabular">
                                {feeConfig.departmentalAccountNumber}
                              </p>
                              <p className="text-xs text-[#53645E]">
                                {feeConfig.departmentalAccountName}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={copyAccountNumber}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-black/10 text-xs font-mono text-[#09120E] hover:bg-black/[0.04] transition-colors cursor-pointer"
                            >
                              {copiedAccount ? <Check size={13} /> : <Copy size={13} />}
                              <span>{copiedAccount ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label htmlFor="sender-bank" className="block text-xs font-medium text-[#09120E] mb-1">
                                Originating Bank
                              </label>
                              <input
                                id="sender-bank"
                                name="senderBank"
                                type="text"
                                value={senderBank}
                                onChange={(e) => setSenderBank(e.target.value)}
                                placeholder="e.g. GTBank, Zenith"
                                className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs text-[#09120E]"
                              />
                            </div>
                            <div>
                              <label htmlFor="session-id" className="block text-xs font-medium text-[#09120E] mb-1">
                                Transfer Session / Ref ID
                              </label>
                              <input
                                id="session-id"
                                name="sessionId"
                                type="text"
                                value={transferSessionId}
                                onChange={(e) => setTransferSessionId(e.target.value)}
                                placeholder="e.g. 00001326..."
                                className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs font-mono text-[#09120E]"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleBankTransferSubmit}
                            className="w-full py-3 rounded-xl bg-[#04241B] text-[#E5C378] text-xs font-mono uppercase tracking-wider font-bold hover:bg-[#064E3B] transition-transform duration-150 active:scale-[0.98] cursor-pointer shadow-xs"
                          >
                            Submit Transfer Claim For Approval
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (5 cols): Official Departmental Desk */}
            <div className="lg:col-span-5 space-y-6">
              {/* Official Treasury Account Box */}
              <div className="rounded-3xl bg-gradient-to-br from-[#04241B] to-[#063A2D] text-white p-6 space-y-4 shadow-[0_10px_30px_rgba(4,36,27,0.35)] border border-[#C5A059]/30">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#E5C378] font-bold">
                    Official Treasury Account
                  </span>
                  <SealCheck size={20} weight="fill" className="text-[#C5A059]" />
                </div>

                <div>
                  <p className="text-xs text-emerald-100/70">Designated Bank</p>
                  <p className="text-sm font-semibold text-white">{feeConfig.departmentalBankName}</p>
                </div>

                <div className="flex items-center justify-between bg-black/25 p-3 rounded-xl border border-white/10">
                  <div>
                    <p className="text-[10px] font-mono uppercase text-emerald-200/70">Account Number</p>
                    <p className="text-lg font-mono font-bold tracking-wider font-tabular text-[#E5C378]">{feeConfig.departmentalAccountNumber}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copyAccountNumber}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#E5C378] transition-colors cursor-pointer"
                    title="Copy Account Number"
                  >
                    {copiedAccount ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                <p className="text-[11px] font-mono text-emerald-100/70">
                  Account Name: {feeConfig.departmentalAccountName}
                </p>
              </div>

              {/* Direct Verification Scanner Box */}
              <div className="rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <QrCode size={19} className="text-[#064E3B]" weight="bold" />
                  <h3 className="font-serif-title text-base font-bold text-[#09120E]">
                    Verify Any Issued Credential
                  </h3>
                </div>
                <p className="text-xs text-[#53645E] leading-relaxed">
                  Lecturers, invigilators, and faculty officers can authenticate any physical or PDF certificate instantly using the unique receipt serial number.
                </p>

                <form onSubmit={handleQuickVerifySubmit} className="flex gap-2">
                  <input
                    id="quick-verify-input"
                    name="quickVerifyCode"
                    type="text"
                    value={quickVerifyInput}
                    onChange={(e) => setQuickVerifyInput(e.target.value.toUpperCase())}
                    placeholder="e.g. FINSA-26-00101"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F7F7F6] border border-black/10 font-mono text-xs uppercase text-[#09120E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#04241B] text-[#E5C378] text-xs font-mono uppercase font-bold hover:bg-[#064E3B] transition-all duration-150 active:scale-[0.97] cursor-pointer"
                  >
                    Verify
                  </button>
                </form>
              </div>

              {/* Clearance Directives & Policies */}
              <div className="rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-black/[0.06]">
                  <FileText size={18} className="text-[#064E3B]" weight="bold" />
                  <h3 className="font-serif-title text-base font-bold text-[#09120E]">
                    Departmental Clearance Bylaws
                  </h3>
                </div>

                <ul className="space-y-3 text-xs text-[#53645E] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#064E3B] shrink-0 mt-1.5" />
                    <span>
                      <strong>Mandatory Course Dues:</strong> All registered students in the Department of Banking &amp; Finance (100L–400L) must possess financial clearance for each academic session.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#064E3B] shrink-0 mt-1.5" />
                    <span>
                      <strong>Cryptographic Security:</strong> Each issued credential bears a unique SHA-signed QR barcode verified against the departmental ledger.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#064E3B] shrink-0 mt-1.5" />
                    <span>
                      <strong>Immediate PDF Generation:</strong> Students can save credentials to mobile devices or print physical hardcopies for screening checkpoints.
                    </span>
                  </li>
                </ul>

                <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-[#53645E]">
                  <span>Office of the HOD &amp; Exco</span>
                  <span>FINSA Covenant</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="no-print border-t border-black/[0.08] bg-white py-8 px-4 sm:px-6 text-xs text-[#53645E]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <p className="font-serif-title font-bold text-sm text-[#09120E]">
              Department of Banking &amp; Finance · Covenant University
            </p>
            <p className="text-[11px] text-[#53645E]">
              College of Management &amp; Social Sciences (CMSS) · Canaan Land, Km 10 Idiroko Road, Ota, Ogun State
            </p>
          </div>
          <div className="flex items-center gap-5 font-mono text-xs">
            <Link href="/verify/FINSA-26-00101" className="hover:text-[#09120E]">
              Live Scanner
            </Link>
            <span>·</span>
            <Link href="/admin" className="text-[#064E3B] font-bold hover:underline">
              Admin Financial Command →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
