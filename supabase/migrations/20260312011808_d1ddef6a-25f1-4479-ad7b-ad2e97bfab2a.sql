
-- 1. Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  university TEXT DEFAULT '',
  verification_status BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view profiles
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 2. Dresses table
CREATE TABLE public.dresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  size TEXT NOT NULL,
  color TEXT DEFAULT '',
  condition TEXT DEFAULT 'Good',
  category TEXT NOT NULL DEFAULT 'Formal',
  image_urls TEXT[] DEFAULT '{}',
  purchase_price NUMERIC(10,2) DEFAULT 0,
  rental_price_per_day NUMERIC(10,2) DEFAULT 0,
  university TEXT DEFAULT '',
  is_available BOOLEAN NOT NULL DEFAULT true,
  listing_type TEXT NOT NULL DEFAULT 'sell',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dresses ENABLE ROW LEVEL SECURITY;

-- Anyone can view available dresses
CREATE POLICY "Anyone can view dresses"
  ON public.dresses FOR SELECT
  USING (true);

-- Verified users can insert their own dresses
CREATE POLICY "Verified users can insert dresses"
  ON public.dresses FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND (SELECT verification_status FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Owners can update their own dresses
CREATE POLICY "Owners can update own dresses"
  ON public.dresses FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Owners can delete their own dresses
CREATE POLICY "Owners can delete own dresses"
  ON public.dresses FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- 3. Rentals table
CREATE TABLE public.rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dress_id UUID NOT NULL REFERENCES public.dresses(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

-- Renters can view their own rentals
CREATE POLICY "Users can view own rentals"
  ON public.rentals FOR SELECT
  TO authenticated
  USING (
    auth.uid() = renter_id
    OR auth.uid() IN (SELECT owner_id FROM public.dresses WHERE id = dress_id)
  );

-- Authenticated users can create rentals
CREATE POLICY "Authenticated users can create rentals"
  ON public.rentals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = renter_id);

-- Involved parties can update rental status
CREATE POLICY "Involved parties can update rentals"
  ON public.rentals FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = renter_id
    OR auth.uid() IN (SELECT owner_id FROM public.dresses WHERE id = dress_id)
  );

-- 4. Orders table (permanent sales)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dress_id UUID NOT NULL REFERENCES public.dresses(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  final_price NUMERIC(10,2) NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Buyers and dress owners can view orders
CREATE POLICY "Involved parties can view orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    auth.uid() = buyer_id
    OR auth.uid() IN (SELECT owner_id FROM public.dresses WHERE id = dress_id)
  );

-- Authenticated users can create orders
CREATE POLICY "Authenticated users can create orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- 5. Trigger to auto-create profile on signup with .edu verification
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, verification_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.email LIKE '%.edu' THEN true ELSE false END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER dresses_updated_at BEFORE UPDATE ON public.dresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER rentals_updated_at BEFORE UPDATE ON public.rentals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
