-- ============================================================
-- Migration: Upgrade profiles table to production-ready structure
-- Date: 2026-04-08
-- ============================================================

-- 1. Convert verification_status from BOOLEAN to TEXT
--    Step A: Add a temporary text column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status_new TEXT;

--    Step B: Backfill from the boolean column
UPDATE public.profiles
  SET verification_status_new = CASE
    WHEN verification_status = true THEN 'verified'
    ELSE 'unverified'
  END;

--    Step C: Drop old column, rename new one, set NOT NULL + default
ALTER TABLE public.profiles DROP COLUMN verification_status;
ALTER TABLE public.profiles RENAME COLUMN verification_status_new TO verification_status;
ALTER TABLE public.profiles ALTER COLUMN verification_status SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN verification_status SET DEFAULT 'unverified';

--    Step D: Add CHECK constraint
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_verification_status_check
  CHECK (verification_status IN ('unverified', 'pending', 'verified'));

-- 2. Add new columns
--    email: backfilled from auth.users, with UNIQUE constraint
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

--    Backfill email from auth.users
UPDATE public.profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id
    AND p.email IS NULL;

--    Now make it NOT NULL and UNIQUE
ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

--    username: optional, unique
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

--    last_active_at: nullable timestamp
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- 3. Update the signup trigger to use new text-based verification_status
--    and also populate the email column
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, verification_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    CASE WHEN NEW.email LIKE '%.edu' THEN 'verified' ELSE 'unverified' END
  );
  RETURN NEW;
END;
$$;

-- 4. Update the dresses INSERT policy that checked verification_status = true
--    to now check verification_status = 'verified'
DROP POLICY IF EXISTS "Verified users can insert dresses" ON public.dresses;
CREATE POLICY "Verified users can insert dresses"
  ON public.dresses FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND (SELECT verification_status FROM public.profiles WHERE id = auth.uid()) = 'verified'
  );

-- 5. Update column-level UPDATE grants to include new user-editable columns
--    (verification_status is NOT included — only admins should change it)
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, bio, avatar_url, university, username) ON public.profiles TO authenticated;

-- 6. updated_at trigger already exists (profiles_updated_at), no changes needed.
