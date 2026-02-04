/*
  # Revert Monthly Cash Policies to Authenticated Users

  1. Changes
    - Remove admin-only restrictions from monthly_cash table
    - Allow all authenticated users to manage monthly_cash records
    - Keep admin_users table for future use if Supabase Auth is implemented

  Note: The frontend still controls access via localStorage admin check.
  This migration allows the app to work with the current authentication system
  that uses localStorage instead of Supabase Auth.
*/

DROP POLICY IF EXISTS "Only admins can insert monthly cash" ON monthly_cash;
DROP POLICY IF EXISTS "Only admins can update monthly cash" ON monthly_cash;
DROP POLICY IF EXISTS "Only admins can delete monthly cash" ON monthly_cash;

CREATE POLICY "Authenticated users can insert monthly cash"
  ON monthly_cash FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update monthly cash"
  ON monthly_cash FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete monthly cash"
  ON monthly_cash FOR DELETE
  TO authenticated
  USING (true);