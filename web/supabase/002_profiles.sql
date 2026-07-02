-- ShowClutch — user profiles (foundation)
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Depends on Supabase Auth (auth.users) which exists by default.

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique,
  city       text,
  role       text,               -- 'buyer' | 'seller' | 'both'
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Profiles are publicly readable (usernames/ratings show on listings),
-- but a user can only insert/update their own row.
create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Automatically create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
