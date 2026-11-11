import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { StudentRecord, TransactionRecord, FeeConfig, AuditLogEntry } from './ledger-store';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-ref.supabase.co' &&
  supabaseAnonKey !== 'your-supabase-anon-key'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Sync helper: Attempt to load students from Supabase; returns null if unconfigured or error
 */
export async function fetchStudentsFromSupabase(): Promise<StudentRecord[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('full_name', { ascending: true });

    if (error || !data) {
      console.warn('Supabase fetchStudents warning:', error?.message);
      return null;
    }

    return data.map((row) => ({
      id: row.id,
      regNo: row.reg_no,
      matricNumber: row.matric_number || '',
      fullName: row.full_name,
      email: row.email,
      level: row.level,
      roleType: row.role_type,
      course: row.course || 'Finance',
      executiveTitle: row.executive_title || undefined,
      isRosterVerified: Boolean(row.is_roster_verified),
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('Supabase connection error:', err);
    return null;
  }
}

/**
 * Upsert student record to Supabase
 */
export async function syncStudentToSupabase(student: StudentRecord): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      id: student.id,
      reg_no: student.regNo,
      matric_number: student.matricNumber || null,
      full_name: student.fullName,
      email: student.email,
      level: student.level,
      course: student.course || 'Finance',
      role_type: student.roleType,
      executive_title: student.executiveTitle || null,
      is_roster_verified: student.isRosterVerified,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('students').upsert(payload, { onConflict: 'reg_no' });
    if (error) {
      console.warn('Supabase syncStudent warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase syncStudent error:', err);
    return false;
  }
}

/**
 * Fetch verified & pending transactions from Supabase
 */
export async function fetchTransactionsFromSupabase(): Promise<TransactionRecord[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Supabase fetchTransactions warning:', error?.message);
      return null;
    }

    return data.map((row) => ({
      id: row.id,
      reference: row.reference,
      receiptNumber: row.receipt_number || undefined,
      verificationHash: row.verification_hash || undefined,
      studentId: row.student_id || row.id,
      regNo: row.reg_no,
      matricNumber: row.matric_number || '',
      studentName: row.student_name,
      email: row.email || '',
      level: row.level,
      roleType: row.role_type,
      executiveTitle: row.executive_title || undefined,
      categoryTitle: row.category_title,
      amountNaira: row.amount_naira,
      paymentRail: row.payment_rail,
      status: row.status,
      transferSenderName: row.transfer_sender_name || undefined,
      transferSenderBank: row.transfer_sender_bank || undefined,
      transferSessionId: row.transfer_session_id || undefined,
      transferPayerRelationship: row.transfer_payer_relationship || undefined,
      transferDate: row.transfer_date || undefined,
      createdAt: row.created_at,
      verifiedAt: row.verified_at || undefined,
      verifiedBy: row.verified_by || undefined,
    }));
  } catch (err) {
    console.warn('Supabase fetchTransactions error:', err);
    return null;
  }
}

/**
 * Save transaction to Supabase
 */
export async function syncTransactionToSupabase(tx: TransactionRecord): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      id: tx.id,
      reference: tx.reference,
      reg_no: tx.regNo || '',
      matric_number: tx.matricNumber || null,
      student_name: tx.studentName,
      email: tx.email,
      level: tx.level,
      role_type: tx.roleType,
      executive_title: tx.executiveTitle || null,
      category_title: tx.categoryTitle,
      amount_naira: tx.amountNaira,
      payment_rail: tx.paymentRail,
      status: tx.status,
      transfer_sender_name: tx.transferSenderName || null,
      transfer_sender_bank: tx.transferSenderBank || null,
      transfer_session_id: tx.transferSessionId || null,
      transfer_payer_relationship: tx.transferPayerRelationship || null,
      transfer_date: tx.transferDate || null,
      verified_at: tx.verifiedAt || null,
      verified_by: tx.verifiedBy || null,
      created_at: tx.createdAt,
    };

    const { error } = await supabase.from('transactions').upsert(payload, { onConflict: 'reference' });
    if (error) {
      console.warn('Supabase syncTransaction warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase syncTransaction error:', err);
    return false;
  }
}

/**
 * Record an audit log entry in Supabase
 */
export async function syncAuditLogToSupabase(entry: AuditLogEntry): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('audit_logs').insert({
      id: entry.id,
      actor: entry.actor,
      action: entry.action,
      details: entry.details,
      created_at: entry.createdAt,
    });
    return !error;
  } catch {
    return false;
  }
}
