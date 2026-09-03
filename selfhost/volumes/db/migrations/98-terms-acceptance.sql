-- Add terms acceptance columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_step1_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_step1_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_step2_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_step2_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_step3_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_step3_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version integer NOT NULL DEFAULT 1;

-- Grant column-level UPDATE to authenticated role (security_hardening.sql uses column-level grants)
GRANT UPDATE (
  terms_step1_accepted, terms_step1_accepted_at,
  terms_step2_accepted, terms_step2_accepted_at,
  terms_step3_accepted, terms_step3_accepted_at,
  terms_version
) ON public.profiles TO authenticated;