-- ============================================================
-- Migration: Update dresses table schema
-- Date: 2026-04-08
-- ============================================================

-- 1. Add new columns
ALTER TABLE public.dresses ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.dresses ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE public.dresses ADD COLUMN IF NOT EXISTS pickup_location_general TEXT;

-- Add status with a temporary default so existing rows get backfilled
ALTER TABLE public.dresses ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'available';

-- 2. Backfill event_type from category for existing rows
UPDATE public.dresses
  SET event_type = category
  WHERE event_type IS NULL AND category IS NOT NULL;

-- 3. Backfill status for any existing rows (the DEFAULT handles this,
--    but be explicit for safety)
UPDATE public.dresses SET status = 'available' WHERE status IS NULL;

-- 4. Migrate listing_type values to the new vocabulary:
--    'sell'      → 'sale'
--    'sell-rent' → 'both'
--    'trade'     → 'sale'  (trade removed from allowed values; convert to sale)
UPDATE public.dresses SET listing_type = 'sale'  WHERE listing_type = 'sell';
UPDATE public.dresses SET listing_type = 'both'  WHERE listing_type = 'sell-rent';
UPDATE public.dresses SET listing_type = 'sale'  WHERE listing_type = 'trade';

-- 5. Update the default for listing_type to match new vocabulary
ALTER TABLE public.dresses ALTER COLUMN listing_type SET DEFAULT 'sale';

-- 6. Add CHECK constraints
ALTER TABLE public.dresses
  ADD CONSTRAINT dresses_listing_type_check
  CHECK (listing_type IN ('sale', 'rent', 'both'));

ALTER TABLE public.dresses
  ADD CONSTRAINT dresses_status_check
  CHECK (status IN ('available', 'pending', 'rented', 'sold', 'inactive'));

-- 7. updated_at trigger already exists from the initial migration
--    (dresses_updated_at BEFORE UPDATE), so no action needed.
