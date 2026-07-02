import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { createListing } from "./actions";

const BRANDS = [
  "Hot Wheels", "Tomica", "Matchbox", "Mini GT", "Greenlight", "Majorette",
  "Tarmac", "Pop Race", "Inno64", "Solido", "Street Warrior", "Stancehunters",
  "TrendHobby", "AutoArt", "Kyoshi", "Maisto", "Other",
];
const CONDITIONS = ["Mint in card", "Near mint", "Good", "Loose", "Damaged"];
const TYPES: [string, string][] = [
  ["auction", "Auction"],
  ["bin", "Buy It Now"],
  ["exchange", "Exchange"],
  ["showoff", "Show Off only"],
];

const inputCls =
  "w-full rounded-lg border border-line bg-ink-3 px-4 py-3 text-ash placeholder:text-ash-3 outline-none transition-colors focus:border-fire/60";
const labelCls = "mb-1.5 block text-sm text-ash-2";

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-6">
      <SiteHeader />
      <main className="py-10">
        <h1 className="font-display text-4xl text-ash">List an item</h1>
        <p className="mt-2 text-ash-2">Add a piece to the ShowClutch catalogue.</p>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <form action={createListing} className="mt-8 space-y-5">
          <div>
            <label className={labelCls}>Brand</label>
            <select name="brand" className={inputCls} defaultValue="">
              <option value="" disabled>
                Select brand…
              </option>
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Car name / model *</label>
            <input className={inputCls} name="model" required placeholder="e.g. 2022 Porsche 911 GT3" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Series / edition</label>
              <input className={inputCls} name="series" placeholder="e.g. Treasure Hunt #9" />
            </div>
            <div>
              <label className={labelCls}>Scale</label>
              <input className={inputCls} name="scale" placeholder="e.g. 1:64" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Condition</label>
            <select name="condition" className={inputCls} defaultValue="">
              <option value="" disabled>
                Select condition…
              </option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              name="description"
              rows={4}
              className={inputCls + " resize-y"}
              placeholder="Condition notes, story, anything a buyer should know."
            />
          </div>

          <div>
            <label className={labelCls}>Tags (comma separated)</label>
            <input className={inputCls} name="tags" placeholder="Super TH, Zamac, JDM" />
          </div>

          <div>
            <label className={labelCls}>Listing type</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map(([val, label], i) => (
                <label key={val} className="cursor-pointer">
                  <input type="radio" name="type" value={val} defaultChecked={i === 0} className="peer sr-only" />
                  <span className="inline-block rounded-lg border border-line px-4 py-2 text-sm text-ash-2 transition-colors peer-checked:border-fire peer-checked:bg-fire/10 peer-checked:text-fire">
                    {label}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-ash-3">
              Pricing and bidding are set up in the next step once the Auctions engine is live. Photos coming soon.
            </p>
          </div>

          <button
            type="submit"
            className="font-display w-full rounded-lg bg-fire px-6 py-3.5 text-lg tracking-wide text-white transition-colors hover:bg-fire-2"
          >
            Publish listing
          </button>
        </form>
      </main>
    </div>
  );
}
