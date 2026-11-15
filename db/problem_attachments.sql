-- Problem Hub Multi-Format Attachments & Schematics
-- Supports schematic images, PDFs, and short audio-visual clips.
-- Enforces a 25MB ceiling on storage and creates problem-files bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'problem-files',
  'problem-files',
  true,
  26214400, -- 25MB ceiling
  array[
    'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'video/mp4', 'video/webm', 'video/ogg',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS policies for problem-files
drop policy if exists "problem files public read" on storage.objects;
create policy "problem files public read" on storage.objects
  for select to authenticated, anon
  using (bucket_id = 'problem-files');

drop policy if exists "problem files insert authenticated" on storage.objects;
create policy "problem files insert authenticated" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'problem-files' and auth.uid() is not null);

drop policy if exists "problem files delete own" on storage.objects;
create policy "problem files delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'problem-files' and owner = auth.uid());

-- Add attachments column to public.problems (jsonb array of attachment metadata)
alter table public.problems add column if not exists attachments jsonb not null default '[]'::jsonb;

-- Update problem_detail and problem_feed RPCs to return attachments, score, and my_vote
drop function if exists public.problem_detail(uuid);
create function public.problem_detail(p_id uuid)
returns table (
  id uuid, title text, description text, tags text[], deadline date, closed boolean,
  created_at timestamptz, author_id uuid, author_name text, author_role text,
  is_mine boolean, solution_count bigint, score bigint, my_vote smallint, attachments jsonb
)
language sql stable security definer set search_path = public
as $$
  select
    p.id, p.title, p.description, p.tags, p.deadline, coalesce(p.closed, false), p.created_at,
    p.author_id, a.name, a.role,
    (p.author_id = auth.uid()),
    coalesce((select count(*) from public.problem_solutions s where s.problem_id = p.id), 0),
    coalesce((select sum(v.value) from public.problem_votes v where v.problem_id = p.id), 0)::bigint,
    (select v.value from public.problem_votes v where v.problem_id = p.id and v.user_id = auth.uid()),
    coalesce(p.attachments, '[]'::jsonb)
  from public.problems p
  join public.profiles a on a.id = p.author_id
  where p.id = p_id
$$;
grant execute on function public.problem_detail(uuid) to authenticated;

drop function if exists public.problem_feed(text);
create function public.problem_feed(p_search text default null)
returns table (
  id uuid, title text, description text, tags text[], deadline date, closed boolean,
  created_at timestamptz, author_id uuid, author_name text, author_role text,
  is_mine boolean, solution_count bigint, i_solved boolean, score bigint, my_vote smallint, attachments jsonb
)
language sql stable security definer set search_path = public
as $$
  select
    p.id, p.title, p.description, p.tags, p.deadline, coalesce(p.closed, false), p.created_at,
    p.author_id, a.name, a.role,
    (p.author_id = auth.uid()),
    coalesce((select count(*) from public.problem_solutions s where s.problem_id = p.id), 0),
    exists (select 1 from public.problem_solutions s where s.problem_id = p.id and s.author_id = auth.uid()),
    coalesce((select sum(v.value) from public.problem_votes v where v.problem_id = p.id), 0)::bigint,
    (select v.value from public.problem_votes v where v.problem_id = p.id and v.user_id = auth.uid()),
    coalesce(p.attachments, '[]'::jsonb)
  from public.problems p
  join public.profiles a on a.id = p.author_id
  where (coalesce(p.closed, false) = false or p.author_id = auth.uid())
    and (
      p_search is null or p_search = ''
      or p.title ilike '%' || p_search || '%'
      or p.description ilike '%' || p_search || '%'
      or exists (select 1 from unnest(p.tags) t where t ilike '%' || p_search || '%')
    )
  order by p.closed asc, p.created_at desc
$$;
grant execute on function public.problem_feed(text) to authenticated;

notify pgrst, 'reload schema';

