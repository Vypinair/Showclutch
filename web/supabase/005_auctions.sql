-- ShowClutch — auction bidding + buy-now logic as SECURITY DEFINER functions.
-- These let a bidder/buyer update auctions/listings they don't own, but only
-- through validated, atomic operations. Idempotent (create or replace).
-- Run once in Supabase SQL Editor.

-- ---------- place a bid ----------
create or replace function public.place_bid(p_auction uuid, p_amount numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.auctions;
begin
  if auth.uid() is null then raise exception 'You must be signed in to bid'; end if;

  select * into a from public.auctions where id = p_auction for update;
  if a.id is null then raise exception 'Auction not found'; end if;
  if a.status <> 'live' or a.end_at < now() then raise exception 'This auction has ended'; end if;

  if exists (select 1 from public.listings l where l.id = a.listing_id and l.seller_id = auth.uid()) then
    raise exception 'You cannot bid on your own listing';
  end if;

  if a.current_bid is null then
    if p_amount < a.start_bid then raise exception 'Bid must be at least the starting bid'; end if;
  else
    if p_amount <= a.current_bid then raise exception 'Bid must be higher than the current bid'; end if;
  end if;

  insert into public.bids (auction_id, bidder_id, amount)
  values (p_auction, auth.uid(), p_amount);

  update public.auctions
    set current_bid = p_amount,
        current_bidder_id = auth.uid(),
        bid_count = bid_count + 1
    where id = p_auction;
end;
$$;

grant execute on function public.place_bid(uuid, numeric) to authenticated;

-- ---------- buy it now (with 5-per-calendar-month limit) ----------
create or replace function public.buy_now(p_listing uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  l public.listings;
  a public.auctions;
  v_count int;
begin
  if auth.uid() is null then raise exception 'You must be signed in'; end if;

  select * into l from public.listings where id = p_listing;
  if l.id is null then raise exception 'Listing not found'; end if;
  if l.seller_id = auth.uid() then raise exception 'You cannot buy your own listing'; end if;
  if l.status <> 'active' then raise exception 'This item is no longer available'; end if;

  select * into a from public.auctions where listing_id = p_listing for update;
  if a.id is null or a.bin_price is null then
    raise exception 'Buy It Now is not available for this listing';
  end if;

  select count(*) into v_count from public.bin_purchases
    where buyer_id = auth.uid()
      and date_trunc('month', created_at) = date_trunc('month', now());
  if v_count >= 5 then
    raise exception 'You have used all 5 Buy It Now purchases this month. Please use the auction instead.';
  end if;

  insert into public.bin_purchases (buyer_id, listing_id) values (auth.uid(), p_listing);
  insert into public.orders (listing_id, buyer_id, seller_id, amount, source, escrow_status)
    values (p_listing, auth.uid(), l.seller_id, a.bin_price, 'bin', 'pending');
  update public.listings set status = 'sold' where id = p_listing;
  update public.auctions set status = 'ended' where listing_id = p_listing;
end;
$$;

grant execute on function public.buy_now(uuid) to authenticated;
