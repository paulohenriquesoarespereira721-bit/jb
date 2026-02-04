/*
  # Revert to Public Access for Local Authentication
  
  ## Overview
  This migration reverts RLS policies to allow public access because the application
  uses local authentication (localStorage) instead of Supabase Auth.
  
  ## Context
  The previous migration implemented admin-only policies that depend on Supabase Auth
  (auth.uid() and admin_users table). However, the frontend application uses a simple
  password-based authentication stored in localStorage, not Supabase Auth.
  
  ## Changes Made
  
  ### 1. Drop Admin-Only Policies
  Remove all policies that require is_admin() function, which depends on Supabase Auth.
  
  ### 2. Restore Public Access Policies
  Create new policies that allow anonymous and authenticated users to perform all operations.
  This is necessary because:
  - No users exist in auth.users table
  - auth.uid() always returns NULL
  - Frontend uses localStorage for authentication
  
  ### 3. Keep Read Policies
  Read policies remain unchanged as they already allow public access.
  
  ## Security Note
  ⚠️ WARNING: This configuration allows unrestricted database access from the client.
  This is acceptable for internal applications with controlled access, but should be
  replaced with proper Supabase Auth implementation for production use.
  
  ## Future Improvement
  To properly secure this application:
  1. Implement Supabase email/password authentication
  2. Store admin user IDs in admin_users table
  3. Re-enable admin-only policies for write operations
*/

-- ============================================================================
-- 1. DROP ADMIN-ONLY POLICIES
-- ============================================================================

-- Members table
DROP POLICY IF EXISTS "Admins can insert members" ON members;
DROP POLICY IF EXISTS "Admins can update members" ON members;
DROP POLICY IF EXISTS "Admins can delete members" ON members;

-- Monthly payments table
DROP POLICY IF EXISTS "Admins can insert monthly payments" ON monthly_payments;
DROP POLICY IF EXISTS "Admins can update monthly payments" ON monthly_payments;
DROP POLICY IF EXISTS "Admins can delete monthly payments" ON monthly_payments;

-- Income table
DROP POLICY IF EXISTS "Admins can insert income" ON income;
DROP POLICY IF EXISTS "Admins can update income" ON income;
DROP POLICY IF EXISTS "Admins can delete income" ON income;

-- Expenses table
DROP POLICY IF EXISTS "Admins can insert expenses" ON expenses;
DROP POLICY IF EXISTS "Admins can update expenses" ON expenses;
DROP POLICY IF EXISTS "Admins can delete expenses" ON expenses;

-- Settings table
DROP POLICY IF EXISTS "Admins can update settings" ON settings;

-- Monthly cash table
DROP POLICY IF EXISTS "Only admins can insert monthly cash" ON monthly_cash;
DROP POLICY IF EXISTS "Only admins can update monthly cash" ON monthly_cash;
DROP POLICY IF EXISTS "Only admins can delete monthly cash" ON monthly_cash;

-- ============================================================================
-- 2. CREATE PUBLIC ACCESS POLICIES
-- ============================================================================

-- MEMBERS TABLE
CREATE POLICY "Public can insert members"
  ON members FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can update members"
  ON members FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete members"
  ON members FOR DELETE
  TO anon, authenticated
  USING (true);

-- MONTHLY PAYMENTS TABLE
CREATE POLICY "Public can insert monthly payments"
  ON monthly_payments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can update monthly payments"
  ON monthly_payments FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete monthly payments"
  ON monthly_payments FOR DELETE
  TO anon, authenticated
  USING (true);

-- INCOME TABLE
CREATE POLICY "Public can insert income"
  ON income FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can update income"
  ON income FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete income"
  ON income FOR DELETE
  TO anon, authenticated
  USING (true);

-- EXPENSES TABLE
CREATE POLICY "Public can insert expenses"
  ON expenses FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can update expenses"
  ON expenses FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete expenses"
  ON expenses FOR DELETE
  TO anon, authenticated
  USING (true);

-- SETTINGS TABLE
CREATE POLICY "Public can update settings"
  ON settings FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- MONTHLY CASH TABLE
CREATE POLICY "Public can insert monthly cash"
  ON monthly_cash FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can update monthly cash"
  ON monthly_cash FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete monthly cash"
  ON monthly_cash FOR DELETE
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- 3. KEEP PERFORMANCE AND SECURITY FIXES FROM PREVIOUS MIGRATION
-- ============================================================================
-- Note: The following improvements from the previous migration are maintained:
-- - Admin user policies still use (select auth.uid()) for performance
-- - is_admin() function has proper search_path set
-- - Duplicate and unused indexes remain removed