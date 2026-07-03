"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createListing } from "@/app/sell/actions";
import {
  SALE_FORMATS, CATEGORIES, RARE_CATEGORIES, SCALES,
  BRAND_DEFAULT_SCALE, seriesForBrand,
} from "@/lib/taxonomy";

const BRANDS = [
  "Hot Wheels", "Tomica", "Matchbox", "Mini GT", "Greenlight", "Majorette",
  "Tarmac", "Pop Race", "Inno64", "Solido", "Street Warrior", "Stancehunters",
  "TrendHobby", "AutoArt", "Kyosho", "Maisto", "Other",
];
const CONDITIONS = ["Mint in card", "Near mint", "Good", "Loose", "Damaged"];

const inputCls =
  "w-full rounded-lg border border-line bg-ink-3 px-4 py-3 text-ash placeholder:text-ash-3 outline-none transition-colors focus:border-fire/60";
const labelCls = "mb-1.5 block text-sm text-ash-2";

export function SellForm() {
  const supabase = createClient();
  const [urls, setUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const [brand, setBrand] = useState("");
  const [series, setSeries] = useState("");
  const [category, setCategory] = useState("");
  const [scale, setScale] = useState("1:64");
  const [format, setFormat] = useState("auction");

  const seriesOptions = brand ? seriesForBrand(brand) : [];
  const rareLocked = RARE_CATEGORIES.has(category);
  const formatHint = SALE_FORMATS.find((f) => f.value === format)?.hint;

  function onBrand(v: string) {
    setBrand(v);
    setSeries("");
    if (BRAND_DEFAULT_SCALE[v]) setScale(BRAND_DEFAULT_SCALE[v]);
  }
  function onCategory(v: string) {
    setCategory(v);
    if (RARE_CATEGORIES.has(v)) setFormat("auction");
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadErr("");
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploadErr("Your session expired — please sign in again.");
      setUploading(false);
      return;
    }
    const added: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("listing-photos").upload(path, file);
      if (error) { setUploadErr(error.message); continue; }
      added.push(supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl);
    }
    setUrls((prev) => [...prev, ...added]);
    setUploading(false);
  }

  return (
    <form action={createListing} className="mt-8 space-y-5">
      <div>
        <label className={labelCls}>Photos</label>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line px-6 py-8 text-center transition-colors hover:border-fire/50">
          <span className="text-3xl">📷</span>
          <span className="mt-2 text-sm text-ash-2">{uploading ? "Uploading…" : "Tap to add photos — front & back of the box"}</span>
          <span className="mt-1 text-xs text-ash-3">You can select multiple images</span>
          <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={onFiles} disabled={uploading} />
        </label>
        {uploadErr && <p className="mt-2 text-sm text-red-400">{uploadErr}</p>}
        {urls.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {urls.map((u) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={u} src={u} alt="" className="aspect-square w-full rounded-lg border border-line object-cover" />
            ))}
          </div>
        )}
      </div>
      <input type="hidden" name="media" value={JSON.stringify(urls)} />

      <div>
        <label className={labelCls}>Brand *</label>
        <select name="brand" required value={brand} onChange={(e) => onBrand(e.target.value)} className={inputCls}>
          <option value="" disabled>Select brand…</option>
          {BRANDS.map((b) => (<option key={b} value={b}>{b}</option>))}
        </select>
      </div>

      <div>
        <label className={labelCls}>Car name / model *</label>
        <input className={inputCls} name="model" required placeholder="e.g. 2022 Porsche 911 GT3" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Series / edition</label>
          <select name="series" value={series} onChange={(e) => setSeries(e.target.value)} disabled={!brand} className={inputCls}>
            <option value="">{brand ? "Select series…" : "Choose a brand first"}</option>
            {seriesOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Scale</label>
          <select name="scale" value={scale} onChange={(e) => setScale(e.target.value)} className={inputCls}>
            {SCALES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Category</label>
          <select name="category" value={category} onChange={(e) => onCategory(e.target.value)} className={inputCls}>
            <option value="">Select category…</option>
            {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Condition</label>
          <select name="condition" className={inputCls} defaultValue="">
            <option value="" disabled>Select condition…</option>
            {CONDITIONS.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea name="description" rows={4} className={inputCls + " resize-y"} placeholder="Condition notes, story, anything a buyer should know." />
      </div>

      <div>
        <label className={labelCls}>Tags (comma separated)</label>
        <input className={inputCls} name="tags" placeholder="Super TH, Zamac, JDM" />
      </div>

      <div>
        <label className={labelCls}>Sale format</label>
        <div className="flex flex-wrap gap-2">
          {SALE_FORMATS.map((f) => (
            <label key={f.value} className="cursor-pointer">
              <input
                type="radio" name="type" value={f.value}
                checked={format === f.value}
                onChange={() => setFormat(f.value)}
                disabled={rareLocked && f.value !== "auction"}
                className="peer sr-only"
              />
              <span className={"inline-block rounded-lg border border-line px-4 py-2 text-sm text-ash-2 transition-colors peer-checked:border-fire peer-checked:bg-fire/10 peer-checked:text-fire " + (rareLocked && f.value !== "auction" ? "opacity-40" : "")}>
                {f.label}
              </span>
            </label>
          ))}
        </div>
        {formatHint && <p className="mt-2 text-xs text-ash-3">{formatHint}</p>}
        {rareLocked && (
          <p className="mt-1 text-xs text-fire">This category is collector-grade — Auction Only, so everyone gets a fair chance to bid.</p>
        )}
      </div>

      {format === "auction" && (
        <div className="grid gap-5 rounded-xl border border-line bg-ink-2/40 p-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Starting bid (₹) *</label>
            <input className={inputCls} name="start_bid" type="number" min="1" step="1" required={format === "auction"} placeholder="e.g. 500" />
          </div>
          <div>
            <label className={labelCls}>Reserve price (₹, optional)</label>
            <input className={inputCls} name="reserve" type="number" min="0" step="1" placeholder="Hidden minimum" />
          </div>
          <div>
            <label className={labelCls}>Duration</label>
            <select name="duration_days" className={inputCls} defaultValue="7">
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="5">5 days</option>
              <option value="7">7 days</option>
            </select>
          </div>
        </div>
      )}

      {format === "direct" && (
        <div className="rounded-xl border border-line bg-ink-2/40 p-5">
          <label className={labelCls}>Price (₹) *</label>
          <input className={inputCls} name="bin_price" type="number" min="1" step="1" required={format === "direct"} placeholder="e.g. 2500" />
        </div>
      )}

      {format === "offer" && (
        <div className="rounded-xl border border-line bg-ink-2/40 p-5">
          <label className={labelCls}>Asking price (₹, optional guidance)</label>
          <input className={inputCls} name="ask_price" type="number" min="0" step="1" placeholder="Buyers will send offers you can accept or counter" />
        </div>
      )}

      <button
        type="submit"
        disabled={uploading}
        className="font-display w-full rounded-lg bg-fire px-6 py-3.5 text-lg tracking-wide text-white transition-colors hover:bg-fire-2 disabled:opacity-60"
      >
        {uploading ? "Waiting for photos…" : "Publish listing"}
      </button>
    </form>
  );
}
