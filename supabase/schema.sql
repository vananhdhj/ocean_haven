-- Ocean Haven Hotel — PostgreSQL schema for Supabase
-- Run this in the Supabase SQL Editor

-- ============================================================
-- ENUM-like types via CHECK constraints
-- ============================================================

-- ============================================================
-- USERS (profile table linked to auth.users)
-- ============================================================
CREATE TABLE public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT,
  email      TEXT UNIQUE NOT NULL,
  avatar     TEXT,
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  phone      TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- LOOKUP TABLES
-- ============================================================
CREATE TABLE public.room_types (
  id   TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE public.view_types (
  id   TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE public.bed_types (
  id   TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- ============================================================
-- ROOMS
-- ============================================================
CREATE TABLE public.rooms (
  id            TEXT PRIMARY KEY,
  room_types_id TEXT REFERENCES public.room_types(id) ON DELETE SET NULL,
  view_type_id  TEXT REFERENCES public.view_types(id) ON DELETE SET NULL,
  floor         INT,
  name          TEXT NOT NULL,
  rating        NUMERIC(3,1) DEFAULT 0.0,
  review_count  INT DEFAULT 0,
  size          NUMERIC(10,2),
  max_guests    INT NOT NULL,
  bed_type_id   TEXT REFERENCES public.bed_types(id) ON DELETE SET NULL,
  bed_count     INT,
  description   TEXT,
  price         NUMERIC(15,2) NOT NULL,
  is_active     BOOLEAN DEFAULT true
);

-- ============================================================
-- ROOM IMAGES
-- ============================================================
CREATE TABLE public.room_images (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id    TEXT REFERENCES public.rooms(id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false
);

-- ============================================================
-- AMENITIES
-- ============================================================
CREATE TABLE public.amenities (
  id        TEXT PRIMARY KEY,
  name      TEXT UNIQUE NOT NULL,
  icon_name TEXT
);

CREATE TABLE public.room_amenities (
  room_id    TEXT REFERENCES public.rooms(id) ON DELETE CASCADE,
  amenity_id TEXT REFERENCES public.amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (room_id, amenity_id)
);

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE public.bookings (
  id               TEXT PRIMARY KEY,
  booking_code     TEXT UNIQUE,
  user_id          UUID REFERENCES public.users(id) ON DELETE SET NULL,
  room_id          TEXT REFERENCES public.rooms(id) ON DELETE SET NULL,
  check_in         DATE NOT NULL,
  check_out        DATE NOT NULL,
  guest_count      INT,
  guest_name       TEXT,
  guest_email      TEXT,
  guest_phone      TEXT,
  special_requests TEXT,
  total_price      NUMERIC(15,2),
  status           TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
  hold_expires_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_booking_dates CHECK (check_out > check_in)
);

CREATE INDEX idx_booking_room_dates ON public.bookings (room_id, check_in, check_out);
CREATE INDEX idx_booking_status ON public.bookings (status);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE public.payments (
  id              TEXT PRIMARY KEY,
  booking_id      TEXT UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  payment_method  TEXT,
  transaction_id  TEXT UNIQUE,
  vnpay_order_id  TEXT UNIQUE,
  amount          NUMERIC(15,2),
  status          TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Failed', 'Refunded')),
  paid_at         TIMESTAMPTZ
);

-- ============================================================
-- BOOKING HISTORY
-- ============================================================
CREATE TABLE public.history_booking (
  id         TEXT PRIMARY KEY,
  booking_id TEXT REFERENCES public.bookings(id) ON DELETE CASCADE,
  action     TEXT,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_history_booking ON public.history_booking (booking_id, created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bed_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history_booking ENABLE ROW LEVEL SECURITY;

-- Public read for rooms/types/amenities
CREATE POLICY "Public read room_types" ON public.room_types FOR SELECT USING (true);
CREATE POLICY "Public read view_types" ON public.view_types FOR SELECT USING (true);
CREATE POLICY "Public read bed_types" ON public.bed_types FOR SELECT USING (true);
CREATE POLICY "Public read rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Public read room_images" ON public.room_images FOR SELECT USING (true);
CREATE POLICY "Public read amenities" ON public.amenities FOR SELECT USING (true);
CREATE POLICY "Public read room_amenities" ON public.room_amenities FOR SELECT USING (true);

-- Users: own profile
CREATE POLICY "Users read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role insert users" ON public.users FOR INSERT WITH CHECK (true);

-- Bookings: users see own, admin sees all
CREATE POLICY "Users read own bookings" ON public.bookings FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Users create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own bookings" ON public.bookings FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Payments: users see own, admin sees all
CREATE POLICY "Users read own payments" ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND (b.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
    )
  );
CREATE POLICY "Insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Update payments" ON public.payments FOR UPDATE USING (true);

-- History: same as bookings
CREATE POLICY "Read history" ON public.history_booking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND (b.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
    )
  );
CREATE POLICY "Insert history" ON public.history_booking FOR INSERT WITH CHECK (true);

-- ============================================================
-- TRIGGER: Auto-create user profile on auth signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
