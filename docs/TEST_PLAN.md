# ShowClutch — Master Test Plan

> Version 1.0 · 2026-07-03 · Owner: Vypin
> Scope: the `web/` Next.js application + Supabase backend. Complements `docs/TEST_CASES.md`
> (which records *executed* results). This plan defines the full intended coverage.

---

## 1. Purpose & scope

Validate every implemented feature and the security model of the ShowClutch marketplace,
and define load / non-functional testing for launch readiness.

**In scope (built):** auth & sessions, profiles, listings, photo storage, the three sale
formats (Auction Only, Direct Buy, Make an Offer), bidding & buy-now & offer logic, RLS.
**Out of scope (not built yet):** payments/escrow (Razorpay), shipping (Shiprocket),
Exchange, Most Wanted, Show Off, Community, proxy bidding, anti-sniping, admin tools.
These get their own test cases when built.

### Priority key
`P1` critical (money, security, data integrity) · `P2` core UX · `P3` cosmetic/nice-to-have.

### Test types
Functional · Negative · Error-handling · Security/RLS · Boundary · Data-integrity ·
Performance/Load · Accessibility · Responsive/Cross-browser · Integration · Regression.

---

## 2. Test environments

| Env | URL | Data | Notes |
|-----|-----|------|-------|
| Local dev | `localhost:3000` | Live Supabase (shared) | `npm run dev` in `web/` |
| Production | `showclutch.vercel.app` | Same Supabase | Gated (private) pre-launch |
| DB | Supabase `bptfkheixxldlqffaawf` | Free tier | Watch connection & rate limits |

**Test accounts:** `scseller@` (seller), `scbuyer@` (buyer), plus a third `scthird@` for
concurrency/one-per-buyer tests. Password `Test123456!`. Never use real customer data.

---

## 3. Functional test cases

### 3.1 Authentication & sessions
| ID | Pri | Type | Scenario | Steps | Expected |
|----|-----|------|----------|-------|----------|
| FN-AUTH-01 | P1 | Functional | Email signup | Create account with new email + 6+ char pw | Session created; profile row auto-created; land on `/account` |
| FN-AUTH-02 | P1 | Functional | Email login | Log in with valid credentials | Session cookie set; `/account` shows email |
| FN-AUTH-03 | P1 | Negative | Wrong password | Log in with wrong pw | "Invalid login credentials"; no session |
| FN-AUTH-04 | P1 | Negative | Unconfirmed account (if confirm on) | Sign up with confirm enabled, then log in | "Email not confirmed" |
| FN-AUTH-05 | P1 | Security | Protected route while logged out | Visit `/account` and `/sell` logged out | Redirect to `/login` |
| FN-AUTH-06 | P2 | Functional | Logout | Click Log out | Session cleared; redirect to `/login`; `/account` now blocked |
| FN-AUTH-07 | P2 | Functional | Session persistence | Log in, refresh, reopen tab | Still logged in (cookie session) |
| FN-AUTH-08 | P3 | Functional | Phone OTP (when SMS provider set) | Enter phone → OTP → verify | Logged in *(pending provider)* |

### 3.2 Profiles
| ID | Pri | Type | Scenario | Expected |
|----|-----|------|----------|----------|
| FN-PROF-01 | P2 | Functional | Auto-create on signup | Trigger inserts `profiles` row for new `auth.users` |
| FN-PROF-02 | P1 | Security | Update another user's profile | Blocked by RLS (`auth.uid() = id`) |
| FN-PROF-03 | P2 | Data | Duplicate username | Unique constraint rejects second use |
| FN-PROF-04 | P2 | Functional | Self-heal on first listing | Missing profile is upserted before listing insert |

### 3.3 Listings (catalog)
| ID | Pri | Type | Scenario | Expected |
|----|-----|------|----------|----------|
| FN-LIST-01 | P1 | Functional | Create listing (all fields) | Row created, `seller_id = auth.uid()`, redirect to detail |
| FN-LIST-02 | P1 | Negative | Create without required `model` | Redirect back with "Car name / model is required" |
| FN-LIST-03 | P1 | Security | Create with spoofed `seller_id` | RLS rejects (insert check `seller_id = auth.uid()`) |
| FN-LIST-04 | P2 | Functional | Browse active listings | Only `status = active` (or own drafts) shown, newest first |
| FN-LIST-05 | P2 | Functional | Listing detail | Correct fields, photos, seller, category render |
| FN-LIST-06 | P2 | Negative | Detail of non-existent id | 404 page |
| FN-LIST-07 | P1 | Security | Edit/delete another seller's listing | RLS rejects update/delete |
| FN-LIST-08 | P2 | Functional | Series auto-populates from brand | Selecting brand loads that brand's Series list |
| FN-LIST-09 | P2 | Functional | Rare category → Auction Only | Selecting a rare category locks format to Auction Only |
| FN-LIST-10 | P3 | Functional | Scale default | Solido defaults scale to 1:18 |

### 3.4 Photos / storage
| ID | Pri | Type | Scenario | Expected |
|----|-----|------|----------|----------|
| FN-IMG-01 | P2 | Functional | Upload 1–8 photos | Files stored in `listing-photos/<uid>/`, thumbnails shown |
| FN-IMG-02 | P1 | Security | Upload to another user's folder | RLS rejects (path prefix must be own uid) |
| FN-IMG-03 | P1 | Security | Anonymous upload | 403 RLS |
| FN-IMG-04 | P2 | Boundary | >8 photos | Only first 8 saved as `listing_media` |
| FN-IMG-05 | P3 | Error | Non-image / oversized file | Handled gracefully; error shown, form still usable |
| FN-IMG-06 | P2 | Functional | Public read | Photos load via public URL for anonymous viewers |

### 3.5 Auction Only
| ID | Pri | Type | Scenario | Expected |
|----|-----|------|----------|----------|
| FN-AUC-01 | P1 | Functional | Create auction (start, reserve, duration) | Auction row `live`; end = now + duration; **no BIN** |
| FN-AUC-02 | P1 | Security | Seller bids own listing | Rejected "cannot bid on your own listing" |
| FN-AUC-03 | P1 | Functional | First bid ≥ starting bid | Accepted; current_bid set; bid_count 1 |
| FN-AUC-04 | P1 | Negative | First bid < starting bid | Rejected "at least the starting bid" |
| FN-AUC-05 | P1 | Negative | Bid ≤ current bid | Rejected "must be higher than the current bid" |
| FN-AUC-06 | P1 | Functional | Higher bid | Accepted; current_bid + bid_count update |
| FN-AUC-07 | P1 | Functional | Bid on ended auction | Rejected "this auction has ended" |
| FN-AUC-08 | P2 | Functional | Reserve indicator | Shows "Reserve met" only when current_bid ≥ reserve |
| FN-AUC-09 | P2 | Functional | Countdown timer | Ticks down; shows "Ended" at 0; red under 1h |
| FN-AUC-10 | P2 | Functional | Bid history | Bids listed newest-first with bidder + amount |
| FN-AUC-11 | P1 | Negative | Bid while logged out | Redirect to `/login` |

### 3.6 Direct Buy
| ID | Pri | Type | Scenario | Expected |
|----|-----|------|----------|----------|
| FN-DIR-01 | P1 | Functional | Create Direct Buy (price) | Auction row with bin_price; no bidding UI |
| FN-DIR-02 | P1 | Functional | Buy now | Order created (`direct`, `pending`); listing → `sold`; auction → `ended` |
| FN-DIR-03 | P1 | Security | Buy own listing | Rejected "cannot buy your own listing" |
| FN-DIR-04 | P1 | Negative | Buy an already-sold item | Rejected "no longer available" |
| FN-DIR-05 | P2 | Data | No monthly cap on Direct Buy | Buyer can purchase many (5/mo cap removed) |

### 3.7 Make an Offer
| ID | Pri | Type | Scenario | Expected |
|----|-----|------|----------|----------|
| FN-OFF-01 | P1 | Functional | Submit offer | `price_offers` row `pending`; visible to buyer + seller |
| FN-OFF-02 | P1 | Functional | Seller accepts | Order created (`offer`); listing sold; other pending offers → declined |
| FN-OFF-03 | P1 | Security | Non-seller accepts | Rejected "only the seller can accept" |
| FN-OFF-04 | P1 | Security | View others' offers | Buyer sees only own; seller sees all on their listing |
| FN-OFF-05 | P2 | Negative | Offer ≤ 0 | Rejected "enter a valid offer amount" |
| FN-OFF-06 | P2 | Negative | Offer on sold item | Accept rejected "no longer available" |

---

## 4. Security & RLS test suite (P1)

The database is the last line of defense — these must pass regardless of UI.

| ID | Scenario | Expected |
|----|----------|----------|
| SEC-01 | Anonymous read of `orders`, `bin_purchases`, `price_offers` | Returns no rows (RLS scoped to involved parties) |
| SEC-02 | Buyer reads another buyer's orders | Empty (RLS) |
| SEC-03 | Direct SQL/REST insert into `bids` as non-bidder id | Rejected (`bidder_id = auth.uid()`) |
| SEC-04 | Update `auctions.current_bid` directly (not via `place_bid`) | Rejected unless listing owner (RLS) |
| SEC-05 | Call `place_bid` / `buy_now` / `accept_offer` unauthenticated | Rejected "must be signed in" |
| SEC-06 | Tamper `listing_id`/`seller_id` in requests | RLS ignores client-supplied ownership |
| SEC-07 | Storage: list/download other users' raw uploads | Public read is by design; no write/delete to others |
| SEC-08 | JWT expiry / refresh | Expired token refreshed by proxy; no access with revoked session |
| SEC-09 | SQL injection via text fields (model, tags, message) | Parameterized; no injection (Supabase client) |
| SEC-10 | XSS via listing description / offer message | Rendered as text, not HTML (React escaping) |
| SEC-11 | Private-site gate | With `SITE_GATE_PASSWORD` set, all routes return 401 without Basic auth |
| SEC-12 | Secrets never exposed | Service-role key / Razorpay secret absent from client bundle & repo |

---

## 5. Error-handling & resilience

| ID | Scenario | Expected |
|----|----------|----------|
| ERR-01 | Supabase unreachable / 500 | Friendly error, no crash, form re-usable |
| ERR-02 | Missing/blank Supabase env vars | Clear failure at startup, not silent |
| ERR-03 | Photo upload to missing bucket | Error surfaced ("bucket not found"); rest of form works |
| ERR-04 | Race: two buyers Buy-Now same item | Exactly one order; second gets "no longer available" |
| ERR-05 | Race: two bids same instant | Row lock (`FOR UPDATE`) serializes; no lost/duplicate; correct winner |
| ERR-06 | Double form submit (network lag) | Idempotent-ish; no duplicate orders |
| ERR-07 | Very large payload (long description) | Accepted up to limit or rejected cleanly |
| ERR-08 | Malformed `media` JSON | Ignored; listing still created |

---

## 6. Boundary & edge cases

| ID | Scenario | Expected |
|----|----------|----------|
| EDGE-01 | Bid exactly equal to starting bid (first bid) | Accepted |
| EDGE-02 | Bid = current_bid + 0.01 (min increment) | Accepted (any higher value) |
| EDGE-03 | Auction ends during an in-flight bid | Bid at/after `end_at` rejected |
| EDGE-04 | Reserve = starting bid | "Reserve met" on first valid bid |
| EDGE-05 | Zero / negative / non-numeric prices | Rejected client + server |
| EDGE-06 | Unicode / emoji in model/tags | Stored & displayed correctly |
| EDGE-07 | Listing with no photos | Placeholder shown, no layout break |
| EDGE-08 | 0 bids at auction end | No winner; item unsold (reserve-not-met flow — future) |

---

## 7. Data integrity

| ID | Scenario | Expected |
|----|----------|----------|
| DATA-01 | `orders.amount` matches sale price | Equals bin_price / accepted offer / winning bid |
| DATA-02 | `listing.status` transitions | active → sold on purchase/accept; not reversible without admin |
| DATA-03 | `auction.status` | live → ended on buy/accept; ended on `end_at` |
| DATA-04 | Foreign keys | Deleting a listing cascades media/auction/bids/offers |
| DATA-05 | `bid_count` == count(bids) for auction | Always consistent |
| DATA-06 | One accepted offer per listing | Others auto-declined |

---

## 8. Performance & load testing

**Tools:** k6 or Artillery (API load), Lighthouse (frontend), Vercel Analytics (real traffic).
Run against a **staging Supabase project**, not production, to avoid free-tier throttling.

### 8.1 Scenarios
| ID | Scenario | Load profile | Success criteria |
|----|----------|--------------|------------------|
| LOAD-01 | Browse `/listings` (read-heavy) | 50 → 500 concurrent VUs, 5 min | p95 < 800 ms; error rate < 1% |
| LOAD-02 | Listing detail with photos | 200 concurrent | p95 < 1 s; images via CDN |
| LOAD-03 | **Concurrent bidding on one auction** | 50 VUs bidding same lot | **No lost/duplicate bids**; final winner = highest; `bid_count` correct; row-lock holds |
| LOAD-04 | Listing creation + upload | 20 VUs sustained | No 5xx; storage writes succeed |
| LOAD-05 | Auth token issue/refresh | 100 logins/min | p95 < 1.5 s; no auth errors |
| LOAD-06 | Checkout (when payments built) | 30 concurrent | No double-charge; one order per payment |
| LOAD-07 | Spike test | 0 → 1000 VUs in 30 s | Graceful degradation, recovery |
| LOAD-08 | Soak test | 100 VUs, 1 hour | No memory leak / connection exhaustion |

### 8.2 Constraints to watch
- **Supabase free tier**: limited DB connections & API rate limits — use connection pooling
  (Supavisor); upgrade to Pro before real load.
- **Vercel**: function concurrency & cold starts on Hobby.
- **place_bid `FOR UPDATE`**: verify it serializes correctly under LOAD-03 (the critical test).

### 8.3 Frontend performance (Lighthouse, target ≥ 90)
- LCP < 2.5 s, CLS < 0.1, TBT < 200 ms on the landing + browse pages.
- Image optimization (compress before upload / use `next/image` later).

---

## 9. Accessibility, responsive & cross-browser

| ID | Scenario | Expected |
|----|----------|----------|
| A11Y-01 | Keyboard-only navigation | All forms/buttons reachable & operable |
| A11Y-02 | Screen reader labels | Inputs labelled; images have alt |
| A11Y-03 | Colour contrast (dark theme) | Meets WCAG AA |
| RESP-01 | Mobile (375px) | Nav, forms, grids reflow; no horizontal scroll |
| RESP-02 | Tablet / desktop | Layouts adapt |
| XBROW-01 | Chrome, Safari, Firefox, Edge, iOS/Android | Consistent rendering; **fonts** (MS Gothic falls back off-Windows — fix pre-launch) |

---

## 10. Integration tests

| ID | Integration | Scenario | Expected |
|----|-------------|----------|----------|
| INT-01 | Supabase Auth ↔ app | Login sets cookie the server reads | Session visible SSR |
| INT-02 | Supabase Storage ↔ app | Upload → public URL → render | Round-trips |
| INT-03 | Supabase RPC ↔ app | `place_bid`/`buy_now`/`accept_offer` surface DB errors | Friendly messages via `?error=` |
| INT-04 | Vercel deploy ↔ GitHub | Push to `main` auto-deploys | New build live |
| INT-05 | Razorpay *(future)* | Test-mode order → checkout → verify signature | Order marked paid |
| INT-06 | Shiprocket *(future)* | Generate label; hide addresses | Label URL; privacy preserved |

---

## 11. Regression & UAT
- **Regression:** re-run all P1 cases before every deploy that touches auth, RLS, money, or the DB schema.
- **UAT:** a real collector creates a listing in each format, another bids/buys/offers, both confirm the flow feels right. Sign-off recorded here.

---

## 12. Execution tracking

| Field | Value |
|-------|-------|
| Cycle | e.g. "Auctions v1 — 2026-07-03" |
| Executed by | — |
| Pass / Fail / Blocked | see `docs/TEST_CASES.md` |
| Defects | link to GitHub issues |

### Defect template
`[ID] Title · Severity (S1 blocker … S4 minor) · Steps · Expected · Actual · Env · Status`

### Exit criteria (per release)
- 100% of P1 cases Pass · 0 open S1/S2 defects · load targets met (§8) · security suite (§4) green.

---

## 13. Current status (2026-07-03)
Executed so far (see `docs/TEST_CASES.md`): **Auth, Listings, Photos, Auction Only, Direct Buy = Pass**;
**Make an Offer = pending re-run** (tooling). Load, accessibility, and payment/shipping integration
tests are **not yet executed** — scheduled as those areas mature.
