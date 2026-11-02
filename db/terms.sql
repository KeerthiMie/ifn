-- Terms & Conditions compliance fields (DPDP Act, 2023)
alter table public.profiles
  add column if not exists terms_step1_accepted boolean not null default false,
  add column if not exists terms_step1_accepted_at timestamptz,
  add column if not exists terms_step2_accepted boolean not null default false,
  add column if not exists terms_step2_accepted_at timestamptz,
  add column if not exists terms_step3_accepted boolean not null default false,
  add column if not exists terms_step3_accepted_at timestamptz,
  add column if not exists terms_version integer not null default 0;

-- Grant update permissions on terms columns to authenticated members
grant update (
  terms_step1_accepted,
  terms_step1_accepted_at,
  terms_step2_accepted,
  terms_step2_accepted_at,
  terms_step3_accepted,
  terms_step3_accepted_at,
  terms_version
) on public.profiles to authenticated;
