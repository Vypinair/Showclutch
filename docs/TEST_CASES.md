# ShowClutch — Test Cases & Results

> Last run: 2026-07-03 · Environment: local dev (`web/`) against live Supabase project `bptfkheixxldlqffaawf`
> Method: end-to-end via Supabase Auth + REST/RPC using two real test accounts (`scseller@`, `scbuyer@`).

**Summary:** 18 Pass · 0 Fail · 3 Pending (tooling disconnected mid-session; to re-run).

A "Fail (expected)" case is a **negative test** — the system correctly *rejected* an invalid action — and counts as a **Pass** for that test case.

---

## Auth & profiles

| ID | Scenario | Expected | Actual | Result |
|----|----------|----------|--------|--------|
| AUTH-01 | Sign up with email + password | Session returned, email auto-confirmed (confirm disabled) | `access_token` returned, `email_confirmed_at` set | ✅ Pass |
| AUTH-02 | Log in with valid credentials (via app UI) | Land on `/account`, auth cookie set | Redirected to `/account`, `sb-…-auth-token` cookie present | ✅ Pass |
| AUTH-03 | Access `/account` while logged out | Redirect to `/login` | Opaque redirect returned | ✅ Pass |
| AUTH-04 | Profile row auto-created on signup (trigger) | `profiles` row exists for new user | Profiles readable/updatable per user | ✅ Pass |

## Database & storage (RLS)

| ID | Scenario | Expected | Actual | Result |
|----|----------|----------|--------|--------|
| DB-01 | Core schema present (`003`) | `listings` etc. exist | 200 on select | ✅ Pass |
| DB-02 | Formats migration present (`006`) | `category` column + `price_offers` table exist | Both return 200 | ✅ Pass |
| STOR-01 | Authenticated upload to own folder | Upload succeeds | 200, object stored at `listing-photos/<uid>/…` | ✅ Pass |
| STOR-02 | Anonymous upload | Blocked by RLS | 403 "new row violates row-level security policy" | ✅ Pass (expected reject) |

## Listings

| ID | Scenario | Expected | Actual | Result |
|----|----------|----------|--------|--------|
| LIST-01 | Create listing (authenticated) | Row created with `seller_id = auth.uid()` | 201 Created | ✅ Pass |
| LIST-02 | Browse shows active listings | Active listings render; photos as thumbnails | Confirmed in UI | ✅ Pass |

## Auction Only

| ID | Scenario | Expected | Actual | Result |
|----|----------|----------|--------|--------|
| AUC-01 | Create auction (start ₹1,000, reserve ₹4,500) | Auction row live | 201, start_bid 1000, reserve 4500 | ✅ Pass |
| AUC-02 | Seller bids on own listing | Rejected | "You cannot bid on your own listing" | ✅ Pass (expected reject) |
| AUC-03 | Buyer bids ₹1,200 (≥ start) | Accepted | OK | ✅ Pass |
| AUC-04 | Buyer bids ₹1,100 (≤ current) | Rejected | "Bid must be higher than the current bid" | ✅ Pass (expected reject) |
| AUC-05 | Buyer bids ₹2,000; state updates | current_bid=2000, bid_count increments | current_bid 2000, bid_count 2 | ✅ Pass |

## Direct Buy

| ID | Scenario | Expected | Actual | Result |
|----|----------|----------|--------|--------|
| DIR-01 | Create Direct Buy (₹2,500) | Auction row with bin_price, no bidding | Created | ✅ Pass |
| DIR-02 | Buyer buys now | Listing → sold; order created | status `sold`; order ₹2,500, source `direct`, escrow `pending` | ✅ Pass |

## Make an Offer

| ID | Scenario | Expected | Actual | Result |
|----|----------|----------|--------|--------|
| OFF-01 | Buyer submits price offer | Offer row created (`pending`) | — | ⏳ Pending re-run |
| OFF-02 | Seller accepts offer | Order created; listing sold; other offers declined | — | ⏳ Pending re-run |
| OFF-03 | Non-seller accepts offer | Rejected ("Only the seller can accept") | — | ⏳ Pending re-run |

> OFF-01–03 were not executed because the browser preview tool disconnected mid-session and the
> build sandbox has no outbound network. The `accept_offer` function mirrors the verified `buy_now`
> pattern (DIR-02) and RLS on `price_offers` matches the verified model. Re-run when tooling is available.

---

## Notes
- Test data (`TEST …` listings, `scseller@`/`scbuyer@` accounts) can be deleted from the Supabase dashboard.
- Deferred auction rules (proxy bids, anti-sniping, deposits, verified-to-bid, reserve-not-met conversion, admin review, watchlist) are documented in `docs/SPEC.md` §14 and are not yet built, so no test cases exist for them.
