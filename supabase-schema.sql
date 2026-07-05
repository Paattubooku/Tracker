-- =====================================================
-- Trackr — Supabase Database Schema
-- Personal tracker for water intake and expenses.
-- No authentication required — single-user setup.
-- Run this SQL in the Supabase SQL Editor.
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- WATER ENTRIES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.water_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount INTEGER NOT NULL CHECK (amount > 0),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('glass', 'bottle', 'cup', 'custom')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast daily queries
CREATE INDEX IF NOT EXISTS idx_water_entries_date ON public.water_entries (created_at DESC);

-- =====================================================
-- EXPENSE ENTRIES (Debit only — no credit tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.expense_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast daily/monthly queries
CREATE INDEX IF NOT EXISTS idx_expense_entries_date ON public.expense_entries (created_at DESC);

-- =====================================================
-- USER SETTINGS (single row — no auth)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  daily_water_goal INTEGER DEFAULT 2500,
  reminder_interval_minutes INTEGER DEFAULT 60,
  monthly_budget DECIMAL(10, 2) DEFAULT 2000,
  currency TEXT DEFAULT '$',
  water_unit TEXT DEFAULT 'ml' CHECK (water_unit IN ('ml', 'oz')),
  week_starts_on TEXT DEFAULT 'monday' CHECK (week_starts_on IN ('monday', 'sunday')),
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO public.user_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_settings_update ON public.user_settings;
CREATE TRIGGER on_user_settings_update
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- For personal use: allow all operations without auth
-- =====================================================

-- Water entries: allow all
ALTER TABLE public.water_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all water operations" ON public.water_entries FOR ALL USING (true) WITH CHECK (true);

-- Expense entries: allow all
ALTER TABLE public.expense_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all expense operations" ON public.expense_entries FOR ALL USING (true) WITH CHECK (true);

-- User settings: allow all
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all settings operations" ON public.user_settings FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- Enable realtime for water and expense entries
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.water_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expense_entries;

-- =====================================================
-- USEFUL RPC: Monthly category breakdown
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_monthly_category_breakdown(
  p_month TEXT DEFAULT to_char(NOW(), 'YYYY-MM')
)
RETURNS TABLE (category TEXT, total DECIMAL, percentage DECIMAL) AS $$
DECLARE
  month_total DECIMAL;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO month_total
  FROM public.expense_entries
  WHERE to_char(created_at, 'YYYY-MM') = p_month;

  RETURN QUERY
  SELECT
    e.category,
    SUM(e.amount) AS total,
    CASE WHEN month_total > 0 THEN ROUND((SUM(e.amount) / month_total) * 100, 1) ELSE 0 END AS percentage
  FROM public.expense_entries e
  WHERE to_char(e.created_at, 'YYYY-MM') = p_month
  GROUP BY e.category
  ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
