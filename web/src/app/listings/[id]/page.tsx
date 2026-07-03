import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { Countdown } from "@/components/Countdown";
import { placeBid, buyNow } from "./actions";

type Auction = {
  id: string;
  start_bid: number;
  reserve_price: number | null;
  bin_price: number | null;
  current_bid: number | null;
  bid_count: number;
  end_at: string;
  status: string;
};

type Listing = {
  id: string;
  brand: string | null;
  model: string | null;
  series: string | null;
  condition: string | null;
  scale: string | null;
  description: string | null;
  tags: string[] | null;
  type: string;
  status: string;
  created_at: string;
  seller: { username: string | null; city: string | null } | null;
  listing_media: { url: string; position: number }[] | null;
  auction: Auction | null;
};

type Bid = { amount: number; created_at: string; bidder: { username: string | null } | null };

const money = (n: number) => "₹" + Number(n).toLocaleString("en-IN");

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { error: errMsg, ok: okMsg } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("listings")
    .select(
      "id, brand, model, series, condition, scale, description, tags, type, status, created_at, seller:profiles(username, city), listing_media(url, position), auction:auctions(id, start_bid, reserve_price, bin_price, current_bid, bid_count, end_at, status)",
    )
    .eq("id", id)
    .single();

  if (!data) notFound();
  const listing = data as unknown as Listing;
  const auction = listing.auction;
  const photos = [...(listing.listing_media ?? [])].sort((a, b) => a.position - b.position);

  let bids: Bid[] = [];
  if (auction) {
    const { data: bidData } = await supabase
      .from("bids")
      .select("amount, created_at, bidder:profiles(username)")
      .eq("auction_id", auction.id)
      .order("created_at", { ascending: false })
      .limit(10);
    bids = (bidData ?? []) as unknown as Bid[];
  }

  const sold = listing.status === "sold";
  const isAuction = listing.type === "auction" && auction;
  const current = auction?.current_bid ?? auction?.start_bid ?? 0;
  const minNext = auction?.current_bid ? auction.current_bid + 1 : (auction?.start_bid ?? 1);

  return (
    <div className="mx-auto max-w-3xl px-6">
      <SiteHeader />
      <main className="py-10">
        <Link href="/listings" className="text-sm text-ash-2 hover:text-ash">
          ← Back to listings
        </Link>

        {okMsg && (
          <p className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400">
            {okMsg}
          </p>
        )}
        {errMsg && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {errMsg}
          </p>
        )}

        {photos.length > 0 && (
          <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            {photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.url} src={p.url} alt="" className="aspect-square w-full rounded-xl border border-line object-cover" />
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <span className="text-xs uppercase tracking-widest text-ash-3">{listing.brand ?? "—"}</span>
          {sold && <span className="rounded-md bg-ash-3/20 px-2 py-0.5 text-xs text-ash-2">SOLD</span>}
        </div>
        <h1 className="font-display mt-1 text-4xl text-ash">{listing.model ?? "Untitled"}</h1>
        {listing.series && <p className="mt-1 text-ash-2">{listing.series}</p>}

        {/* Auction box */}
        {isAuction && !sold && (
          <div className="mt-6 rounded-2xl border border-line bg-surface/40 p-6">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-sm text-ash-2">{auction!.current_bid ? "Current bid" : "Starting bid"}</div>
                <div className="font-display text-4xl text-ash">{money(current)}</div>
                <div className="mt-1 text-xs text-ash-3">{auction!.bid_count} bids</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-ash-2">Time left</div>
                <div className="font-display text-2xl">
                  <Countdown endAt={auction!.end_at} />
                </div>
              </div>
            </div>

            <form action={placeBid} className="mt-5 flex gap-2">
              <input type="hidden" name="listing_id" value={listing.id} />
              <input type="hidden" name="auction_id" value={auction!.id} />
              <input
                name="amount"
                type="number"
                min={minNext}
                step="1"
                required
                placeholder={`${money(minNext)} or more`}
                className="w-full rounded-lg border border-line bg-ink-3 px-4 py-3 text-ash placeholder:text-ash-3 outline-none focus:border-fire/60"
              />
              <button className="font-display rounded-lg bg-fire px-6 py-3 tracking-wide text-white transition-colors hover:bg-fire-2">
                Bid
              </button>
            </form>

            {auction!.bin_price && (
              <form action={buyNow} className="mt-3">
                <input type="hidden" name="listing_id" value={listing.id} />
                <button className="w-full rounded-lg border border-fire/40 bg-fire/10 px-6 py-3 font-medium text-fire transition-colors hover:bg-fire hover:text-white">
                  Buy It Now — {money(auction!.bin_price)}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Buy It Now only */}
        {listing.type === "bin" && auction?.bin_price && !sold && (
          <div className="mt-6 rounded-2xl border border-line bg-surface/40 p-6">
            <div className="text-sm text-ash-2">Buy It Now</div>
            <div className="font-display text-4xl text-ash">{money(auction.bin_price)}</div>
            <form action={buyNow} className="mt-4">
              <input type="hidden" name="listing_id" value={listing.id} />
              <button className="font-display w-full rounded-lg bg-fire px-6 py-3 tracking-wide text-white transition-colors hover:bg-fire-2">
                Buy It Now
              </button>
            </form>
            <p className="mt-2 text-xs text-ash-3">Buy It Now is limited to 5 purchases per month.</p>
          </div>
        )}

        <div className="mt-6 grid gap-3 rounded-2xl border border-line bg-surface/40 p-6 sm:grid-cols-2">
          <Field label="Condition" value={listing.condition} />
          <Field label="Scale" value={listing.scale} />
          <Field label="Seller" value={listing.seller?.username ? "@" + listing.seller.username : "—"} />
          <Field label="Location" value={listing.seller?.city} />
        </div>

        {listing.description && (
          <div className="mt-6">
            <div className="text-sm text-ash-2">Description</div>
            <p className="mt-1 leading-relaxed text-ash">{listing.description}</p>
          </div>
        )}

        {listing.tags && listing.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {listing.tags.map((t) => (
              <span key={t} className="rounded-full border border-line px-3 py-1 text-xs text-ash-2">{t}</span>
            ))}
          </div>
        )}

        {isAuction && bids.length > 0 && (
          <div className="mt-8">
            <div className="mb-2 text-sm text-ash-2">Bid history</div>
            <div className="rounded-xl border border-line">
              {bids.map((b, i) => (
                <div key={i} className="flex items-center justify-between border-b border-line px-4 py-2.5 text-sm last:border-0">
                  <span className="text-ash-2">@{b.bidder?.username ?? "bidder"}</span>
                  <span className="font-display text-ash">{money(b.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-ash-3">{label}</div>
      <div className="mt-0.5 text-ash">{value || "—"}</div>
    </div>
  );
}
