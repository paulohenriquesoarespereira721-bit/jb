/*
  # Allow Anonymous Access to Monthly Cash

  1. Changes
    - Update monthly_cash policies to allow anonymous (anon key) access
    - This is needed because the app uses localStorage authentication
      instead of Supabase Auth, so users are not authenticated in Supabase

  Note: Access control is handled in the frontend via localStorage.
*/

DROP POLICY IF EXISTS "Authenticated users can read monthly cash" ON monthly_cash;
DROP POLICY IF EXISTS "Authenticated users can insert monthly cash" ON monthly_cash;
DROP POLICY IF EXISTS "Authenticated users can update monthly cash" ON monthly_cash;
DROP POLICY IF EXISTS "Authenticated users can delete monthly cash" ON monthly_cash;

CREATE POLICY "Anyone can read monthly cash"
  ON monthly_cash FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert monthly cash"
  ON monthly_cash FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update monthly cash"
  ON monthly_cash FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete monthly cash"
  ON monthly_cash FOR DELETE
  USING (true);