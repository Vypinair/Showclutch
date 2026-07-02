-- ShowClutch — waitlist table
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create table if not exists public.waitlist_signups (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text not null unique,
  phone      text,
  city       text,
  role       text,
  brands     text[],
  created_at timestamptz not null default now()
);

-- Lock the table down with Row Level Security.
alter table public.waitlist_signups enable row level security;

-- Allow the public signup form (anon key) to INSERT rows only.
-- No SELECT policy is created, so signups cannot be read publicly —
-- you view them from the Supabase dashboard (Table Editor).
create policy "waitlist anon insert"
  on public.waitlist_signups
  for insert
  to anon
  with check (true);
