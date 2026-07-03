# ShowClutch — Product & Technical Specification

> India's collector-grade die-cast marketplace. **Bid. Trade. Show Off.**
>
> Status: **Draft v0.2** · Owner: Vypin · Last updated: 2026-07-03
> Repo: https://github.com/Vypinair/Showclutch
>
> v0.2 adds the sale-format model, auction rules, and category/series taxonomy — see §14–§16.

---

## 1. Overview

ShowClutch is a marketplace and community for die-cast car collectors in India
(Hot Wheels, Tomica, Mini GT, Tarmac, Inno64, Solido, and more). It combines:

- **Marketplace** — three sale formats: Auction Only, Direct Buy, Make an Offer (see §14).
- **Exchange** — direct collector-to-collector trades (item-for-item + cash top-up).
- **Most Wanted** — buyers post what they're hunting; owners respond with offers.
- **Show Off** — a social wall to display collections.
- **Community** — forums, city clubs, fraud alerts.

Every transaction is **escrow-protected** and shipped through the platform, so
buyers and sellers never share addresses and money is only released after the
buyer confirms receipt.

The current `index.html` is a **visual prototype** of this vision. This document
specifies how we turn it into a real, production product.

---

## 2. Goals & non-goals

**Goals**
- A trustworthy marketplace where collectors transact without fear of fraud.
- Keep every deal on-platform (escrow + platform shipping + anti-contact-sharing).
- A distinctive, automotive brand identity that doesn't look templated.

**Non-goals (for now)**
- International shipping / multi-currency (India-first, INR only).
- Native mobile apps (responsive web first; apps later).
- Grading/certification of authenticity (we provide photo evidence, not a guarantee).

---

## 3. Users & personas

| Persona | Needs |
|---|---|
| **Buyer/Collector** | Find rare pieces, bid safely, pay protected, get exactly what was shown. |
| **Seller** | List quickly (box-scan auto-fill), reach real buyers, get paid reliably. |
| **Trader** | Swap duplicates for wants without cash, or with a small top-up. |
| **Hunter** | Post a "Most Wanted" and let owners come to them. |
| **Lurker/Fan** | Browse Show Off, join the community, convert to buyer over time. |

---

## 4. Product scope (full vision)

Organised by area. Each maps to a prototype page today.

### 4.1 Accounts & profiles
- Sign up / sign in via **phone OTP** (primary in India) and email.
- Profile: username, city, avatar, seller stats (sales, rating, disputes), tier.
- Seller onboarding with **KYC** (required before payouts).

### 4.2 Listings
- Create listing with **Box Scan**: capture front + back of the packaging; OCR
  extracts brand, model, series, card number and pre-fills the form. Manual edit always available.
- Photos (max 8) + optional video (required for items ≥ ₹2,000).
- Fields: brand, model, series/edition, condition, tags, scale.
- Listing type: **Auction**, **Buy-It-Now**, or **Exchange/Show-off only**.

### 4.3 Auctions
- Timed auctions with start/end, starting bid, optional reserve.
- Live bidding, **proxy/auto-bid**, bid history, watchers.
- Anti-sniping: extend end time if a bid lands in the final minutes.
- **Bid deposit**: bids above ₹2,000 require a 10% refundable deposit.
- **Buy-It-Now**, limited to **5 purchases per buyer per calendar month**;
  beyond that, the buyer must go through the auction flow.

### 4.4 Exchange
- Post an item open to trade; propose item-for-item with optional cash top-up.
- On acceptance, both listings lock and platform generates shipping labels for a
  protected simultaneous exchange.

### 4.5 Most Wanted
- Post what you're hunting — **price is secondary** (open budget by default).
- Owners who have it respond with an offer (condition, price, photos).
- Buyer accepts one offer → escrow → platform shipping → release on receipt.

### 4.6 Show Off & Community
- Show Off wall (masonry), likes/comments, "raise for auction" requests.
- Community forum with categories, city clubs, events, fraud alerts.

### 4.7 Payments, escrow & shipping (cross-cutting)
- **Escrow**: buyer pays into escrow; funds released to seller only after the
  buyer confirms receipt within a 48-hour inspection window.
- **Shipping**: platform-generated labels; addresses never shared between parties.
- **Anti-off-platform**: auto-filter blocks contact sharing; violations → suspension.

### 4.8 Premium (deferred)
- Membership tiers (Collector/Platinum). **Disabled for MVP** — revisit later.

---

## 5. MVP — Landing page + waitlist (Phase 1, ship first)

**Objective:** validate demand and build an email/phone list of collectors before
building the marketplace engine.

**Scope**
- A polished, responsive **landing page** (port the prototype hero + brand story).
- **Waitlist signup**: name, email, phone (optional), city, favourite brands,
  "are you mostly a buyer, seller, or both".
- Store signups in a database; confirmation message + optional welcome email.
- Basic **analytics** (page views, signups, conversion) and a simple admin view
  of signups (or export to sheet).
- Legal footer: privacy policy + terms (basic), DPDP-compliant consent checkbox.

**Explicitly NOT in MVP:** auctions, payments, listings, accounts, chat.

**Success metrics**
- # of waitlist signups, signup conversion rate, brand-interest distribution,
  buyer/seller split, city distribution. Target to define with Vypin.

**MVP tech (lightweight)**
- Next.js on Vercel + a hosted Postgres (Supabase) table for signups, or a
  form-to-database service. Chosen font applied. One page, one API route.

---

## 6. Information architecture (full product)

```
/                     Landing / home
/auctions             Browse auctions (filters, sort)
/auctions/[id]        Auction detail (bidding, escrow, seller)
/sell                 Create listing (box scan → details → pricing → shipping → review)
/exchange            Exchange board
/most-wanted          Most Wanted board (post + respond)
/show-off             Show Off wall
/community            Forum
/dashboard            Buyer/seller dashboard (activity, stats)
/u/[username]         Public profile
/settings             Account, KYC, addresses, payouts
```

---

## 7. Data model (first cut)

Key entities (Postgres). Not exhaustive; refined during build.

- **users**(id, phone, email, username, city, avatar_url, tier, created_at)
- **seller_profiles**(user_id, kyc_status, payout_account_id, rating, sales_count, disputes_count)
- **listings**(id, seller_id, brand, model, series, condition, scale, tags[],
  type[auction|bin|exchange|showoff], status, created_at)
- **listing_media**(id, listing_id, kind[image|video], url, position)
- **auctions**(id, listing_id, start_at, end_at, start_bid, reserve, bin_price,
  current_bid, current_bidder_id, status)
- **bids**(id, auction_id, bidder_id, amount, is_proxy, max_proxy, created_at)
- **bin_purchases**(id, buyer_id, listing_id, month, created_at) — enforces 5/month
- **exchange_offers**(id, listing_id, from_user, offered_item, cash_topup, status)
- **wanted_requests**(id, user_id, brand, model, condition, notes, open_budget, status)
- **wanted_offers**(id, request_id, seller_id, price, condition, media[], status)
- **orders**(id, buyer_id, seller_id, listing_id, amount, escrow_status, ship_status)
- **shipments**(id, order_id, provider, tracking_no, label_url, status)
- **reviews**(id, order_id, rater_id, ratee_id, stars, text, created_at)
- **waitlist_signups**(id, name, email, phone, city, brands[], role, created_at) ← MVP

---

## 8. Architecture & tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | One codebase for UI + API, great on Vercel, SEO-friendly |
| Styling | **Tailwind CSS** + design tokens | Port the prototype's palette/tokens cleanly |
| Hosting | **Vercel** | Git-push deploys, previews per branch, scales automatically |
| DB + Auth + Storage | **Supabase** (Postgres) | Managed DB, phone/email auth, file storage, row-level security |
| Payments/escrow | **Razorpay** (incl. **Route** for marketplace split settlements) | India-native; Route enables holding + splitting funds to sellers |
| Shipping | **Shiprocket** | Label generation, tracking, pan-India courier aggregation |
| Box-scan OCR | **Google Cloud Vision** or **AWS Textract** (or Tesseract to start) | Extract text from box photos to pre-fill listings |
| Media | Supabase Storage or **Cloudflare** (images/Stream) | Compressed images + optional video |
| Email/SMS | Resend/Postmark (email) + MSG91 (SMS OTP, India) | Transactional messages |
| Analytics | Vercel Analytics + PostHog | Product + conversion analytics |

**Principles:** managed services over self-hosting; start simple, add complexity
per phase; keep secrets in Vercel/Supabase env vars, never in the repo.

---

## 9. Key flows

**Auction (buyer):** browse → detail → place bid (deposit if > ₹2,000) → win →
pay balance into escrow → seller ships → buyer confirms within 48h → funds
released → review.

**Buy-It-Now:** if buyer's monthly BIN count < 5 → instant purchase into escrow;
else → redirected to auction flow. Counter resets each calendar month.

**Box-scan listing (seller):** capture front + back → OCR extracts details →
form pre-filled → seller edits → add photos/video → set pricing/type → shipping →
review → publish.

**Most Wanted:** post request (open budget) → owners submit offers → buyer picks
one → escrow → platform shipping → release on receipt.

**Exchange:** post item → receive item-for-item proposal (+ optional cash) →
accept → both listings lock → simultaneous protected shipment.

---

## 10. Non-functional requirements

- **Security:** row-level security on all user data; no PII in the repo; signed
  URLs for media; rate-limiting on auth and bids; audit log on money movements.
- **Compliance (India):** seller **KYC** before payouts; **GST** on platform
  commission; **DPDP Act 2023** consent + data-handling; clear escrow terms.
  → *Requires professional legal/finance review before handling real money.*
- **Performance:** landing < 2s first load; image compression; CDN.
- **Reliability:** auctions are time-critical — server-authoritative clocks,
  no lost bids, idempotent payment webhooks.
- **Accessibility:** WCAG AA; keyboard + screen-reader friendly.

---

## 11. Roadmap & milestones

| Phase | Deliverable | Depends on |
|---|---|---|
| **1 · Landing + waitlist** *(MVP, ship first)* | Live landing page + signup DB + admin/export | Stack setup, font choice |
| **2 · Foundation** | Next.js app shell, design system, auth, profiles | Phase 1 |
| **3 · Catalog** | Create listing + box-scan OCR, browse/search | Phase 2 |
| **4 · Transactions** | Auctions, Buy-It-Now (5/mo), Razorpay escrow | Phase 3 |
| **5 · Fulfilment + trust** | Shiprocket labels, release-on-receipt, reviews, disputes | Phase 4 |
| **6 · Community** | Exchange, Most Wanted, Show Off, forum | Phase 4 |
| **7 · Launch hardening** | KYC, GST/DPDP, security review, monitoring, legal | Phases 4–6 |

---

## 12. Open decisions

1. **Font pairing** — recommended: Anton + Inter (Billboard). *Pending final pick.*
2. **Waitlist fields** — confirm exact fields + whether phone is required.
3. **Escrow mechanism** — confirm Razorpay Route vs. an alternative; needs finance/legal review.
4. **Commission model** — platform fee % (prototype suggests 6–8%).
5. **OCR provider** — Google Vision vs. AWS Textract vs. Tesseract (cost/accuracy).
6. **Brand/domain** — confirm production domain (prototype shows placeholders).
7. **Team** — solo build with Claude vs. hiring developers for money-handling parts.

---

## 13. Appendix

- **Prototype:** `index.html` (single-file, self-contained) — the visual reference.
- **Brand assets:** `assets/` (logo PNG + wordmark SVG).
- This spec is a living document; update it as decisions are made.

---

## 14. Sale formats (collector-first)

Every marketplace listing has exactly **one primary sale format**. Keeping formats
distinct protects ShowClutch's identity as a collector-first auction platform — the
winner of a rare piece is whoever values it most, not whoever clicks fastest.

| Format | Best for | Buy It Now? | Mechanic |
|---|---|---|---|
| **Auction Only** | Rare, limited, chase, STH, RLC, vintage, high-demand | **No** | Timed bidding; starting bid + optional reserve |
| **Direct Buy** | Mainlines, accessories, common imports, bulk stock | Yes (that *is* the format) | Fixed price, instant purchase |
| **Make an Offer** | Price-uncertain collectibles | — | Buyers submit offers; seller accepts or counters |

Industry precedent: Whatnot treats auctions and Buy It Now as distinct formats; eBay
allows a hybrid but generally removes Buy It Now after the first bid. We keep them separate.

### 14.1 Format rules (MVP)
1. Seller must choose one primary format: Auction Only, Direct Buy, or Make an Offer.
2. **Buy It Now must not appear on Auction Only listings** during MVP.
3. Auction listings may use: starting bid, reserve price, proxy bidding, bid
   increments, anti-sniping extension, bid-deposit rules.
4. If an auction ends **without the reserve being met**, the seller may:
   relist the auction · revise the reserve · convert to Direct Buy · enable Make an Offer.
   Example: start ₹1,000, reserve ₹4,500, auction ends at ₹4,200 → item does not sell;
   seller keeps it or converts it to a Direct Buy later. This protects the seller
   without killing the auction opportunity for everyone else.
5. Rare / limited / chase / high-value categories **default to Auction Only** and
   require admin approval before any format change.
6. Sellers **cannot cancel or convert an auction once valid bids exist**, except via
   admin-approved exceptional cases.
7. When a reserve-not-met auction is converted, **everyone who watched gets notified**:
   "now available for direct purchase" / "seller has opened offers" / "relisted with revised reserve".

### 14.2 Auction integrity rules
- No Buy It Now for rare / single-unit collector pieces.
- Verified account required to bid.
- Bid deposit for high-value lots.
- Proxy bids, so users don't have to sit online all day.
- **Anti-sniping extension:** a bid in the final minute extends the auction by 1–2 minutes
  (eBay uses extended bidding in some categories for the same fairness reason).
- No contact numbers, UPI IDs, or off-platform deals.
- No auction cancellation after bids unless admin-approved.
- One unit per buyer for limited importer drops.
- Watchlist alerts before an auction starts and before it ends.
- Admin review for high-value listings.

### 14.3 Implementation status (2026-07-03)
- **Built:** three formats; Auction Only bidding (starting bid, reserve, live countdown,
  bid history) via `place_bid()`; Direct Buy via `buy_now()` (no monthly cap); Make an
  Offer submit + seller-accept via `accept_offer()`; rare-category auto-default to Auction Only.
- **Deferred (build progressively):** proxy bidding, anti-sniping extension, bid deposits,
  verified-account-to-bid, one-unit-per-buyer, reserve-not-met conversion flow +
  watcher notifications, admin review/approval, watchlist alerts, no-cancel-after-bids,
  counter-offers.

---

## 15. Collector categories

Every listing carries one **category**. Rare categories default to Auction Only.

`Standard Release` · `Premium / Collector Line` · `Limited Edition` · `Chase Variant` ·
`Regional Exclusive` · `Retailer / Distributor Exclusive` · `Event / Convention Exclusive` ·
`Collaboration Release` · `Membership / Club Exclusive` · `Vintage / Discontinued` ·
`Prototype / Pre-production` · `Error / Variation`

**Rare (auto Auction Only):** Limited Edition, Chase Variant, Regional Exclusive,
Retailer/Distributor Exclusive, Event/Convention Exclusive, Membership/Club Exclusive,
Vintage/Discontinued, Prototype/Pre-production, Error/Variation.

---

## 16. Series / Edition taxonomy (per brand)

The **Series / Edition** field auto-populates from the selected brand. Scales
(`1:64, 1:43, 1:32, 1:24, 1:18, 1:12, 1:87`) are selectable; Solido defaults to 1:18.
Source of truth: `web/src/lib/taxonomy.ts`.

- **Hot Wheels:** Mainline, Treasure Hunt, Super Treasure Hunt, Red Line Club (RLC), Car Culture, Team Transport, Boulevard, Premium, Fast & Furious, Pop Culture, Error/Variation, Discontinued.
- **Tomica:** Regular, Premium, Premium Unlimited, Limited Vintage, Limited Vintage Neo, Event Model, Gift Set, Disney Tomica, Discontinued.
- **Matchbox:** Mainline, Moving Parts, Collectors, Super Chase, Moving Parts Super Chase, Anniversary/Special Edition, Mattel Creations/Collector Release, Licensed Theme/Entertainment, Vintage Matchbox, Error/Variation, Discontinued.
- **Mini GT:** Standard Release, Kaido House x Mini GT, Limited Edition, Regional Exclusive, Event Exclusive, Distributor/Retailer Exclusive, Kaido House Chase Variant, Collaboration Release, Motorsport/Licensed Series, Discontinued.
- **Greenlight:** Standard Release, Hollywood Series, Hobby Exclusive, Club Vee-Dub, Running on Empty, Muscle Series, Green Machine Chase, Limited Edition, Discontinued.
- **Majorette:** Standard Series, Showroom Premium, Showroom Deluxe, JDM Legends Premium, JDM Legends Deluxe, Japan Series Deluxe, Limited Edition, Gift Pack Exclusive, Event/Motor Show Release, Vintage Majorette, Discontinued.
- **Tarmac Works:** GLOBAL64, HOBBY64, Special Edition, Chase Variant, Regional Exclusive, Retailer/Distributor Exclusive, Event/Promo Exclusive, Tarmac Owners Club Exclusive, Collaboration Release, Limited Production Run, Discontinued.
- **Pop Race:** Standard Release, Pop Race Limited, Enigma Exclusive, Enigma Chase, Event Exclusive, Regional Exclusive, Chase Variant, Chrome/Carbon/Special Finish, Opening Parts Collector Release, Collaboration/Licensed Livery, Discontinued.
- **Inno64:** Standard Release, Limited Edition, Numbered Limited Edition, Chase Variant, Chrome Chase, Event/Expo Exclusive, Regional Exclusive, Collaboration Release, Liberty Walk/RWB/Pandem/Top Secret Series, Motorsport/Drift Livery, Discontinued.
- **Solido:** 1:18 Collection, 1:43 Collection, Street Car, Motorsport/Endurance, Movie Car/Entertainment Licence, Limited Edition, Anniversary Edition, Club Solido Exclusive, Vintage Solido, Discontinued, Special Livery, Dealer/Event Exclusive.
- **Street Weapon / Street Warrior:** Street Weapon Standard, Street Warrior Standard, Numbered Limited Edition, Special Colourway, Chrome/Gradient/Special Finish, Collaboration Release, Event Exclusive, Regional Exclusive, RWB/Custom Body Kit Series, Discontinued.
- **Stance Hunters:** Standard Release, Numbered Limited Edition, Special Colourway, Collaboration Release, Event Exclusive, Trailer/Diorama Set, Regional Exclusive, Discontinued.
- **Trends Hobby (TrendHobby):** Standard Release, Numbered Limited Edition, Special Colourway, Event Exclusive, Regional Exclusive, Retailer Exclusive, Collaboration Release, Discontinued.

Brands without a specific list (AutoArt, Kyosho, Maisto, Other) fall back to the 12 categories.
