-- ============================================================
-- Migration: Improve orders table for completed purchases
-- Date: 2026-04-08
-- ============================================================

-- 1. Add new columns
--    seller_id needs to be nullable initially so we can backfill, then we make it NOT NULL.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. Backfill seller_id from dresses.owner_id for any existing rows
UPDATE public.orders
  SET seller_id = d.owner_id
  FROM public.dresses d
  WHERE public.orders.dress_id = d.id
    AND public.orders.seller_id IS NULL;

-- 3. Make seller_id NOT NULL now that existing rows are backfilled
ALTER TABLE public.orders ALTER COLUMN seller_id SET NOT NULL;

-- 4. Add CHECK constraints
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded'));

ALTER TABLE public.orders
  ADD CONSTRAINT orders_final_price_non_negative
  CHECK (final_price >= 0);

-- 5. Wire the updated_at auto-update trigger (function already exists)
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 6. Update RLS policies to also use the new seller_id column directly
--    (instead of sub-querying dresses.owner_id every time)

-- Drop the old SELECT policy and recreate with seller_id
DROP POLICY IF EXISTS "Involved parties can view orders" ON public.orders;
CREATE POLICY "Involved parties can view orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Add UPDATE policy so seller can update order status
CREATE POLICY "Seller can update order status"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);
