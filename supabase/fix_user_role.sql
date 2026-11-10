-- Ocean Haven — lock down user roles on an EXISTING Supabase project
-- Run once in the Supabase SQL Editor. Safe to re-run. (supabase/schema.sql
-- already contains these changes for new projects.)

-- 1. Signup can no longer choose a role: every new account is a 'user'.
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

-- 2. Logged-in users may edit only their display fields, never their role.
REVOKE INSERT, UPDATE ON public.users FROM anon, authenticated;
GRANT UPDATE (name, phone, avatar) ON public.users TO authenticated;

-- 3. Rows are created only by the trigger above; clients cannot insert them.
DROP POLICY IF EXISTS "Service role insert users" ON public.users;

-- 4. Second line of defence, independent of who granted the privileges above
--    (REVOKE only removes grants made by the role running it): a trigger that
--    rejects any role change requested by a client.
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

-- To make someone an admin, run (as here, in the SQL Editor):
--   UPDATE public.users SET role = 'admin' WHERE email = 'hello@oceanhavenhotel.com';

-- 5. Check: there should be no table-wide INSERT/UPDATE for anon, authenticated
--    or PUBLIC (rows with column_name NULL), and the trigger should be listed.
SELECT 'grant' AS kind, grantee, privilege_type, NULL AS column_name
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'users' AND privilege_type IN ('INSERT', 'UPDATE')
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
UNION ALL
SELECT 'trigger', NULL, NULL, tgname::text
FROM pg_trigger WHERE tgrelid = 'public.users'::regclass AND NOT tgisinternal
ORDER BY 1, 2, 3;
