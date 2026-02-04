/*
  # Create Monthly Cash Table

  1. New Tables
    - `monthly_cash`
      - `id` (uuid, primary key)
      - `month` (integer, 1-12) - The month number
      - `year` (integer) - The year
      - `amount` (numeric) - The cash amount for that month
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `monthly_cash` table
    - Add policy for authenticated users to read all records
    - Add policy for authenticated users to insert records
    - Add policy for authenticated users to update records
    - Add policy for authenticated users to delete records

  3. Indexes
    - Add unique index on (month, year) combination to prevent duplicates
    - Add index on (year, month) for efficient sorting
*/

CREATE TABLE IF NOT EXISTS monthly_cash (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(month, year)
);

ALTER TABLE monthly_cash ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read monthly cash"
  ON monthly_cash FOR SELECT
  TO authenticated
  USING (true);

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

CREATE INDEX IF NOT EXISTS idx_monthly_cash_year_month ON monthly_cash(year DESC, month DESC);