-- ShowClutch — full foundation schema (idempotent; safe to re-run).
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Creates every marketplace table with Row Level Security. Supersedes 002_profiles.sql.

-- ============================================================ PROFILES
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique,
  full_name   text,
  city        text,
  role        text check (role in ('buyer','seller','both')),
  avatar_url  text,
  is_seller   boolean not null default false,
  rating      numeric(3,2) not null default 0,
  sales_count int not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles select all" on public.profiles;
create policy "profiles select all" on public.profiles for select using (true);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================ LISTINGS
create table if not exists public.listings (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references public.profiles(id) on delete cascade,
  brand       text,
  model       text,
  series      text,
  condition   text,
  scale       text,
  description text,
  tags        text[] default '{}',
  type        text not null default 'auction' check (type in ('auction','bin','exchange','showoff')),
  status      text not null default 'active' check (status in ('draft','active','sold','closed')),
  created_at  timestamptz not null default now()
);
alter table public.listings enable row level security;
drop policy if exists "listings select public or own" on public.listings;
create policy "listings select public or own" on public.listings for select
  using (status <> 'draft' or seller_id = auth.uid());
drop policy if exists "listings insert own" on public.listings;
create policy "listings insert own" on public.listings for insert with check (seller_id = auth.uid());
drop policy if exists "listings update own" on public.listings;
create policy "listings update own" on public.listings for update using (seller_id = auth.uid());
drop policy if exists "listings delete own" on public.listings;
create policy "listings delete own" on public.listings for delete using (seller_id = auth.uid());

-- ============================================================ LISTING MEDIA
create table if not exists public.listing_media (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  kind       text not null default 'image' check (kind in ('image','video')),
  url        text not null,
  position   int not null default 0
);
alter table public.listing_media enable row level security;
drop policy if exists "media select all" on public.listing_media;
create policy "media select all" on public.listing_media for select using (true);
drop policy if exists "media manage own" on public.listing_media;
create policy "media manage own" on public.listing_media for all
  using (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()));

-- ============================================================ AUCTIONS
create table if not exists public.auctions (
  id                uuid primary key default gen_random_uuid(),
  listing_id        uuid not null unique references public.listings(id) on delete cascade,
  start_at          timestamptz,
  end_at            timestamptz,
  start_bid         numeric(12,2) not null default 0,
  reserve_price     numeric(12,2),
  bin_price         numeric(12,2),
  current_bid       numeric(12,2),
  current_bidder_id uuid references public.profiles(id),
  bid_count         int not null default 0,
  status            text not null default 'scheduled' check (status in ('scheduled','live','ended','cancelled')),
  created_at        timestamptz not null default now()
);
alter table public.auctions enable row level security;
drop policy if exists "auctions select all" on public.auctions;
create policy "auctions select all" on public.auctions for select using (true);
drop policy if exists "auctions manage own" on public.auctions;
create policy "auctions manage own" on public.auctions for all
  using (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()));

-- ============================================================ BIDS
create table if not exists public.bids (
  id         uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  bidder_id  uuid not null references public.profiles(id) on delete cascade,
  amount     numeric(12,2) not null,
  is_proxy   boolean not null default false,
  max_proxy  numeric(12,2),
  created_at timestamptz not null default now()
);
alter table public.bids enable row level security;
drop policy if exists "bids select all" on public.bids;
create policy "bids select all" on public.bids for select using (true);
drop policy if exists "bids insert own" on public.bids;
create policy "bids insert own" on public.bids for insert with check (bidder_id = auth.uid());

-- ============================================================ BUY-IT-NOW PURCHASES (5/month limit)
create table if not exists public.bin_purchases (
  id         uuid primary key default gen_random_uuid(),
  buyer_id   uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.bin_purchases enable row level security;
drop policy if exists "bin select own" on public.bin_purchases;
create policy "bin select own" on public.bin_purchases for select using (buyer_id = auth.uid());
drop policy if exists "bin insert own" on public.bin_purchases;
create policy "bin insert own" on public.bin_purchases for insert with check (buyer_id = auth.uid());

-- ============================================================ EXCHANGE OFFERS
create table if not exists public.exchange_offers (
  id                uuid primary key default gen_random_uuid(),
  listing_id        uuid not null references public.listings(id) on delete cascade,
  from_user         uuid not null references public.profiles(id) on delete cascade,
  offered_brand     text,
  offered_item      text,
  offered_condition text,
  cash_topup        numeric(12,2) default 0,
  status            text not null default 'open' check (status in ('open','proposed','accepted','declined','cancelled')),
  created_at        timestamptz not null default now()
);
alter table public.exchange_offers enable row level security;
drop policy if exists "exchange select involved" on public.exchange_offers;
create policy "exchange select involved" on public.exchange_offers for select
  using (from_user = auth.uid()
    or exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()));
drop policy if exists "exchange insert own" on public.exchange_offers;
create policy "exchange insert own" on public.exchange_offers for insert with check (from_user = auth.uid());
drop policy if exists "exchange update involved" on public.exchange_offers;
create policy "exchange update involved" on public.exchange_offers for update
  using (from_user = auth.uid()
    or exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()));

-- ============================================================ MOST WANTED — REQUESTS
create table if not exists public.wanted_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  brand       text,
  model       text,
  condition   text,
  notes       text,
  open_budget boolean not null default true,
  status      text not null default 'hunting' check (status in ('hunting','fulfilled','closed')),
  created_at  timestamptz not null default now()
);
alter table public.wanted_requests enable row level security;
drop policy if exists "wanted select all" on public.wanted_requests;
create policy "wanted select all" on public.wanted_requests for select using (true);
drop policy if exists "wanted insert own" on public.wanted_requests;
create policy "wanted insert own" on public.wanted_requests for insert with check (user_id = auth.uid());
drop policy if exists "wanted update own" on public.wanted_requests;
create policy "wanted update own" on public.wanted_requests for update using (user_id = auth.uid());

-- ============================================================ MOST WANTED — OFFERS
create table if not exists public.wanted_offers (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.wanted_requests(id) on delete cascade,
  seller_id  uuid not null references public.profiles(id) on delete cascade,
  price      numeric(12,2),
  condition  text,
  note       text,
  status     text not null default 'offered' check (status in ('offered','accepted','declined')),
  created_at timestamptz not null default now()
);
alter table public.wanted_offers enable row level security;
drop policy if exists "wanted offers select involved" on public.wanted_offers;
create policy "wanted offers select involved" on public.wanted_offers for select
  using (seller_id = auth.uid()
    or exists (select 1 from public.wanted_requests r where r.id = request_id and r.user_id = auth.uid()));
drop policy if exists "wanted offers insert own" on public.wanted_offers;
create policy "wanted offers insert own" on public.wanted_offers for insert with check (seller_id = auth.uid());
drop policy if exists "wanted offers update involved" on public.wanted_offers;
create policy "wanted offers update involved" on public.wanted_offers for update
  using (seller_id = auth.uid()
    or exists (select 1 from public.wanted_requests r where r.id = request_id and r.user_id = auth.uid()));

-- ============================================================ ORDERS
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid references public.listings(id),
  buyer_id      uuid not null references public.profiles(id),
  seller_id     uuid not null references public.profiles(id),
  amount        numeric(12,2) not null,
  source        text check (source in ('auction','bin','exchange','wanted')),
  escrow_status text not null default 'pending' check (escrow_status in ('pending','held','released','refunded')),
  created_at    timestamptz not null default now()
);
alter table public.orders enable row level security;
drop policy if exists "orders select involved" on public.orders;
create policy "orders select involved" on public.orders for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());
drop policy if exists "orders insert buyer" on public.orders;
create policy "orders insert buyer" on public.orders for insert with check (buyer_id = auth.uid());
drop policy if exists "orders update involved" on public.orders;
create policy "orders update involved" on public.orders for update
  using (buyer_id = auth.uid() or seller_id = auth.uid());

-- ============================================================ SHIPMENTS
create table if not exists public.shipments (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  provider    text,
  tracking_no text,
  label_url   text,
  status      text,
  created_at  timestamptz not null default now()
);
alter table public.shipments enable row level security;
drop policy if exists "shipments select involved" on public.shipments;
create policy "shipments select involved" on public.shipments for select
  using (exists (select 1 from public.orders o
    where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())));

-- ============================================================ REVIEWS
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid references public.orders(id) on delete set null,
  rater_id   uuid not null references public.profiles(id) on delete cascade,
  ratee_id   uuid not null references public.profiles(id) on delete cascade,
  stars      int not null check (stars between 1 and 5),
  body       text,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
drop policy if exists "reviews select all" on public.reviews;
create policy "reviews select all" on public.reviews for select using (true);
drop policy if exists "reviews insert own" on public.reviews;
create policy "reviews insert own" on public.reviews for insert with check (rater_id = auth.uid());

-- ============================================================ SHOW OFF — POSTS / LIKES / COMMENTS
create table if not exists public.showoff_posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  title      text,
  body       text,
  created_at timestamptz not null default now()
);
alter table public.showoff_posts enable row level security;
drop policy if exists "showoff select all" on public.showoff_posts;
create policy "showoff select all" on public.showoff_posts for select using (true);
drop policy if exists "showoff manage own" on public.showoff_posts;
create policy "showoff manage own" on public.showoff_posts for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.showoff_likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.showoff_posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
alter table public.showoff_likes enable row level security;
drop policy if exists "likes select all" on public.showoff_likes;
create policy "likes select all" on public.showoff_likes for select using (true);
drop policy if exists "likes manage own" on public.showoff_likes;
create policy "likes manage own" on public.showoff_likes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.showoff_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.showoff_posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
alter table public.showoff_comments enable row level security;
drop policy if exists "comments select all" on public.showoff_comments;
create policy "comments select all" on public.showoff_comments for select using (true);
drop policy if exists "comments insert own" on public.showoff_comments;
create policy "comments insert own" on public.showoff_comments for insert with check (user_id = auth.uid());
drop policy if exists "comments delete own" on public.showoff_comments;
create policy "comments delete own" on public.showoff_comments for delete using (user_id = auth.uid());

-- ============================================================ COMMUNITY — FORUM POSTS / REPLIES
create table if not exists public.forum_posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  category   text,
  title      text not null,
  body       text,
  created_at timestamptz not null default now()
);
alter table public.forum_posts enable row level security;
drop policy if exists "forum select all" on public.forum_posts;
create policy "forum select all" on public.forum_posts for select using (true);
drop policy if exists "forum manage own" on public.forum_posts;
create policy "forum manage own" on public.forum_posts for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.forum_replies (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.forum_posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
alter table public.forum_replies enable row level security;
drop policy if exists "replies select all" on public.forum_replies;
create policy "replies select all" on public.forum_replies for select using (true);
drop policy if exists "replies manage own" on public.forum_replies;
create policy "replies manage own" on public.forum_replies for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
