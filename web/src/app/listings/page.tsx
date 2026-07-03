import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";

type ListingCard = {
  id: string;
  brand: string | null;
  model: string | null;
  series: string | null;
  condition: string | null;
  type: string;
  created_at: string;
  seller: { username: string | null; city: string | null } | null;
  listing_media: { url: string; position: number }[] | null;
};

const TYPE_LABEL: Record<string, string> = {
  auction: "Auction",
  direct: "Direct Buy",
  offer: "Make Offer",
  bin: "Buy It Now",
  exchange: "Exchange",
  showoff: "Show Off",
};

function firstPhoto(l: ListingCard): string | null {
  const media = [...(l.listing_media ?? [])].sort((a, b) => a.position - b.position);
  return media[0]?.url ?? null;
}

export default async function ListingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(
      "id, brand, model, series, condition, type, created_at, seller:profiles(username, city), listing_media(url, position)",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(60);

  const listings = (data ?? []) as unknown as ListingCard[];

  return (
    <div className="mx-auto max-w-5xl px-6">
      <SiteHeader />
      <main className="py-10">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-ash-3">Marketplace</div>
            <h1 className="font-display text-4xl text-ash">Browse listings</h1>
          </div>
          <Link
            href="/sell"
            className="rounded-lg bg-fire px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-fire-2"
          >
            + List an item
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-line bg-surface/40 p-10 text-center">
            <p className="text-ash-2">No listings yet.</p>
            <Link href="/sell" className="mt-3 inline-block text-fire hover:underline">
              Be the first to list something →
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => {
              const photo = firstPhoto(l);
              return (
                <Link
                  key={l.id}
                  href={"/listings/" + l.id}
                  className="overflow-hidden rounded-xl border border-line bg-surface/40 transition-colors hover:border-fire/30"
                >
                  <div className="flex aspect-[4/3] items-center justify-center bg-ink-3">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt={l.model ?? ""} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-4xl opacity-20">🚗</span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-widest text-ash-3">{l.brand ?? "—"}</span>
                      <span className="rounded-md bg-fire/10 px-2 py-0.5 text-xs text-fire">
                        {TYPE_LABEL[l.type] ?? l.type}
                      </span>
                    </div>
                    <div className="mt-2 font-medium text-ash">{l.model ?? "Untitled"}</div>
                    <div className="mt-0.5 text-sm text-ash-2">{l.series ?? ""}</div>
                    <div className="mt-4 flex items-center justify-between text-xs text-ash-3">
                      <span>{l.condition ?? ""}</span>
                      <span>@{l.seller?.username ?? "seller"}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
