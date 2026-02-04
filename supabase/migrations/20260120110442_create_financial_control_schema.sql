/*
  # Financial Control System Schema

  1. New Tables
    - `members`
      - `id` (uuid, primary key)
      - `name` (text) - Member name
      - `active` (boolean) - Active status
      - `monthly_fee` (numeric) - Monthly membership fee
      - `created_at` (timestamp)
      
    - `monthly_payments`
      - `id` (uuid, primary key)
      - `member_id` (uuid, foreign key)
      - `month` (integer) - Month (1-12)
      - `year` (integer) - Year
      - `amount` (numeric) - Payment amount
      - `status` (text) - 'paid' or 'pending'
      - `paid_at` (timestamp)
      - `created_at` (timestamp)
    
    - `income`
      - `id` (uuid, primary key)
      - `description` (text) - Income description
      - `amount` (numeric) - Amount received
      - `month` (integer) - Month (1-12)
      - `year` (integer) - Year
      - `related_payment_id` (uuid, nullable) - Link to monthly_payment if applicable
      - `created_at` (timestamp)
    
    - `expenses`
      - `id` (uuid, primary key)
      - `description` (text) - Expense description
      - `amount` (numeric) - Amount spent
      - `month` (integer) - Month (1-12)
      - `year` (integer) - Year
      - `created_at` (timestamp)
    
    - `settings`
      - `id` (uuid, primary key)
      - `key` (text, unique) - Setting key
      - `value` (numeric) - Setting value
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean DEFAULT true,
  monthly_fee numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS monthly_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(member_id, month, year)
);

CREATE TABLE IF NOT EXISTS income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount numeric NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  related_payment_id uuid REFERENCES monthly_payments(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount numeric NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Insert default investment setting
INSERT INTO settings (key, value) VALUES ('investment', 0) ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies for public access (since we're using simple auth without Supabase Auth)
CREATE POLICY "Allow public read members"
  ON members FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert members"
  ON members FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update members"
  ON members FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete members"
  ON members FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read monthly_payments"
  ON monthly_payments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert monthly_payments"
  ON monthly_payments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update monthly_payments"
  ON monthly_payments FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete monthly_payments"
  ON monthly_payments FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read income"
  ON income FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert income"
  ON income FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update income"
  ON income FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete income"
  ON income FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read expenses"
  ON expenses FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert expenses"
  ON expenses FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update expenses"
  ON expenses FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete expenses"
  ON expenses FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read settings"
  ON settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public update settings"
  ON settings FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_payments_member ON monthly_payments(member_id);
CREATE INDEX IF NOT EXISTS idx_monthly_payments_date ON monthly_payments(year, month);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(year, month);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(year, month);