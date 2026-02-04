/*
  # Performance Optimization - Add Database Indexes

  1. Purpose
    - Add indexes to frequently queried columns for faster data retrieval
    - Dramatically improve query performance across all tables
    - Optimize real-time updates and large dataset queries

  2. Indexes Added
    - `members`: Index on active status for filtering active members
    - `monthly_payments`: Composite index on (member_id, year, month) for payment lookups
    - `monthly_payments`: Index on year for yearly filtering
    - `income`: Composite index on (year, month) for monthly income queries
    - `expenses`: Composite index on (year, month) for monthly expense queries
    - `income`: Index on related_payment_id for payment tracking
    
  3. Performance Impact
    - Reduces query time from O(n) to O(log n)
    - Speeds up table scans and joins
    - Improves dashboard load time
    - Accelerates real-time data synchronization
*/

CREATE INDEX IF NOT EXISTS idx_members_active 
  ON members(active);

CREATE INDEX IF NOT EXISTS idx_monthly_payments_member_year_month 
  ON monthly_payments(member_id, year, month);

CREATE INDEX IF NOT EXISTS idx_monthly_payments_year 
  ON monthly_payments(year);

CREATE INDEX IF NOT EXISTS idx_income_year_month 
  ON income(year, month);

CREATE INDEX IF NOT EXISTS idx_expenses_year_month 
  ON expenses(year, month);

CREATE INDEX IF NOT EXISTS idx_income_related_payment 
  ON income(related_payment_id);
