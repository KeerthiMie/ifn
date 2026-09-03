-- Seed: first-run admin account for local development + fresh production installs.
-- Email:    you@ifheindia.org
-- Password: Test123456!
-- After login the user will be forced to: (1) accept 3-step Terms, (2) change their password.
--
-- SAFE TO RE-RUN: guarded by DO $$ … IF NOT EXISTS so it is idempotent.
-- Run AFTER 98-terms-acceptance.sql and all db/*.sql files are applied.

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Skip if this account already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'you@ifheindia.org') THEN
    RAISE NOTICE 'Seed admin already exists — skipping.';
    RETURN;
  END IF;

  v_user_id := gen_random_uuid();

  -- Insert directly into auth.users (GoTrue table).
  -- encrypted_password: bcrypt(cost=10) hash of "Test123456!"
  -- Token columns must NOT be NULL — GoTrue's Go scanner panics on null varchars.
  INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    phone_change_token
  ) VALUES (
    v_user_id,
    'authenticated',
    'authenticated',
    'you@ifheindia.org',
    crypt('Test123456!', gen_salt('bf', 10)),   -- bcrypt hash generated at run-time
    now(),                                       -- pre-confirmed
    now(),
    now(),
    '{"name":"IFN Admin"}'::jsonb,
    false,
    '', '', '', '', ''                           -- empty strings, never NULL
  );

  -- The handle_new_user trigger fires automatically and creates the profiles row.
  -- Wait a moment for the trigger, then patch role + force password change.
  UPDATE public.profiles
  SET
    role                = 'admin',
    name                = 'IFN Admin',
    must_change_password = true
  WHERE id = v_user_id;

  RAISE NOTICE 'Seed admin created: you@ifheindia.org (temp password: Test123456!)';
END $$;
