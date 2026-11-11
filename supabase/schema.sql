-- =============================================================================
-- FINSA ONLINE · COVENANT UNIVERSITY DEPARTMENT OF BANKING & FINANCE
-- Production Supabase Schema: Course Dues, Dual-Rail Transactions & QR Receipts
-- Supports 2026 Cohorts: 100L (Reg No), 200L, 300L, 400L (Matric + Reg No)
-- =============================================================================

-- 1. students (Hybrid: pre-loaded departmental roster + self-registered students)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reg_no TEXT UNIQUE NOT NULL, -- 7-digit Covenant Reg No (e.g. '2601001', '2502080')
  matric_number TEXT UNIQUE,   -- Uppercase Matric No (e.g. '25AG032080'); NULL for 100L freshmen
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('100L', '200L', '300L', '400L', 'Postgrad')),
  course TEXT NOT NULL DEFAULT 'Finance' CHECK (course IN ('Finance', 'FinTech', 'Banking & Finance')),
  role_type TEXT NOT NULL DEFAULT 'regular' CHECK (role_type IN ('regular', 'executive')),
  executive_title TEXT,
  is_roster_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_reg_no ON students(reg_no);
CREATE INDEX IF NOT EXISTS idx_students_matric ON students(matric_number);
CREATE INDEX IF NOT EXISTS idx_students_level ON students(level);
CREATE INDEX IF NOT EXISTS idx_students_course ON students(course);

-- 2. payment_categories (Supports Regular ₦10,000 vs Executive ₦15,000)
CREATE TABLE IF NOT EXISTS payment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount_naira INTEGER NOT NULL, -- 10000 for Regular, 15000 for Executive
  target_role TEXT NOT NULL CHECK (target_role IN ('regular', 'executive', 'all')),
  is_mandatory BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  academic_session TEXT NOT NULL DEFAULT '2026/2027',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial Course Dues (Regular: ₦10,000 | Executive: ₦15,000)
INSERT INTO payment_categories (slug, title, description, amount_naira, target_role, is_mandatory, is_active, academic_session)
VALUES
  ('finsa-dues-regular-2026', 'FINSA Course & Departmental Dues (Regular)', 'Mandatory 2026/2027 Academic Session Course Dues required for Departmental & Examination Clearance.', 10000, 'regular', true, true, '2026/2027'),
  ('finsa-dues-executive-2026', 'FINSA Executive Council & Course Dues', 'Mandatory 2026/2027 Academic Session Course & Executive Council Dues required for Departmental Clearance.', 15000, 'executive', true, true, '2026/2027')
ON CONFLICT (slug) DO UPDATE
SET amount_naira = EXCLUDED.amount_naira,
    updated_at = now();

-- 3. transactions (Verified gateway payments + Anti-fraud Bank Transfer claims)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL, -- e.g. 'FINSA-TX-26-849201'
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  reg_no TEXT NOT NULL,
  matric_number TEXT,
  student_name TEXT NOT NULL,
  email TEXT,
  level TEXT NOT NULL,
  role_type TEXT NOT NULL,
  executive_title TEXT,
  category_slug TEXT NOT NULL DEFAULT 'finsa-dues-regular-2026',
  category_title TEXT NOT NULL,
  amount_naira INTEGER NOT NULL,
  payment_rail TEXT NOT NULL CHECK (payment_rail IN ('paystack', 'bank_transfer', 'manual_admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pending_verification', 'success', 'failed')),
  
  -- Anti-Fraud Bank Transfer Verification Dossier
  transfer_sender_name TEXT,        -- Account name that initiated transfer (e.g. parent or student)
  transfer_sender_bank TEXT,        -- Sending institution (e.g. GTBank, Zenith, Kuda, Access)
  transfer_session_id TEXT UNIQUE,  -- Unique 12-30 digit NIP session ID (prevents receipt reuse)
  transfer_payer_relationship TEXT, -- 'self', 'parent', 'sponsor', 'other'
  transfer_date TIMESTAMPTZ,
  
  -- Clearance Authorization
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_reg_no ON transactions(reg_no);
CREATE INDEX IF NOT EXISTS idx_transactions_matric ON transactions(matric_number);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_session_id ON transactions(transfer_session_id);

-- 4. receipts (1-to-1 idempotent receipt record generated ONLY on verified 'success' transactions)
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT UNIQUE NOT NULL, -- e.g. 'FINSA-26-00104'
  transaction_id UUID UNIQUE NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  reg_no TEXT NOT NULL,
  matric_number TEXT,
  verification_hash TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipts_number ON receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_hash ON receipts(verification_hash);

-- 5. audit_logs (Immutable trail of admin fee updates, transfer approvals, and manual clearance)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
