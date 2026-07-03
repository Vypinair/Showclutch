-- ShowClutch — sale formats, category, Make-an-Offer, and Direct Buy updates.
-- Idempotent. Run once in Supabase SQL Editor.

-- ---------- listings: add category, widen type to the 3 sale formats ----------
alter table public.listings add column if not exists category text;
alter table public.listings drop constraint if exists listings_type_check;
alter table public.listings add constraint listings_type_check
  check (type in ('auction','direct','offer','bin','exchange','showoff'));

-- ---------- orders: widen source ----------
alter table public.orders drop constraint if exists orders_source_check;
alter table public.orders add constraint orders_source_check
  check (source in ('auction','bin','direct','offer','exchange','wanted'));

-- ---------- Make an Offer: price offers ----------
create table if not exists public.price_offers (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id   uuid not null references public.profiles(id) on delete cascade,
  amount     numeric(12,2) not null,
  message    text,
  status     text not null default 'pending' check (status in ('pending','accepted','declined','countered')),
  created_at timestamptz not null default now()
);
alter table public.price_offers enable row level security;
drop policy if exists "offers select involved" on public.price_offers;
create policy "offers select involved" on public.price_offers for select
  using (buyer_id = auth.uid()
    or exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()));
drop policy if exists "offers insert own" on public.price_offers;
create policy "offers insert own" on public.price_offers for insert with check (buyer_id = auth.uid());

-- Seller accepts an offer -> creates an order, marks listing sold, declines the rest.
create or replace function public.accept_offer(p_offer uuid)
returns void language plpgsql security definer set search_path = public as $$
declare o public.price_offers; l public.listings;
begin
  if auth.uid() is null then raise exception 'You must be signed in'; end if;
  select * into o from public.price_offers where id = p_offer for update;
  if o.id is null then raise exception 'Offer not found'; end if;
  select * into l from public.listings where id = o.listing_id;
  if l.seller_id <> auth.uid() then raise exception 'Only the seller can accept this offer'; end if;
  if l.status <> 'active' then raise exception 'This item is no longer available'; end if;

  insert into public.orders (listing_id, buyer_id, seller_id, amount, source, escrow_status)
    values (o.listing_id, o.buyer_id, l.seller_id, o.amount, 'offer', 'pending');
  update public.price_offers set status = 'accepted' where id = p_offer;
  update public.price_offers set status = 'declined'
    where listing_id = o.listing_id and id <> p_offer and status = 'pending';
  update public.listings set status = 'sold' where id = o.listing_id;
end; $$;
grant execute on function public.accept_offer(uuid) to authenticated;

-- ---------- Direct Buy: buy_now without the monthly cap (commons/bulk) ----------
create or replace function public.buy_now(p_listing uuid)
returns void language plpgsql security definer set search_path = public as $$
declare l public.listings; a public.auctions;
begin
  if auth.uid() is null then raise exception 'You must be signed in'; end if;
  select * into l from public.listings where id = p_listing;
  if l.id is null then raise exception 'Listing not found'; end if;
  if l.seller_id = auth.uid() then raise exception 'You cannot buy your own listing'; end if;
  if l.status <> 'active' then raise exception 'This item is no longer available'; end if;
  select * into a from public.auctions where listing_id = p_listing for update;
  if a.id is null or a.bin_price is null then raise exception 'This listing is not a Direct Buy'; end if;

  insert into public.bin_purchases (buyer_id, listing_id) values (auth.uid(), p_listing);
  insert into public.orders (listing_id, buyer_id, seller_id, amount, source, escrow_status)
    values (p_listing, auth.uid(), l.seller_id, a.bin_price, 'direct', 'pending');
  update public.listings set status = 'sold' where id = p_listing;
  update public.auctions set status = 'ended' where listing_id = p_listing;
end; $$;
grant execute on function public.buy_now(uuid) to authenticated;
