-- =============================================================================
-- FINSA ONLINE · COVENANT UNIVERSITY DEPARTMENT OF BANKING & FINANCE
-- Phase 1 Production Schema: Course Dues, Dual-Rail Transactions & QR Receipts
-- =============================================================================

-- 1. students (Hybrid: pre-loaded roster + self-registered students)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matric_number TEXT UNIQUE NOT NULL, -- Normalized uppercase e.g. '22AG031042'
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('100L', '200L', '300L', '400L', 'Postgrad')),
  role_type TEXT NOT NULL DEFAULT 'regular' CHECK (role_type IN ('regular', 'executive')),
  executive_title TEXT,
  is_roster_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_matric ON students(matric_number);
CREATE INDEX IF NOT EXISTS idx_students_level ON students(level);

-- 2. payment_categories (Supports Regular 10,000 vs Executive 15,000 + Phase 2 selectables)
CREATE TABLE IF NOT EXISTS payment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount_naira INTEGER NOT NULL, -- e.g. 10000 for Regular, 15000 for Executive
  target_role TEXT NOT NULL CHECK (target_role IN ('regular', 'executive', 'all')),
  is_mandatory BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  academic_session TEXT NOT NULL DEFAULT '2026/2027',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial Course Dues (Regular: N10,000 | Executive: N15,000)
INSERT INTO payment_categories (slug, title, description, amount_naira, target_role, is_mandatory, is_active, academic_session)
VALUES
  ('finsa-dues-regular-2026', 'FINSA Course & Departmental Dues (Regular)', 'Mandatory 2026/2027 Academic Session Course Dues required for Test 1 & Examination Clearance.', 10000, 'regular', true, true, '2026/2027'),
  ('finsa-dues-executive-2026', 'FINSA Executive Council & Course Dues', 'Mandatory 2026/2027 Academic Session Course & Executive Council Dues required for Test 1 Clearance.', 15000, 'executive', true, true, '2026/2027')
ON CONFLICT (slug) DO NOTHING;

-- 3. transactions (Verified gateway payments + Manual transfer fallback)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL, -- e.g. 'FINSA-TX-2026-849201'
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  matric_number TEXT NOT NULL,
  student_name TEXT NOT NULL,
  level TEXT NOT NULL,
  role_type TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  category_title TEXT NOT NULL,
  amount_naira INTEGER NOT NULL,
  payment_rail TEXT NOT NULL CHECK (payment_rail IN ('paystack', 'bank_transfer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pending_verification', 'success', 'failed')),
  transfer_sender_bank TEXT,
  transfer_session_id TEXT,
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_matric ON transactions(matric_number);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- 4. receipts (1-to-1 idempotent receipt record generated ONLY on verified 'success' transactions)
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT UNIQUE NOT NULL, -- e.g. 'FINSA-26-00104'
  transaction_id UUID UNIQUE NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  matric_number TEXT NOT NULL,
  verification_hash TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now()
);

-- 5. audit_logs (Immutable trail of admin fee updates, transfer approvals, and exports)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
