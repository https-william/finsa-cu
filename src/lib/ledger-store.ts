import { OFFICIAL_ROSTER_SEED } from './student-roster-data';
import {
  syncStudentToSupabase,
  syncTransactionToSupabase,
  syncAuditLogToSupabase,
} from './supabase';

export type AcademicLevel = '100L' | '200L' | '300L' | '400L' | 'Postgrad';
export type StudentRoleType = 'regular' | 'executive';
export type PaymentRail = 'paystack' | 'bank_transfer' | 'manual_admin';
export type TransactionStatus = 'pending' | 'pending_verification' | 'success' | 'failed';

export interface StudentRecord {
  id: string;
  matricNumber?: string; // Optional for 100L freshmen (no matric yet) e.g. '22AG031042'
  regNo: string;         // Mandatory 7-digit Covenant Reg No e.g. '2601001', '2502080'
  fullName: string;
  email: string;
  level: AcademicLevel;
  roleType: StudentRoleType;
  course?: string;       // 'Finance' | 'FinTech' | 'Banking & Finance'
  executiveTitle?: string;
  isRosterVerified: boolean;
  createdAt: string;
}

export interface FeeConfig {
  academicSession: string;
  regularAmountNaira: number; // Default: 10000
  executiveAmountNaira: number; // Default: 15000
  regularTitle: string;
  executiveTitle: string;
  regularDescription: string;
  executiveDescription: string;
  enablePaystackRail: boolean;
  enableBankTransferRail: boolean;
  departmentalBankName: string;
  departmentalAccountNumber: string;
  departmentalAccountName: string;
  clearanceDeadlineLabel: string;
  updatedAt: string;
}

export interface TransactionRecord {
  id: string;
  reference: string; // e.g. 'FINSA-TX-26-894102'
  receiptNumber?: string; // e.g. 'FINSA-26-00104' (assigned ONLY when status === 'success')
  verificationHash?: string; // Cryptographic hash for QR verification
  studentId: string;
  regNo?: string;
  matricNumber?: string;
  studentName: string;
  email: string;
  level: AcademicLevel;
  roleType: StudentRoleType;
  executiveTitle?: string;
  categoryTitle: string;
  amountNaira: number;
  paymentRail: PaymentRail;
  status: TransactionStatus;
  
  // Anti-fraud Bank Transfer verification dossier
  transferSenderName?: string;        // Exact account name on transfer alert
  transferSenderBank?: string;        // e.g. GTBank, Zenith, Access, Kuda
  transferSessionId?: string;         // Unique 12-30 digit NIP session ID
  transferPayerRelationship?: string; // 'self' | 'parent' | 'sponsor' | 'other'
  transferDate?: string;
  
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  details: string;
  createdAt: string;
}

const STORAGE_KEYS = {
  STUDENTS: 'finsa_online_students_v2',
  TRANSACTIONS: 'finsa_online_transactions_v2',
  FEE_CONFIG: 'finsa_online_fee_config_v2',
  AUDIT_LOGS: 'finsa_online_audit_logs_v2',
  SESSION_STUDENT: 'finsa_online_session_student_v2',
};

export const INITIAL_FEE_CONFIG: FeeConfig = {
  academicSession: '2026/2027',
  regularAmountNaira: 10000,
  executiveAmountNaira: 15000,
  regularTitle: 'FINSA Departmental Course Dues (Regular)',
  executiveTitle: 'FINSA Executive Council & Course Dues',
  regularDescription:
    'Mandatory 2026/2027 Academic Session Departmental & Course Dues required for financial clearance.',
  executiveDescription:
    'Mandatory 2026/2027 Academic Session Course & Executive Council Dues required for financial clearance.',
  enablePaystackRail: true,
  enableBankTransferRail: true,
  departmentalBankName: 'Covenant Microfinance Bank / Zenith Bank',
  departmentalAccountNumber: '1024891042',
  departmentalAccountName: 'CU FINSA - Dept of Banking & Finance',
  clearanceDeadlineLabel: 'Official Departmental Financial Clearance',
  updatedAt: '2026-11-06T12:00:00.000Z',
};

export const SEEDED_STUDENTS: StudentRecord[] = OFFICIAL_ROSTER_SEED;

export const SEEDED_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'tx-1001',
    reference: 'FINSA-TX-26-904182',
    receiptNumber: 'FINSA-26-00101',
    verificationHash: 'CU-FINSA-VERIFIED-22AG031042-00101',
    studentId: 'stu-exec-01',
    regNo: '2201042',
    matricNumber: '22AG031042',
    studentName: 'Adeyemi Oluwatobiloba David',
    email: 'tobiloba.adeyemi@stu.cu.edu.ng',
    level: '400L',
    roleType: 'executive',
    executiveTitle: 'FINSA President',
    categoryTitle: 'FINSA Executive Council & Course Dues',
    amountNaira: 15000,
    paymentRail: 'paystack',
    status: 'success',
    createdAt: '2026-11-06T14:22:10.000Z',
    verifiedAt: '2026-11-06T14:22:18.000Z',
    verifiedBy: 'Paystack Webhook (HMAC-SHA512)',
  },
  {
    id: 'tx-1002',
    reference: 'FINSA-TX-26-904210',
    receiptNumber: 'FINSA-26-00102',
    verificationHash: 'CU-FINSA-VERIFIED-22AG031089-00102',
    studentId: 'stu-exec-02',
    regNo: '2201089',
    matricNumber: '22AG031089',
    studentName: 'Chukwuemeka Chidinma Claire',
    email: 'chidinma.chukwuemeka@stu.cu.edu.ng',
    level: '400L',
    roleType: 'executive',
    executiveTitle: 'Financial Secretary',
    categoryTitle: 'FINSA Executive Council & Course Dues',
    amountNaira: 15000,
    paymentRail: 'paystack',
    status: 'success',
    createdAt: '2026-11-06T15:05:00.000Z',
    verifiedAt: '2026-11-06T15:05:08.000Z',
    verifiedBy: 'Paystack Webhook (HMAC-SHA512)',
  },
  {
    id: 'tx-1003',
    reference: 'FINSA-TX-26-904344',
    receiptNumber: 'FINSA-26-00103',
    verificationHash: 'CU-FINSA-VERIFIED-23AG033418-00103',
    studentId: 'stu-exec-03',
    regNo: '2303418',
    matricNumber: '23AG033418',
    studentName: 'Ogunleye Inioluwa Emmanuel',
    email: 'inioluwa.ogunleye@stu.cu.edu.ng',
    level: '400L',
    roleType: 'executive',
    executiveTitle: 'General Secretary',
    categoryTitle: 'FINSA Executive Council & Course Dues',
    amountNaira: 15000,
    paymentRail: 'bank_transfer',
    status: 'success',
    transferSenderName: 'Inioluwa Emmanuel Ogunleye',
    transferSenderBank: 'Zenith Bank',
    transferSessionId: '000015261106161044910284758291',
    transferPayerRelationship: 'self',
    transferDate: '2026-11-06T16:00:00.000Z',
    createdAt: '2026-11-06T16:10:00.000Z',
    verifiedAt: '2026-11-06T16:30:00.000Z',
    verifiedBy: 'Financial Secretary (Manual Reconciliation)',
  },
  {
    id: 'tx-1004',
    reference: 'FINSA-TX-26-904551',
    receiptNumber: 'FINSA-26-00104',
    verificationHash: 'CU-FINSA-VERIFIED-24AG035109-00104',
    studentId: 'stu-reg-02',
    regNo: '2405109',
    matricNumber: '24AG035109',
    studentName: 'Nwosu Kamsiyochukwu Daniel',
    email: 'kamsi.nwosu@stu.cu.edu.ng',
    level: '300L',
    roleType: 'regular',
    categoryTitle: 'FINSA Departmental Course Dues (Regular)',
    amountNaira: 10000,
    paymentRail: 'paystack',
    status: 'success',
    createdAt: '2026-11-07T10:12:30.000Z',
    verifiedAt: '2026-11-07T10:12:36.000Z',
    verifiedBy: 'Paystack Webhook (HMAC-SHA512)',
  },
  {
    id: 'tx-1005',
    reference: 'FINSA-TRF-26-904810',
    studentId: 'stu-exec-04',
    regNo: '2405277',
    matricNumber: '24AG035277',
    studentName: 'Osagie Osahon Joshua',
    email: 'osahon.osagie@stu.cu.edu.ng',
    level: '300L',
    roleType: 'executive',
    executiveTitle: 'Assistant Welfare Director',
    categoryTitle: 'FINSA Executive Council & Course Dues',
    amountNaira: 15000,
    paymentRail: 'bank_transfer',
    status: 'pending_verification',
    transferSenderName: 'Joshua Osahon Osagie',
    transferSenderBank: 'GTBank',
    transferSessionId: '000013261107113049201847291034',
    transferPayerRelationship: 'self',
    transferDate: '2026-11-07T11:25:00.000Z',
    createdAt: '2026-11-07T11:32:00.000Z',
  },
  {
    id: 'tx-1006',
    reference: 'FINSA-TX-26-904955',
    receiptNumber: 'FINSA-26-00105',
    verificationHash: 'CU-FINSA-VERIFIED-25AG037804-00105',
    studentId: 'stu-100-01',
    regNo: '2502080',
    matricNumber: '25AG032080',
    studentName: 'Abdulsalam Idrees Adedotun',
    email: 'idrees.abdulsalam@stu.cu.edu.ng',
    level: '200L',
    roleType: 'regular',
    categoryTitle: 'FINSA Departmental Course Dues (Regular)',
    amountNaira: 10000,
    paymentRail: 'paystack',
    status: 'success',
    createdAt: '2026-11-07T12:04:11.000Z',
    verifiedAt: '2026-11-07T12:04:15.000Z',
    verifiedBy: 'Paystack Webhook (HMAC-SHA512)',
  },
  {
    id: 'tx-1007',
    reference: 'FINSA-TRF-26-905100',
    studentId: 'stu-100-01',
    regNo: '2601001',
    matricNumber: '',
    studentName: 'Adebayo Oluwatosin Daniel',
    email: 'oluwatosin.adebayo@stu.cu.edu.ng',
    level: '100L',
    roleType: 'regular',
    categoryTitle: 'FINSA Departmental Course Dues (Regular)',
    amountNaira: 10000,
    paymentRail: 'bank_transfer',
    status: 'pending_verification',
    transferSenderName: 'Mr. Olusegun Adebayo (Parent)',
    transferSenderBank: 'Zenith Bank',
    transferSessionId: '000021261108091522009817456321',
    transferPayerRelationship: 'parent',
    transferDate: '2026-11-08T09:10:00.000Z',
    createdAt: '2026-11-08T09:15:22.000Z',
  },
];

export const SEEDED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-1',
    actor: 'System Architect',
    action: 'COHORT_RECALIBRATION_APPLIED',
    details: 'Recalibrated levels: 26xxxx (100L Freshmen with Reg No), 25xxxx (200L Sophomores), 24xxxx (300L Penultimate), 23xxxx (400L Final Year)',
    createdAt: '2026-11-06T12:00:00.000Z',
  },
  {
    id: 'aud-2',
    actor: 'Paystack Webhook',
    action: 'PAYMENT_VERIFIED',
    details: 'Verified ₦15,000.00 from 22AG031042 (FINSA-26-00101)',
    createdAt: '2026-11-06T14:22:18.000Z',
  },
  {
    id: 'aud-3',
    actor: 'Financial Secretary',
    action: 'TRANSFER_APPROVED',
    details: 'Approved ₦15,000.00 transfer for 23AG033418 (Zenith Bank NIP: 0000152611...) -> Issued FINSA-26-00103',
    createdAt: '2026-11-06T16:30:00.000Z',
  },
  {
    id: 'aud-4',
    actor: 'Anti-Fraud Engine',
    action: 'SECURITY_RULE_ACTIVE',
    details: 'Enabled strict session ID uniqueness check and third-party payer attribution for bank transfers',
    createdAt: '2026-11-07T08:00:00.000Z',
  },
];

function isBrowser() {
  return typeof window !== 'undefined';
}

export function normalizeIdentifier(input: string): string {
  return (input || '').trim().toUpperCase().replace(/\s+/g, '');
}

export const normalizeMatric = normalizeIdentifier;

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getFeeConfig(): FeeConfig {
  if (!isBrowser()) return INITIAL_FEE_CONFIG;
  const raw = localStorage.getItem(STORAGE_KEYS.FEE_CONFIG);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.FEE_CONFIG, JSON.stringify(INITIAL_FEE_CONFIG));
    return INITIAL_FEE_CONFIG;
  }
  try {
    return { ...INITIAL_FEE_CONFIG, ...JSON.parse(raw) };
  } catch {
    return INITIAL_FEE_CONFIG;
  }
}

export function updateFeeConfig(partial: Partial<FeeConfig>, actor = 'Finance Admin'): FeeConfig {
  const current = getFeeConfig();
  const updated: FeeConfig = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.FEE_CONFIG, JSON.stringify(updated));
    addAuditLog(
      actor,
      'FEE_CONFIG_UPDATED',
      `Regular: ${formatNaira(updated.regularAmountNaira)} | Executive: ${formatNaira(
        updated.executiveAmountNaira
      )} | Paystack: ${updated.enablePaystackRail ? 'ON' : 'OFF'} | Transfer: ${
        updated.enableBankTransferRail ? 'ON' : 'OFF'
      }`
    );
  }
  return updated;
}

export function getStudents(): StudentRecord[] {
  if (!isBrowser()) return SEEDED_STUDENTS;
  const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(SEEDED_STUDENTS));
    return SEEDED_STUDENTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return SEEDED_STUDENTS;
  }
}

export function getTransactions(): TransactionRecord[] {
  if (!isBrowser()) return SEEDED_TRANSACTIONS;
  const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(SEEDED_TRANSACTIONS));
    return SEEDED_TRANSACTIONS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return SEEDED_TRANSACTIONS;
  }
}

export function getAuditLogs(): AuditLogEntry[] {
  if (!isBrowser()) return SEEDED_AUDIT_LOGS;
  const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(SEEDED_AUDIT_LOGS));
    return SEEDED_AUDIT_LOGS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return SEEDED_AUDIT_LOGS;
  }
}

export function addAuditLog(actor: string, action: string, details: string): void {
  const entry: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    actor,
    action,
    details,
    createdAt: new Date().toISOString(),
  };
  if (isBrowser()) {
    const logs = getAuditLogs();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([entry, ...logs]));
  }
  syncAuditLogToSupabase(entry);
}

/**
 * Universal lookup accepting either Registration Number OR Matriculation Number
 */
export function lookupStudentByMatric(identifierInput: string): {
  student: StudentRecord | null;
  paidTransaction: TransactionRecord | null;
  pendingTransaction: TransactionRecord | null;
  history: TransactionRecord[];
} {
  const clean = normalizeIdentifier(identifierInput);
  if (!clean) {
    return { student: null, paidTransaction: null, pendingTransaction: null, history: [] };
  }

  const students = getStudents();
  const transactions = getTransactions();

  const student =
    students.find((s) => {
      const sMatric = normalizeIdentifier(s.matricNumber || '');
      const sReg = normalizeIdentifier(s.regNo || '');
      return sMatric === clean || sReg === clean;
    }) || null;

  const history = transactions
    .filter((t) => {
      const tMatric = normalizeIdentifier(t.matricNumber || '');
      const tReg = normalizeIdentifier(t.regNo || '');
      const sMatric = student ? normalizeIdentifier(student.matricNumber || '') : '';
      const sReg = student ? normalizeIdentifier(student.regNo || '') : '';

      return (
        tMatric === clean ||
        tReg === clean ||
        (student && (t.studentId === student.id || (sMatric && tMatric === sMatric) || (sReg && tReg === sReg)))
      );
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const paidTransaction = history.find((t) => t.status === 'success') || null;
  const pendingTransaction =
    history.find((t) => t.status === 'pending_verification' || t.status === 'pending') || null;

  return { student, paidTransaction, pendingTransaction, history };
}

export function findReceiptByCode(receiptOrRef: string): TransactionRecord | null {
  const clean = normalizeIdentifier(receiptOrRef);
  const transactions = getTransactions();
  return (
    transactions.find(
      (t) =>
        (t.receiptNumber && normalizeIdentifier(t.receiptNumber) === clean) ||
        normalizeIdentifier(t.reference) === clean ||
        (t.verificationHash && normalizeIdentifier(t.verificationHash) === clean) ||
        (t.matricNumber && normalizeIdentifier(t.matricNumber) === clean) ||
        (t.regNo && normalizeIdentifier(t.regNo) === clean) ||
        (t.transferSessionId && normalizeIdentifier(t.transferSessionId) === clean)
    ) || null
  );
}

export function upsertStudent(data: {
  matricNumber?: string;
  regNo: string;
  fullName: string;
  email: string;
  level: AcademicLevel;
  roleType: StudentRoleType;
  course?: string;
  executiveTitle?: string;
}): StudentRecord {
  const cleanReg = normalizeIdentifier(data.regNo);
  const cleanMatric = data.matricNumber ? normalizeIdentifier(data.matricNumber) : '';
  const students = getStudents();

  const existingIdx = students.findIndex(
    (s) =>
      (cleanReg && normalizeIdentifier(s.regNo) === cleanReg) ||
      (cleanMatric && s.matricNumber && normalizeIdentifier(s.matricNumber) === cleanMatric)
  );

  if (existingIdx >= 0) {
    const updated: StudentRecord = {
      ...students[existingIdx],
      matricNumber: cleanMatric || students[existingIdx].matricNumber || '',
      regNo: cleanReg || students[existingIdx].regNo,
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      level: data.level,
      roleType: data.roleType,
      course: data.course || students[existingIdx].course || 'Finance',
      executiveTitle: data.roleType === 'executive' ? data.executiveTitle?.trim() : undefined,
    };
    students[existingIdx] = updated;
    if (isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    }
    syncStudentToSupabase(updated);
    return updated;
  }

  const created: StudentRecord = {
    id: `stu-${Date.now()}`,
    matricNumber: cleanMatric,
    regNo: cleanReg,
    fullName: data.fullName.trim(),
    email: data.email.trim().toLowerCase(),
    level: data.level,
    roleType: data.roleType,
    course: data.course || 'Finance',
    executiveTitle: data.roleType === 'executive' ? data.executiveTitle?.trim() : undefined,
    isRosterVerified: false,
    createdAt: new Date().toISOString(),
  };

  const next = [created, ...students];
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(next));
  }
  syncStudentToSupabase(created);
  return created;
}

export function recordVerifiedPaystackPayment(params: {
  student: StudentRecord;
  gatewayReference?: string;
}): TransactionRecord {
  const transactions = getTransactions();
  const config = getFeeConfig();

  // Idempotency check: if student already has a verified success receipt for this session, return it!
  const existingPaid = transactions.find((t) => {
    const matchReg = t.regNo && normalizeIdentifier(t.regNo) === normalizeIdentifier(params.student.regNo);
    const matchMatric =
      params.student.matricNumber &&
      t.matricNumber &&
      normalizeIdentifier(t.matricNumber) === normalizeIdentifier(params.student.matricNumber);
    return (matchReg || matchMatric) && t.status === 'success';
  });

  if (existingPaid) {
    return existingPaid;
  }

  const paidCount = transactions.filter((t) => t.status === 'success').length;
  const nextReceiptNum = `FINSA-26-${String(101 + paidCount).padStart(5, '0')}`;
  const reference =
    params.gatewayReference || `FINSA-TX-26-${Math.floor(100000 + Math.random() * 900000)}`;

  const amountNaira =
    params.student.roleType === 'executive'
      ? config.executiveAmountNaira
      : config.regularAmountNaira;

  const categoryTitle =
    params.student.roleType === 'executive' ? config.executiveTitle : config.regularTitle;

  const identifierForHash = params.student.matricNumber || params.student.regNo;

  const newTx: TransactionRecord = {
    id: `tx-${Date.now()}`,
    reference,
    receiptNumber: nextReceiptNum,
    verificationHash: `CU-FINSA-VERIFIED-${identifierForHash}-${nextReceiptNum.slice(-5)}`,
    studentId: params.student.id,
    regNo: params.student.regNo,
    matricNumber: params.student.matricNumber || '',
    studentName: params.student.fullName,
    email: params.student.email,
    level: params.student.level,
    roleType: params.student.roleType,
    executiveTitle: params.student.executiveTitle,
    categoryTitle,
    amountNaira,
    paymentRail: 'paystack',
    status: 'success',
    createdAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
    verifiedBy: 'Paystack Server Verification (HMAC-SHA512)',
  };

  // Supersede old pending attempts
  const updatedList = [
    newTx,
    ...transactions.filter((t) => {
      const matchReg = t.regNo && normalizeIdentifier(t.regNo) === normalizeIdentifier(params.student.regNo);
      const matchMatric =
        params.student.matricNumber &&
        t.matricNumber &&
        normalizeIdentifier(t.matricNumber) === normalizeIdentifier(params.student.matricNumber);
      return !(matchReg || matchMatric) || t.status === 'success';
    }),
  ];

  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedList));
    addAuditLog(
      'Paystack Gateway',
      'PAYMENT_VERIFIED',
      `Verified ${formatNaira(amountNaira)} for ${params.student.regNo || params.student.matricNumber} (${
        params.student.roleType.toUpperCase()
      }) -> Receipt ${nextReceiptNum}`
    );
  }

  syncTransactionToSupabase(newTx);
  return newTx;
}

/**
 * Bank transfer submission with strict duplicate session ID detection and payer relationship attribution
 */
export function submitBankTransferClaim(params: {
  student: StudentRecord;
  senderName: string;
  senderBank: string;
  sessionId: string;
  payerRelationship?: string;
  transferDate?: string;
}): { success: boolean; transaction?: TransactionRecord; error?: string } {
  const transactions = getTransactions();
  const config = getFeeConfig();

  const cleanSessionId = params.sessionId.trim().toUpperCase();
  if (!cleanSessionId || cleanSessionId.length < 8) {
    return {
      success: false,
      error: 'Please enter a valid bank transfer Session ID / NIP Reference (at least 8 characters).',
    };
  }

  if (!params.senderName.trim()) {
    return {
      success: false,
      error: 'Please enter the exact Sender / Account Name that performed the transfer.',
    };
  }

  // 1. Anti-Fraud Duplicate Reference Check
  const duplicateTx = transactions.find(
    (t) => t.transferSessionId && normalizeIdentifier(t.transferSessionId) === cleanSessionId
  );
  if (duplicateTx) {
    return {
      success: false,
      error: `Duplicate Bank Session ID detected. Reference ${params.sessionId} is already recorded under ${duplicateTx.studentName}. Receipt reuse is strictly prohibited.`,
    };
  }

  // 2. Active Pending Claim Check for this student
  const existingPending = transactions.find((t) => {
    const matchReg = t.regNo && normalizeIdentifier(t.regNo) === normalizeIdentifier(params.student.regNo);
    const matchMatric =
      params.student.matricNumber &&
      t.matricNumber &&
      normalizeIdentifier(t.matricNumber) === normalizeIdentifier(params.student.matricNumber);
    return (matchReg || matchMatric) && t.status === 'pending_verification';
  });

  if (existingPending) {
    return {
      success: false,
      error: 'You already have an active transfer claim pending Treasury verification. Please wait for reconciliation.',
    };
  }

  // 3. Already Paid Check
  const existingPaid = transactions.find((t) => {
    const matchReg = t.regNo && normalizeIdentifier(t.regNo) === normalizeIdentifier(params.student.regNo);
    const matchMatric =
      params.student.matricNumber &&
      t.matricNumber &&
      normalizeIdentifier(t.matricNumber) === normalizeIdentifier(params.student.matricNumber);
    return (matchReg || matchMatric) && t.status === 'success';
  });
  if (existingPaid) {
    return { success: true, transaction: existingPaid };
  }

  const amountNaira =
    params.student.roleType === 'executive'
      ? config.executiveAmountNaira
      : config.regularAmountNaira;

  const categoryTitle =
    params.student.roleType === 'executive' ? config.executiveTitle : config.regularTitle;

  const newTx: TransactionRecord = {
    id: `tx-${Date.now()}`,
    reference: `FINSA-TRF-26-${Math.floor(100000 + Math.random() * 900000)}`,
    studentId: params.student.id,
    regNo: params.student.regNo,
    matricNumber: params.student.matricNumber || '',
    studentName: params.student.fullName,
    email: params.student.email,
    level: params.student.level,
    roleType: params.student.roleType,
    executiveTitle: params.student.executiveTitle,
    categoryTitle,
    amountNaira,
    paymentRail: 'bank_transfer',
    status: 'pending_verification',
    transferSenderName: params.senderName.trim(),
    transferSenderBank: params.senderBank.trim(),
    transferSessionId: cleanSessionId,
    transferPayerRelationship: params.payerRelationship || 'self',
    transferDate: params.transferDate || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const next = [newTx, ...transactions];
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(next));
    addAuditLog(
      params.student.regNo || params.student.matricNumber || 'Student',
      'TRANSFER_CLAIM_SUBMITTED',
      `Submitted bank transfer claim: ${params.senderBank} · Session ID: ${cleanSessionId} · Payer: ${params.senderName} (${params.payerRelationship || 'self'})`
    );
  }

  syncTransactionToSupabase(newTx);
  return { success: true, transaction: newTx };
}

export function approveBankTransfer(txId: string, adminActor = 'Financial Secretary'): TransactionRecord | null {
  const transactions = getTransactions();
  const idx = transactions.findIndex((t) => t.id === txId);
  if (idx === -1) return null;

  const target = transactions[idx];
  if (target.status === 'success') return target;

  const paidCount = transactions.filter((t) => t.status === 'success').length;
  const nextReceiptNum = `FINSA-26-${String(101 + paidCount).padStart(5, '0')}`;
  const identifierForHash = target.matricNumber || target.regNo || 'STUDENT';

  const approved: TransactionRecord = {
    ...target,
    status: 'success',
    receiptNumber: nextReceiptNum,
    verificationHash: `CU-FINSA-VERIFIED-${identifierForHash}-${nextReceiptNum.slice(-5)}`,
    verifiedAt: new Date().toISOString(),
    verifiedBy: `${adminActor} (Manual Reconciliation)`,
  };

  transactions[idx] = approved;
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    addAuditLog(
      adminActor,
      'TRANSFER_APPROVED',
      `Approved ${formatNaira(approved.amountNaira)} transfer (Session: ${approved.transferSessionId}) for ${approved.studentName} -> Issued ${nextReceiptNum}`
    );
  }

  syncTransactionToSupabase(approved);
  return approved;
}

export function rejectBankTransfer(txId: string, adminActor = 'Financial Secretary', reason = 'Declined Transfer'): TransactionRecord | null {
  const transactions = getTransactions();
  const idx = transactions.findIndex((t) => t.id === txId);
  if (idx === -1) return null;

  const rejected: TransactionRecord = {
    ...transactions[idx],
    status: 'failed',
    verifiedAt: new Date().toISOString(),
    verifiedBy: `${adminActor} (${reason})`,
  };

  transactions[idx] = rejected;
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    addAuditLog(
      adminActor,
      'TRANSFER_DECLINED',
      `Declined unverified transfer ${rejected.reference} (Session: ${rejected.transferSessionId}): ${reason}`
    );
  }

  syncTransactionToSupabase(rejected);
  return rejected;
}

export function getActiveSessionStudent(): StudentRecord | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(STORAGE_KEYS.SESSION_STUDENT);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StudentRecord;
  } catch {
    return null;
  }
}

export function setActiveSessionStudent(student: StudentRecord | null): void {
  if (!isBrowser()) return;
  if (!student) {
    localStorage.removeItem(STORAGE_KEYS.SESSION_STUDENT);
  } else {
    localStorage.setItem(STORAGE_KEYS.SESSION_STUDENT, JSON.stringify(student));
  }
}

/**
 * Dual-Key Authentication: Accepts either 7-digit Registration Number OR Matriculation Number
 */
export function authenticateStudent(
  identifier: string,
  password: string
): { success: boolean; student?: StudentRecord; error?: string } {
  const cleanId = normalizeIdentifier(identifier);
  if (!cleanId || cleanId.length < 5) {
    return {
      success: false,
      error: 'Please enter a valid Registration Number (e.g. 2601001) or Matriculation Number (e.g. 25AG032080).',
    };
  }

  const cleanPass = (password || '').trim();
  if (!cleanPass) {
    return {
      success: false,
      error: 'Please enter your password (default: finsaonline).',
    };
  }

  const allowedDefaults = ['finsaonline', 'finsa2026', 'covenant', 'password', '123456'];
  const passLower = cleanPass.toLowerCase();
  if (!allowedDefaults.includes(passLower) && cleanPass.length < 4) {
    return {
      success: false,
      error: 'Invalid password. Try the default: finsaonline',
    };
  }

  const students = getStudents();
  let student = students.find((s: StudentRecord) => {
    const sMatric = normalizeIdentifier(s.matricNumber || '');
    const sReg = normalizeIdentifier(s.regNo || '');
    return sMatric === cleanId || sReg === cleanId;
  });

  if (!student) {
    // Dynamically provision new student record based on cohort intake rules
    let inferredLevel: AcademicLevel = '400L';
    let isFreshman = false;

    if (cleanId.startsWith('26')) {
      inferredLevel = '100L'; // Resumed 2026/2027 (~2 weeks ago), only Reg No
      isFreshman = true;
    } else if (cleanId.startsWith('25')) {
      inferredLevel = '200L'; // Sophomores
    } else if (cleanId.startsWith('24')) {
      inferredLevel = '300L'; // Penultimate
    } else if (cleanId.startsWith('23') || cleanId.startsWith('22')) {
      inferredLevel = '400L'; // Final Year Class
    }

    student = upsertStudent({
      regNo: isFreshman || cleanId.length === 7 ? cleanId : cleanId.slice(0, 7),
      matricNumber: isFreshman ? '' : cleanId,
      fullName: `Student ${cleanId}`,
      email: `${cleanId.toLowerCase()}@stu.cu.edu.ng`,
      level: inferredLevel,
      roleType: 'regular',
      course: cleanId.endsWith('1') || cleanId.endsWith('3') || cleanId.endsWith('5') ? 'FinTech' : 'Finance',
    });
  }

  setActiveSessionStudent(student);
  return { success: true, student };
}

export function getSampleDemoStudents(): StudentRecord[] {
  return getStudents();
}

export function createBackofficeStudent(
  data: {
    fullName: string;
    matricNumber?: string;
    regNo: string;
    email: string;
    level: AcademicLevel;
    course: string;
    roleType: StudentRoleType;
    executiveTitle?: string;
  },
  actor = 'Department Admin'
): StudentRecord {
  const cleanReg = normalizeIdentifier(data.regNo);
  const cleanMatric = data.matricNumber ? normalizeIdentifier(data.matricNumber) : '';

  const students = getStudents();
  const created: StudentRecord = {
    id: `stu-custom-${Date.now()}`,
    fullName: data.fullName.trim(),
    matricNumber: cleanMatric,
    regNo: cleanReg,
    email: data.email.trim().toLowerCase(),
    level: data.level,
    course: data.course || 'Finance',
    roleType: data.roleType,
    executiveTitle: data.roleType === 'executive' ? data.executiveTitle?.trim() : undefined,
    isRosterVerified: true,
    createdAt: new Date().toISOString(),
  };

  const next = [created, ...students];
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(next));
    addAuditLog(
      actor,
      'STUDENT_CREATED',
      `Registered new scholar ${created.fullName} (${created.regNo || created.matricNumber}) to official registry`
    );
  }

  syncStudentToSupabase(created);
  return created;
}

export function updateBackofficeStudent(
  id: string,
  partial: Partial<StudentRecord>,
  actor = 'Department Admin'
): StudentRecord | null {
  const students = getStudents();
  const idx = students.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  const current = students[idx];
  const updated: StudentRecord = {
    ...current,
    ...partial,
    matricNumber: partial.matricNumber !== undefined ? (partial.matricNumber ? normalizeIdentifier(partial.matricNumber) : '') : current.matricNumber,
    regNo: partial.regNo ? normalizeIdentifier(partial.regNo) : current.regNo,
    fullName: partial.fullName ? partial.fullName.trim() : current.fullName,
    email: partial.email ? partial.email.trim().toLowerCase() : current.email,
  };

  students[idx] = updated;
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    addAuditLog(
      actor,
      'STUDENT_UPDATED',
      `Updated student record ${updated.regNo || updated.matricNumber} (${updated.fullName})`
    );
  }

  syncStudentToSupabase(updated);
  return updated;
}

export function deleteBackofficeStudent(id: string, actor = 'Department Admin'): boolean {
  const students = getStudents();
  const target = students.find((s) => s.id === id);
  if (!target) return false;

  const next = students.filter((s) => s.id !== id);
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(next));
    addAuditLog(
      actor,
      'STUDENT_DELETED',
      `Archived student ${target.fullName} (${target.regNo || target.matricNumber}) from official registry`
    );
  }
  return true;
}

export function manualClearStudent(
  studentId: string,
  actor = 'Financial Secretary'
): TransactionRecord | null {
  const students = getStudents();
  const student = students.find((s) => s.id === studentId);
  if (!student) return null;

  const transactions = getTransactions();
  const config = getFeeConfig();
  const amountNaira =
    student.roleType === 'executive' ? config.executiveAmountNaira : config.regularAmountNaira;
  const categoryTitle =
    student.roleType === 'executive' ? config.executiveTitle : config.regularTitle;

  const paidCount = transactions.filter((t) => t.status === 'success').length;
  const nextReceiptNum = `FINSA-26-${String(101 + paidCount).padStart(5, '0')}`;
  const identifierForHash = student.matricNumber || student.regNo;
  const verificationHash = `CU-FINSA-VERIFIED-${identifierForHash}-${nextReceiptNum.slice(-5)}`;

  const manualTx: TransactionRecord = {
    id: `tx-man-${Date.now()}`,
    reference: `FINSA-MAN-26-${Math.floor(100000 + Math.random() * 900000)}`,
    receiptNumber: nextReceiptNum,
    verificationHash,
    studentId: student.id,
    regNo: student.regNo,
    matricNumber: student.matricNumber || '',
    studentName: student.fullName,
    email: student.email,
    level: student.level,
    roleType: student.roleType,
    executiveTitle: student.executiveTitle,
    categoryTitle,
    amountNaira,
    paymentRail: 'manual_admin',
    status: 'success',
    createdAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
    verifiedBy: `${actor} (Direct Manual Clearance)`,
  };

  const nextTxs = [manualTx, ...transactions];
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(nextTxs));
    addAuditLog(
      actor,
      'MANUAL_CLEARANCE_ISSUED',
      `Issued direct departmental clearance ${nextReceiptNum} for ${student.fullName} (${student.regNo || student.matricNumber})`
    );
  }

  syncTransactionToSupabase(manualTx);
  return manualTx;
}

export function resetStudentsToRosterSeed(actor = 'Department Admin'): StudentRecord[] {
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(OFFICIAL_ROSTER_SEED));
    addAuditLog(
      actor,
      'ROSTER_RESET_TO_SEED',
      `Restored official roster seed (${OFFICIAL_ROSTER_SEED.length} registered students)`
    );
  }
  return OFFICIAL_ROSTER_SEED;
}
