/*
  # Create Admin Users Table

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, unique) - Reference to auth.users
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `admin_users` table
    - Add policy for authenticated users to read (so they can check if they're admin)
    - Add policy for admins to insert new admins
    - Add policy for admins to delete admins

  3. Helper Function
    - Create function to check if current user is admin

  4. Update monthly_cash policies
    - Update INSERT, UPDATE, DELETE policies to require admin access
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can check if user is admin"
  ON admin_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can add new admins"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can remove admins"
  ON admin_users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Authenticated users can insert monthly cash" ON monthly_cash;
DROP POLICY IF EXISTS "Authenticated users can update monthly cash" ON monthly_cash;
DROP POLICY IF EXISTS "Authenticated users can delete monthly cash" ON monthly_cash;

CREATE POLICY "Only admins can insert monthly cash"
  ON monthly_cash FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update monthly cash"
  ON monthly_cash FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete monthly cash"
  ON monthly_cash FOR DELETE
  TO authenticated
  USING (is_admin());