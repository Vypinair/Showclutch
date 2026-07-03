import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";

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
  created_at: string;
  seller: { username: string | null; city: string | null } | null;
  listing_media: { url: string; position: number }[] | null;
};

const TYPE_LABEL: Record<string, string> = {
  auction: "Auction",
  bin: "Buy It Now",
  exchange: "Exchange",
  showoff: "Show Off",
};

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(
      "id, brand, model, series, condition, scale, description, tags, type, created_at, seller:profiles(username, city), listing_media(url, position)",
    )
    .eq("id", id)
    .single();

  if (!data) notFound();
  const listing = data as unknown as Listing;
  const photos = [...(listing.listing_media ?? [])].sort((a, b) => a.position - b.position);

  return (
    <div className="mx-auto max-w-3xl px-6">
      <SiteHeader />
      <main className="py-10">
        <Link href="/listings" className="text-sm text-ash-2 hover:text-ash">
          ← Back to listings
        </Link>

        {photos.length > 0 && (
          <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            {photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.url}
                src={p.url}
                alt=""
                className="aspect-square w-full rounded-xl border border-line object-cover"
              />
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <span className="text-xs uppercase tracking-widest text-ash-3">{listing.brand ?? "—"}</span>
          <span className="rounded-md bg-fire/10 px-2 py-0.5 text-xs text-fire">
            {TYPE_LABEL[listing.type] ?? listing.type}
          </span>
        </div>

        <h1 className="font-display mt-1 text-4xl text-ash">{listing.model ?? "Untitled"}</h1>
        {listing.series && <p className="mt-1 text-ash-2">{listing.series}</p>}

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
              <span key={t} className="rounded-full border border-line px-3 py-1 text-xs text-ash-2">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-xl border border-line bg-ink-2/60 p-5 text-sm text-ash-3">
          Bidding, Buy It Now, and escrow checkout arrive with the Auctions and Payments engines — next on the roadmap.
        </div>
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
