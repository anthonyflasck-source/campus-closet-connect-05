-- ============================================================
-- Migration: Improve rentals table
-- Date: 2026-04-08
-- ============================================================

-- 1. Add owner_id (nullable first, then backfill, then NOT NULL)
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

UPDATE public.rentals r
  SET owner_id = d.owner_id
  FROM public.dresses d
  WHERE r.dress_id = d.id
    AND r.owner_id IS NULL;

ALTER TABLE public.rentals ALTER COLUMN owner_id SET NOT NULL;

-- 2. Standardize existing status values to lowercase
UPDATE public.rentals SET status = lower(status);

-- 3. Add CHECK constraints
ALTER TABLE public.rentals
  ADD CONSTRAINT rentals_status_check
  CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled'));

ALTER TABLE public.rentals
  ADD CONSTRAINT rentals_total_price_non_negative
  CHECK (total_price >= 0);

ALTER TABLE public.rentals
  ADD CONSTRAINT rentals_date_range_valid
  CHECK (end_date >= start_date);

-- 4. Update default to lowercase
ALTER TABLE public.rentals ALTER COLUMN status SET DEFAULT 'pending';

-- 5. Update RLS policies to use owner_id directly
DROP POLICY IF EXISTS "Users can view own rentals" ON public.rentals;
CREATE POLICY "Involved parties can view rentals"
  ON public.rentals FOR SELECT
  TO authenticated
  USING (auth.uid() = renter_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Involved parties can update rentals" ON public.rentals;
CREATE POLICY "Involved parties can update rentals"
  ON public.rentals FOR UPDATE
  TO authenticated
  USING (auth.uid() = renter_id OR auth.uid() = owner_id);
