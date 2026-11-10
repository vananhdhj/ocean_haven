-- Ocean Haven Hotel — PostgreSQL schema for Supabase
-- Run this in the Supabase SQL Editor
--
-- Supabase only handles authentication and user profiles (role: user/admin).
-- Rooms, bookings, payments, booking history and AI search data live in
-- SQL Server: see database/sqlserver/.

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
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users: own profile
CREATE POLICY "Users read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
-- No INSERT policy: rows are created only by handle_new_user() below, which
-- runs as the table owner and is not subject to RLS.

-- RLS chooses the rows; column privileges choose what may change in them.
-- Without this, "Users update own profile" lets anyone set their own role to 'admin'.
REVOKE INSERT, UPDATE ON public.users FROM anon, authenticated;
GRANT UPDATE (name, phone, avatar) ON public.users TO authenticated;

-- Second line of defence, independent of privilege grants: reject any role
-- change requested by a client (anon/authenticated).
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Not SECURITY DEFINER on purpose: current_user is the caller's role, which
  -- is 'anon' or 'authenticated' for every request made with a user's token.
  IF NEW.role IS DISTINCT FROM OLD.role AND current_user IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'Changing the role is not allowed' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS users_prevent_role_change ON public.users;
CREATE TRIGGER users_prevent_role_change
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();

-- ============================================================
-- TRIGGER: Auto-create user profile on auth signup
-- raw_user_meta_data is whatever the client sent to signUp(), so it is used
-- only for display fields. Every new account is a 'user'; admins are
-- promoted by hand (SQL Editor or service role), never through signup.
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
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
