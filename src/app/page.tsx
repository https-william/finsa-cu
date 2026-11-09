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

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-[#FAFAFC] text-[#0A0D0C]">
      {/* Floating Translucent Pill Navigation (Apple-grade) */}
      <header className="no-print sticky top-0 z-40 pt-4 px-4">
        <nav
          aria-label="Primary Navigation"
          className="max-w-4xl mx-auto h-14 px-5 rounded-full bg-white/80 backdrop-blur-xl border border-black/[0.06] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#064E3B] text-white flex items-center justify-center shrink-0">
              <Buildings size={16} weight="regular" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm tracking-tight text-[#0A0D0C]">
                FINSA Online
              </span>
              <span className="text-[11px] font-mono text-[#717875] hidden sm:inline">
                Covenant University
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/verify/FINSA-26-00101"
              className="text-xs font-mono text-[#525856] hover:text-[#0A0D0C] transition-colors hidden sm:block"
            >
              Verify Credential
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0A0D0C] text-white px-3.5 py-1.5 text-xs font-medium transition-transform duration-150 active:scale-[0.97] hover:bg-[#064E3B]"
            >
              <span>Admin</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto px-4 pt-10 pb-20 space-y-8">
        {/* Header Hero */}
        {!activeReceipt && (
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3 py-1 text-[11px] font-mono text-[#525856]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              {feeConfig.academicSession} Academic Session
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0A0D0C]">
              Department of Banking &amp; Finance
            </h1>

            <p className="text-sm text-[#525856] max-w-md mx-auto leading-relaxed">
              Official Course Dues &amp; Departmental Financial Clearance
            </p>
          </div>
        )}

        {/* PRIMARY VIEW A: Active Verified Clearance Credential */}
        {activeReceipt ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="no-print text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[#064E3B] text-xs font-mono font-medium">
                <CheckCircle size={16} weight="fill" />
                <span>Verification Confirmed on Master Ledger</span>
              </div>
              <h2 className="text-xl font-bold text-[#0A0D0C]">
                Official Clearance Credential
              </h2>
            </div>

            <BankNoteReceipt transaction={activeReceipt} />

            <div className="no-print text-center pt-2">
              <button
                type="button"
                onClick={resetLookup}
                className="text-xs font-mono text-[#525856] hover:text-[#0A0D0C] hover:underline cursor-pointer"
              >
                ← Check or pay for another student
              </button>
            </div>
          </div>
        ) : (
          /* PRIMARY VIEW B: Single-Focus Physical Flow Card */
          <div className="rounded-3xl bg-white border border-black/[0.08] shadow-[0_10px_35px_-8px_rgba(0,0,0,0.05)] p-6 sm:p-8 space-y-7 transition-all">
            {/* Step 1: Matriculation Number Input */}
            <form onSubmit={(e) => handleMatricLookup(e)} className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="matric-input"
                  className="text-xs font-mono uppercase tracking-wider text-[#525856] font-medium"
                >
                  Matriculation Number
                </label>
                {lookupPerformed && (
                  <button
                    type="button"
                    onClick={resetLookup}
                    className="inline-flex items-center gap-1 text-xs font-mono text-[#064E3B] hover:underline cursor-pointer"
                  >
                    <ArrowCounterClockwise size={13} />
                    <span>Change</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MagnifyingGlass
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#717875]"
                  />
                  <input
                    id="matric-input"
                    type="text"
                    value={matricInput}
                    onChange={(e) => setMatricInput(e.target.value.toUpperCase())}
                    placeholder="e.g. 22AG031042"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F7F7F6] border border-black/10 font-mono text-sm text-[#0A0D0C] placeholder:text-[#9AA09D] focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:bg-white transition-all uppercase"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-2xl bg-[#0A0D0C] text-white text-xs font-mono uppercase tracking-wider font-medium transition-transform duration-150 active:scale-[0.97] hover:bg-[#064E3B] cursor-pointer shrink-0"
                >
                  Lookup
                </button>
              </div>

              {/* Discreet sample lookup chips */}
              {!lookupPerformed && (
                <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#717875]">
                  <span>Demo test:</span>
                  <button
                    type="button"
                    onClick={() => quickFillSample('22AG031140')}
                    className="underline hover:text-[#0A0D0C] cursor-pointer"
                  >
                    Regular (₦10k)
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => quickFillSample('23AG033418')}
                    className="underline hover:text-[#0A0D0C] cursor-pointer"
                  >
                    Executive (₦15k)
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => quickFillSample('22AG031042')}
                    className="underline hover:text-[#064E3B] cursor-pointer text-[#064E3B]"
                  >
                    Paid Student
                  </button>
                </div>
              )}
            </form>

            {formError && (
              <div className="p-3.5 rounded-2xl bg-red-50/80 border border-red-200 text-red-900 text-xs flex items-center gap-2">
                <WarningCircle size={16} weight="fill" className="text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Pending Transfer Alert */}
            {lookupPerformed && pendingTx && (
              <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 text-xs font-semibold">
                  <Clock size={16} weight="fill" className="text-[#B45309]" />
                  <span>Transfer Awaiting Financial Secretary Confirmation</span>
                </div>
                <p className="text-xs text-[#525856] leading-relaxed">
                  Transfer of <strong>{formatNaira(pendingTx.amountNaira)}</strong> ({pendingTx.transferSenderBank} · Ref: {pendingTx.transferSessionId}) was submitted. Once approved in the Admin console, your clearance credential will unlock here.
                </p>
              </div>
            )}

            {/* Step 2: Student Identity & Role Confirmation */}
            {lookupPerformed && !pendingTx && (
              <div className="space-y-6 pt-3 border-t border-black/[0.06] animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#525856] font-medium">
                    Student Details
                  </span>
                  {matchedRosterStudent ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#064E3B]">
                      <UserCheck size={14} weight="bold" />
                      Roster Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#717875]">
                      <Sparkle size={13} />
                      Self Registration
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="student-name" className="text-xs font-medium text-[#0A0D0C]">
                      Full Name
                    </label>
                    <input
                      id="student-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Adeyemi Oluwatobiloba David"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F6] border border-black/10 text-xs sm:text-sm text-[#0A0D0C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="student-email" className="text-xs font-medium text-[#0A0D0C]">
                      University Email
                    </label>
                    <input
                      id="student-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@stu.cu.edu.ng"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F6] border border-black/10 text-xs sm:text-sm text-[#0A0D0C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="student-level" className="text-xs font-medium text-[#0A0D0C]">
                      Academic Level
                    </label>
                    <select
                      id="student-level"
                      value={level}
                      onChange={(e) => setLevel(e.target.value as AcademicLevel)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F6] border border-black/10 text-xs sm:text-sm text-[#0A0D0C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
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
                    <span className="text-xs font-medium text-[#0A0D0C] block">
                      Classification
                    </span>
                    <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F0F0EE] text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setRoleType('regular')}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                          roleType === 'regular'
                            ? 'bg-white text-[#0A0D0C] shadow-xs font-semibold'
                            : 'text-[#717875] hover:text-[#0A0D0C]'
                        }`}
                      >
                        Regular
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoleType('executive')}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                          roleType === 'executive'
                            ? 'bg-[#064E3B] text-white shadow-xs font-semibold'
                            : 'text-[#717875] hover:text-[#0A0D0C]'
                        }`}
                      >
                        Executive
                      </button>
                    </div>
                  </div>
                </div>

                {roleType === 'executive' && (
                  <div className="space-y-1">
                    <label htmlFor="exec-title" className="text-xs font-medium text-[#0A0D0C]">
                      Executive Office / Portfolio
                    </label>
                    <input
                      id="exec-title"
                      type="text"
                      value={executiveTitle}
                      onChange={(e) => setExecutiveTitle(e.target.value)}
                      placeholder="e.g. Financial Secretary, Vice President"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F6] border border-black/10 text-xs sm:text-sm text-[#0A0D0C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                    />
                  </div>
                )}

                {/* Assessment Summary Strip */}
                <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-black/[0.05] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#064E3B] font-semibold block">
                      Assessed Dues
                    </span>
                    <p className="text-xs font-semibold text-[#0A0D0C] mt-0.5">
                      {currentDueTitle}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-mono font-bold text-[#0A0D0C] font-tabular">
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
                        className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          selectedRail === 'paystack'
                            ? 'bg-white text-[#0A0D0C] shadow-xs font-semibold'
                            : 'text-[#717875] hover:text-[#0A0D0C]'
                        }`}
                      >
                        <CreditCard size={15} />
                        <span>Instant Checkout</span>
                      </button>
                    )}

                    {feeConfig.enableBankTransferRail && (
                      <button
                        type="button"
                        onClick={() => setSelectedRail('bank_transfer')}
                        className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          selectedRail === 'bank_transfer'
                            ? 'bg-white text-[#0A0D0C] shadow-xs font-semibold'
                            : 'text-[#717875] hover:text-[#0A0D0C]'
                        }`}
                      >
                        <Bank size={15} />
                        <span>Bank Transfer</span>
                      </button>
                    )}
                  </div>

                  {/* Rail 1: Instant Gateway Checkout */}
                  {selectedRail === 'paystack' && (
                    <button
                      type="button"
                      disabled={isProcessingGateway}
                      onClick={handlePaystackCheckout}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#064E3B] text-white py-3.5 text-sm font-medium transition-transform duration-150 active:scale-[0.98] hover:bg-[#0A0D0C] disabled:opacity-60 cursor-pointer shadow-xs"
                    >
                      <LockKey size={16} />
                      <span>
                        {isProcessingGateway
                          ? 'Verifying Payment...'
                          : `Pay ${formatNaira(currentDueAmount)} & Generate Credential`}
                      </span>
                    </button>
                  )}

                  {/* Rail 2: Direct Bank Transfer */}
                  {selectedRail === 'bank_transfer' && (
                    <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-black/10 space-y-4">
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-black/[0.06]">
                        <div>
                          <p className="text-[10px] font-mono uppercase text-[#717875]">
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
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-black/10 text-xs font-mono text-[#0A0D0C] hover:bg-black/[0.04] transition-colors cursor-pointer"
                        >
                          {copiedAccount ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copiedAccount ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="sender-bank" className="block text-xs font-medium text-[#0A0D0C] mb-1">
                            Sending Bank Name
                          </label>
                          <input
                            id="sender-bank"
                            type="text"
                            value={senderBank}
                            onChange={(e) => setSenderBank(e.target.value)}
                            placeholder="e.g. GTBank, Zenith"
                            className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs text-[#0A0D0C]"
                          />
                        </div>
                        <div>
                          <label htmlFor="session-id" className="block text-xs font-medium text-[#0A0D0C] mb-1">
                            Transfer Reference / Session ID
                          </label>
                          <input
                            id="session-id"
                            type="text"
                            value={transferSessionId}
                            onChange={(e) => setTransferSessionId(e.target.value)}
                            placeholder="e.g. 00001326..."
                            className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs font-mono text-[#0A0D0C]"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleBankTransferSubmit}
                        className="w-full py-2.5 rounded-xl bg-[#0A0D0C] text-white text-xs font-medium hover:bg-[#064E3B] transition-transform duration-150 active:scale-[0.98] cursor-pointer"
                      >
                        Submit Transfer Reference
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="no-print border-t border-black/[0.06] bg-white/50 py-5 px-4 text-xs text-[#717875]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>
            © {new Date().getFullYear()} Department of Banking &amp; Finance (FINSA) · Covenant University
          </p>
          <div className="flex items-center gap-3 font-mono">
            <Link href="/verify/FINSA-26-00101" className="hover:text-[#0A0D0C]">
              Verify
            </Link>
            <span>·</span>
            <Link href="/admin" className="text-[#064E3B] hover:underline">
              Admin Console →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
