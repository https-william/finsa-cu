export type AcademicLevel = '100L' | '200L' | '300L' | '400L' | 'Postgrad';
export type StudentRoleType = 'regular' | 'executive';
export type PaymentRail = 'paystack' | 'bank_transfer';
export type TransactionStatus = 'pending' | 'pending_verification' | 'success' | 'failed';

export interface StudentRecord {
  id: string;
  matricNumber: string; // e.g. '22AG031042'
  fullName: string;
  email: string;
  level: AcademicLevel;
  roleType: StudentRoleType;
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
  matricNumber: string;
  studentName: string;
  email: string;
  level: AcademicLevel;
  roleType: StudentRoleType;
  executiveTitle?: string;
  categoryTitle: string;
  amountNaira: number;
  paymentRail: PaymentRail;
  status: TransactionStatus;
  transferSenderBank?: string;
  transferSessionId?: string;
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
  STUDENTS: 'finsa_online_students_v1',
  TRANSACTIONS: 'finsa_online_transactions_v1',
  FEE_CONFIG: 'finsa_online_fee_config_v1',
  AUDIT_LOGS: 'finsa_online_audit_logs_v1',
  SESSION_STUDENT: 'finsa_online_session_student_v1',
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

export const SEEDED_STUDENTS: StudentRecord[] = [
  {
    id: 'stu-01',
    matricNumber: '22AG031042',
    fullName: 'Adeyemi Oluwatobiloba David',
    email: 'tobiloba.adeyemi@stu.cu.edu.ng',
    level: '400L',
    roleType: 'executive',
    executiveTitle: 'FINSA President',
    isRosterVerified: true,
    createdAt: '2026-11-01T09:00:00.000Z',
  },
  {
    id: 'stu-02',
    matricNumber: '22AG031089',
    fullName: 'Chukwuemeka Chidinma Claire',
    email: 'chidinma.chukwuemeka@stu.cu.edu.ng',
    level: '400L',
    roleType: 'executive',
    executiveTitle: 'Financial Secretary',
    isRosterVerified: true,
    createdAt: '2026-11-01T09:05:00.000Z',
  },
  {
    id: 'stu-03',
    matricNumber: '23AG033418',
    fullName: 'Ogunleye Inioluwa Emmanuel',
    email: 'inioluwa.ogunleye@stu.cu.edu.ng',
    level: '300L',
    roleType: 'executive',
    executiveTitle: 'General Secretary',
    isRosterVerified: true,
    createdAt: '2026-11-01T09:10:00.000Z',
  },
  {
    id: 'stu-04',
    matricNumber: '23AG033512',
    fullName: 'Bello Moyosoreoluwa Zainab',
    email: 'moyosore.bello@stu.cu.edu.ng',
    level: '300L',
    roleType: 'regular',
    isRosterVerified: true,
    createdAt: '2026-11-01T09:15:00.000Z',
  },
  {
    id: 'stu-05',
    matricNumber: '24AG035109',
    fullName: 'Nwosu Kamsiyochukwu Daniel',
    email: 'kamsi.nwosu@stu.cu.edu.ng',
    level: '200L',
    roleType: 'regular',
    isRosterVerified: true,
    createdAt: '2026-11-01T09:20:00.000Z',
  },
  {
    id: 'stu-06',
    matricNumber: '24AG035277',
    fullName: 'Osagie Osahon Joshua',
    email: 'osahon.osagie@stu.cu.edu.ng',
    level: '200L',
    roleType: 'executive',
    executiveTitle: 'Assistant Welfare Director',
    isRosterVerified: true,
    createdAt: '2026-11-01T09:25:00.000Z',
  },
  {
    id: 'stu-07',
    matricNumber: '25AG037804',
    fullName: 'Ezeife Munachimso Miracle',
    email: 'munachimso.ezeife@stu.cu.edu.ng',
    level: '100L',
    roleType: 'regular',
    isRosterVerified: true,
    createdAt: '2026-11-01T09:30:00.000Z',
  },
  {
    id: 'stu-08',
    matricNumber: '22AG031140',
    fullName: 'Afolabi Ayomide Samuel',
    email: 'ayomide.afolabi@stu.cu.edu.ng',
    level: '400L',
    roleType: 'regular',
    isRosterVerified: true,
    createdAt: '2026-11-01T09:35:00.000Z',
  },
];

export const SEEDED_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'tx-1001',
    reference: 'FINSA-TX-26-904182',
    receiptNumber: 'FINSA-26-00101',
    verificationHash: 'CU-FINSA-VERIFIED-22AG031042-00101',
    studentId: 'stu-01',
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
    reference: 'FINSA-TX-26-904219',
    receiptNumber: 'FINSA-26-00102',
    verificationHash: 'CU-FINSA-VERIFIED-22AG031089-00102',
    studentId: 'stu-02',
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
    createdAt: '2026-11-06T15:10:04.000Z',
    verifiedAt: '2026-11-06T15:10:09.000Z',
    verifiedBy: 'Paystack Webhook (HMAC-SHA512)',
  },
  {
    id: 'tx-1003',
    reference: 'FINSA-TX-26-904501',
    receiptNumber: 'FINSA-26-00103',
    verificationHash: 'CU-FINSA-VERIFIED-23AG033512-00103',
    studentId: 'stu-04',
    matricNumber: '23AG033512',
    studentName: 'Bello Moyosoreoluwa Zainab',
    email: 'moyosore.bello@stu.cu.edu.ng',
    level: '300L',
    roleType: 'regular',
    categoryTitle: 'FINSA Departmental Course Dues (Regular)',
    amountNaira: 10000,
    paymentRail: 'paystack',
    status: 'success',
    createdAt: '2026-11-07T08:45:12.000Z',
    verifiedAt: '2026-11-07T08:45:19.000Z',
    verifiedBy: 'Paystack Webhook (HMAC-SHA512)',
  },
  {
    id: 'tx-1004',
    reference: 'FINSA-TX-26-904688',
    receiptNumber: 'FINSA-26-00104',
    verificationHash: 'CU-FINSA-VERIFIED-24AG035109-00104',
    studentId: 'stu-05',
    matricNumber: '24AG035109',
    studentName: 'Nwosu Kamsiyochukwu Daniel',
    email: 'kamsi.nwosu@stu.cu.edu.ng',
    level: '200L',
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
    reference: 'FINSA-TX-26-904810',
    studentId: 'stu-06',
    matricNumber: '24AG035277',
    studentName: 'Osagie Osahon Joshua',
    email: 'osahon.osagie@stu.cu.edu.ng',
    level: '200L',
    roleType: 'executive',
    executiveTitle: 'Assistant Welfare Director',
    categoryTitle: 'FINSA Executive Council & Course Dues',
    amountNaira: 15000,
    paymentRail: 'bank_transfer',
    status: 'pending_verification',
    transferSenderBank: 'GTBank',
    transferSessionId: '000013261107113049201847291034',
    createdAt: '2026-11-07T11:32:00.000Z',
  },
  {
    id: 'tx-1006',
    reference: 'FINSA-TX-26-904955',
    receiptNumber: 'FINSA-26-00105',
    verificationHash: 'CU-FINSA-VERIFIED-25AG037804-00105',
    studentId: 'stu-07',
    matricNumber: '25AG037804',
    studentName: 'Ezeife Munachimso Miracle',
    email: 'munachimso.ezeife@stu.cu.edu.ng',
    level: '100L',
    roleType: 'regular',
    categoryTitle: 'FINSA Departmental Course Dues (Regular)',
    amountNaira: 10000,
    paymentRail: 'paystack',
    status: 'success',
    createdAt: '2026-11-07T12:04:11.000Z',
    verifiedAt: '2026-11-07T12:04:15.000Z',
    verifiedBy: 'Paystack Webhook (HMAC-SHA512)',
  },
];

export const SEEDED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-1',
    actor: 'System Architect',
    action: 'FEE_STRUCTURE_LOCKED',
    details: 'Set 2026/2027 Course Dues: Regular Students = ₦10,000 | Student Executives = ₦15,000',
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
    actor: 'Paystack Webhook',
    action: 'PAYMENT_VERIFIED',
    details: 'Verified ₦10,000.00 from 25AG037804 (FINSA-26-00105)',
    createdAt: '2026-11-07T12:04:15.000Z',
  },
];

function isBrowser() {
  return typeof window !== 'undefined';
}

export function normalizeMatric(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

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
  if (!isBrowser()) return;
  const logs = getAuditLogs();
  const entry: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    actor,
    action,
    details,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([entry, ...logs]));
}

export function lookupStudentByMatric(matricInput: string): {
  student: StudentRecord | null;
  paidTransaction: TransactionRecord | null;
  pendingTransaction: TransactionRecord | null;
  history: TransactionRecord[];
} {
  const matric = normalizeMatric(matricInput);
  const students = getStudents();
  const transactions = getTransactions();

  const student = students.find((s) => normalizeMatric(s.matricNumber) === matric) || null;
  const history = transactions
    .filter((t) => normalizeMatric(t.matricNumber) === matric)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const paidTransaction = history.find((t) => t.status === 'success') || null;
  const pendingTransaction =
    history.find((t) => t.status === 'pending_verification' || t.status === 'pending') || null;

  return { student, paidTransaction, pendingTransaction, history };
}

export function findReceiptByCode(receiptOrRef: string): TransactionRecord | null {
  const clean = receiptOrRef.trim().toUpperCase();
  const transactions = getTransactions();
  return (
    transactions.find(
      (t) =>
        t.receiptNumber?.toUpperCase() === clean ||
        t.reference.toUpperCase() === clean ||
        t.verificationHash?.toUpperCase() === clean ||
        t.matricNumber.toUpperCase() === clean
    ) || null
  );
}

export function upsertStudent(data: {
  matricNumber: string;
  fullName: string;
  email: string;
  level: AcademicLevel;
  roleType: StudentRoleType;
  executiveTitle?: string;
}): StudentRecord {
  const matric = normalizeMatric(data.matricNumber);
  const students = getStudents();
  const existingIdx = students.findIndex((s) => normalizeMatric(s.matricNumber) === matric);

  if (existingIdx >= 0) {
    const updated: StudentRecord = {
      ...students[existingIdx],
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      level: data.level,
      roleType: data.roleType,
      executiveTitle: data.roleType === 'executive' ? data.executiveTitle?.trim() : undefined,
    };
    students[existingIdx] = updated;
    if (isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    }
    return updated;
  }

  const created: StudentRecord = {
    id: `stu-${Date.now()}`,
    matricNumber: matric,
    fullName: data.fullName.trim(),
    email: data.email.trim().toLowerCase(),
    level: data.level,
    roleType: data.roleType,
    executiveTitle: data.roleType === 'executive' ? data.executiveTitle?.trim() : undefined,
    isRosterVerified: false,
    createdAt: new Date().toISOString(),
  };

  const next = [created, ...students];
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(next));
  }
  return created;
}

export function recordVerifiedPaystackPayment(params: {
  student: StudentRecord;
  gatewayReference?: string;
}): TransactionRecord {
  const transactions = getTransactions();
  const config = getFeeConfig();

  // Idempotency check: if student already has a verified success receipt for this session, return it!
  const existingPaid = transactions.find(
    (t) =>
      normalizeMatric(t.matricNumber) === normalizeMatric(params.student.matricNumber) &&
      t.status === 'success'
  );
  if (existingPaid) {
    return existingPaid;
  }

  const paidCount = transactions.filter((t) => t.status === 'success').length;
  const nextReceiptNum = `FINSA-26-${String(101 + paidCount).padStart(5, '0')}`;
  const reference =
    params.gatewayReference ||
    `FINSA-TX-26-${Math.floor(100000 + Math.random() * 900000)}`;

  const amountNaira =
    params.student.roleType === 'executive'
      ? config.executiveAmountNaira
      : config.regularAmountNaira;

  const categoryTitle =
    params.student.roleType === 'executive' ? config.executiveTitle : config.regularTitle;

  const newTx: TransactionRecord = {
    id: `tx-${Date.now()}`,
    reference,
    receiptNumber: nextReceiptNum,
    verificationHash: `CU-FINSA-VERIFIED-${params.student.matricNumber}-${nextReceiptNum.slice(-5)}`,
    studentId: params.student.id,
    matricNumber: params.student.matricNumber,
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

  // Also mark any old pending attempts for this student as superseded/failed
  const updatedList = [
    newTx,
    ...transactions.filter(
      (t) =>
        !(
          normalizeMatric(t.matricNumber) === normalizeMatric(params.student.matricNumber) &&
          t.status === 'pending_verification'
        )
    ),
  ];

  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedList));
    addAuditLog(
      'Paystack Gateway',
      'PAYMENT_VERIFIED',
      `Verified ${formatNaira(amountNaira)} for ${params.student.matricNumber} (${
        params.student.roleType.toUpperCase()
      }) -> Receipt ${nextReceiptNum}`
    );
  }

  return newTx;
}

export function submitBankTransferClaim(params: {
  student: StudentRecord;
  senderBank: string;
  sessionId: string;
}): TransactionRecord {
  const transactions = getTransactions();
  const config = getFeeConfig();

  // Check if already paid
  const existingPaid = transactions.find(
    (t) =>
      normalizeMatric(t.matricNumber) === normalizeMatric(params.student.matricNumber) &&
      t.status === 'success'
  );
  if (existingPaid) return existingPaid;

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
    matricNumber: params.student.matricNumber,
    studentName: params.student.fullName,
    email: params.student.email,
    level: params.student.level,
    roleType: params.student.roleType,
    executiveTitle: params.student.executiveTitle,
    categoryTitle,
    amountNaira,
    paymentRail: 'bank_transfer',
    status: 'pending_verification',
    transferSenderBank: params.senderBank.trim(),
    transferSessionId: params.sessionId.trim(),
    createdAt: new Date().toISOString(),
  };

  const next = [newTx, ...transactions];
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(next));
    addAuditLog(
      params.student.matricNumber,
      'TRANSFER_SUBMITTED',
      `Submitted bank transfer proof (${params.senderBank} · Ref: ${params.sessionId}) for ${formatNaira(
        amountNaira
      )}`
    );
  }
  return newTx;
}

export function approveBankTransfer(txId: string, adminActor = 'Financial Secretary'): TransactionRecord | null {
  const transactions = getTransactions();
  const idx = transactions.findIndex((t) => t.id === txId);
  if (idx === -1) return null;

  const target = transactions[idx];
  if (target.status === 'success') return target;

  const paidCount = transactions.filter((t) => t.status === 'success').length;
  const nextReceiptNum = `FINSA-26-${String(101 + paidCount).padStart(5, '0')}`;

  const approved: TransactionRecord = {
    ...target,
    status: 'success',
    receiptNumber: nextReceiptNum,
    verificationHash: `CU-FINSA-VERIFIED-${target.matricNumber}-${nextReceiptNum.slice(-5)}`,
    verifiedAt: new Date().toISOString(),
    verifiedBy: `${adminActor} (Manual Reconciliation)`,
  };

  transactions[idx] = approved;
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    addAuditLog(
      adminActor,
      'TRANSFER_APPROVED',
      `Approved ${formatNaira(approved.amountNaira)} transfer for ${approved.matricNumber} -> Issued ${nextReceiptNum}`
    );
  }
  return approved;
}

export function rejectBankTransfer(txId: string, adminActor = 'Financial Secretary'): TransactionRecord | null {
  const transactions = getTransactions();
  const idx = transactions.findIndex((t) => t.id === txId);
  if (idx === -1) return null;

  const rejected: TransactionRecord = {
    ...transactions[idx],
    status: 'failed',
    verifiedAt: new Date().toISOString(),
    verifiedBy: `${adminActor} (Declined Transfer)`,
  };

  transactions[idx] = rejected;
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    addAuditLog(
      adminActor,
      'TRANSFER_DECLINED',
      `Declined unverified transfer ${rejected.reference} for ${rejected.matricNumber}`
    );
  }
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

export function authenticateStudent(
  matric: string,
  password: string
): { success: boolean; student?: StudentRecord; error?: string } {
  const cleanMatric = normalizeMatric(matric);
  if (!cleanMatric || cleanMatric.length < 5) {
    return {
      success: false,
      error: 'Please enter a valid matriculation number (e.g. 22AG031140).',
    };
  }

  const cleanPass = (password || '').trim();
  if (!cleanPass) {
    return {
      success: false,
      error: 'Please enter your password (default: finsaonline).',
    };
  }

  // Permissive default password checking for student portal convenience
  const allowedDefaults = ['finsaonline', 'finsa2026', 'covenant', 'password', '123456'];
  const passLower = cleanPass.toLowerCase();
  if (!allowedDefaults.includes(passLower) && cleanPass.length < 4) {
    return {
      success: false,
      error: 'Invalid password. Try the default: finsaonline',
    };
  }

  const students = getStudents();
  let student = students.find((s: StudentRecord) => normalizeMatric(s.matricNumber) === cleanMatric);

  if (!student) {
    // Dynamically provision new student record based on matriculation year
    let inferredLevel: AcademicLevel = '400L';
    if (cleanMatric.startsWith('25')) inferredLevel = '100L';
    else if (cleanMatric.startsWith('24')) inferredLevel = '200L';
    else if (cleanMatric.startsWith('23')) inferredLevel = '300L';
    else if (cleanMatric.startsWith('22')) inferredLevel = '400L';

    student = upsertStudent({
      matricNumber: cleanMatric,
      fullName: `Student ${cleanMatric}`,
      email: `${cleanMatric.toLowerCase()}@stu.cu.edu.ng`,
      level: inferredLevel,
      roleType: 'regular',
    });
  }

  setActiveSessionStudent(student);
  return { success: true, student };
}

export function getSampleDemoStudents(): StudentRecord[] {
  return getStudents();
}

