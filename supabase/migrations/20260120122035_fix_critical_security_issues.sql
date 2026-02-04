/*
  # Fix Critical Security Issues
  
  ## Overview
  This migration addresses critical security vulnerabilities and performance issues
  identified in the database schema and RLS policies.
  
  ## Security Fixes
  
  ### 1. Replace Unrestricted RLS Policies
  All tables had policies with `USING (true)` which completely bypassed RLS security.
  New policies now require admin authentication for all write operations:
  
  **Tables Updated:**
  - `members`: Only admins can insert, update, delete. Anyone can read.
  - `monthly_payments`: Only admins can insert, update, delete. Anyone can read.
  - `income`: Only admins can insert, update, delete. Anyone can read.
  - `expenses`: Only admins can insert, update, delete. Anyone can read.
  - `settings`: Only admins can update. Anyone can read.
  - `monthly_cash`: Policies already fixed in previous migration but verified.
  
  ### 2. Fix Auth Function Performance Issues
  Replaced direct `auth.uid()` calls with `(select auth.uid())` in admin_users policies
  to prevent re-evaluation for each row, improving query performance at scale.
  
  **Policies Updated:**
  - `admin_users`: "Admins can add new admins"
  - `admin_users`: "Admins can remove admins"
  
  ### 3. Fix is_admin Function Search Path
  Added `SET search_path = public, auth` to is_admin() function to fix mutable
  search path security issue.
  
  ## Performance Optimizations
  
  ### 4. Remove Duplicate Indexes
  Dropped duplicate indexes that were causing unnecessary overhead:
  - Dropped `idx_expenses_date` (duplicate of `idx_expenses_year_month`)
  - Dropped `idx_income_date` (duplicate of `idx_income_year_month`)
  
  ### 5. Remove Unused Indexes
  Dropped indexes that are not being used by any queries:
  - `idx_members_active`
  - `idx_monthly_payments_member_year_month`
  - `idx_monthly_payments_year`
  - `idx_monthly_payments_member`
  
  ## Important Notes
  - All write operations now require admin authentication via is_admin() function
  - Read operations remain public for dashboard viewing
  - Performance improvements from fixing auth function calls and removing unused indexes
  - Security is now properly enforced at the database level
*/

-- ============================================================================
-- 1. DROP ALL INSECURE POLICIES
-- ============================================================================

-- Members table
DROP POLICY IF EXISTS "Allow public insert members" ON members;
DROP POLICY IF EXISTS "Allow public update members" ON members;
DROP POLICY IF EXISTS "Allow public delete members" ON members;

-- Monthly payments table
DROP POLICY IF EXISTS "Allow public insert monthly_payments" ON monthly_payments;
DROP POLICY IF EXISTS "Allow public update monthly_payments" ON monthly_payments;
DROP POLICY IF EXISTS "Allow public delete monthly_payments" ON monthly_payments;

-- Income table
DROP POLICY IF EXISTS "Allow public insert income" ON income;
DROP POLICY IF EXISTS "Allow public update income" ON income;
DROP POLICY IF EXISTS "Allow public delete income" ON income;

-- Expenses table
DROP POLICY IF EXISTS "Allow public insert expenses" ON expenses;
DROP POLICY IF EXISTS "Allow public update expenses" ON expenses;
DROP POLICY IF EXISTS "Allow public delete expenses" ON expenses;

-- Settings table
DROP POLICY IF EXISTS "Allow public update settings" ON settings;

-- Monthly cash table (fix from previous migration)
DROP POLICY IF EXISTS "Anyone can insert monthly cash" ON monthly_cash;
DROP POLICY IF EXISTS "Anyone can update monthly cash" ON monthly_cash;
DROP POLICY IF EXISTS "Anyone can delete monthly cash" ON monthly_cash;

-- ============================================================================
-- 2. FIX is_admin FUNCTION (Fix search path security issue)
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  );
END;
$$;

-- ============================================================================
-- 3. CREATE SECURE RLS POLICIES (Admin-only write access)
-- ============================================================================

-- MEMBERS TABLE
CREATE POLICY "Admins can insert members"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update members"
  ON members FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete members"
  ON members FOR DELETE
  TO authenticated
  USING (is_admin());

-- MONTHLY PAYMENTS TABLE
CREATE POLICY "Admins can insert monthly payments"
  ON monthly_payments FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update monthly payments"
  ON monthly_payments FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete monthly payments"
  ON monthly_payments FOR DELETE
  TO authenticated
  USING (is_admin());

-- INCOME TABLE
CREATE POLICY "Admins can insert income"
  ON income FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update income"
  ON income FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete income"
  ON income FOR DELETE
  TO authenticated
  USING (is_admin());

-- EXPENSES TABLE
CREATE POLICY "Admins can insert expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (is_admin());

-- SETTINGS TABLE
CREATE POLICY "Admins can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 4. FIX ADMIN_USERS POLICIES (Performance optimization)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can add new admins" ON admin_users;
DROP POLICY IF EXISTS "Admins can remove admins" ON admin_users;

CREATE POLICY "Admins can add new admins"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can remove admins"
  ON admin_users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 5. DROP DUPLICATE INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_expenses_date;
DROP INDEX IF EXISTS idx_income_date;

-- ============================================================================
-- 6. DROP UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_members_active;
DROP INDEX IF EXISTS idx_monthly_payments_member_year_month;
DROP INDEX IF EXISTS idx_monthly_payments_year;
DROP INDEX IF EXISTS idx_monthly_payments_member;