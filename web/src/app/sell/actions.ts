"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createListing(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ensure a profile row exists (accounts created before the signup trigger,
  // or if the trigger ever misses, still work). seller_id references profiles.id.
  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });

  const model = String(formData.get("model") ?? "").trim();
  if (!model) redirect("/sell?error=" + encodeURIComponent("Car name / model is required."));

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const payload = {
    seller_id: user.id,
    brand: String(formData.get("brand") ?? "").trim() || null,
    model,
    series: String(formData.get("series") ?? "").trim() || null,
    condition: String(formData.get("condition") ?? "").trim() || null,
    scale: String(formData.get("scale") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    tags,
    type: String(formData.get("type") ?? "auction"),
    status: "active",
  };

  const { data, error } = await supabase
    .from("listings")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    console.error("createListing failed:", error);
    redirect("/sell?error=" + encodeURIComponent("Could not create the listing. Please try again."));
  }

  // Attach uploaded photos (already stored client-side) as listing_media rows.
  let media: string[] = [];
  try {
    media = JSON.parse(String(formData.get("media") ?? "[]"));
  } catch {
    media = [];
  }
  if (Array.isArray(media) && media.length > 0) {
    const rows = media.slice(0, 8).map((url, i) => ({
      listing_id: data.id,
      url,
      kind: "image",
      position: i,
    }));
    const { error: mediaErr } = await supabase.from("listing_media").insert(rows);
    if (mediaErr) console.error("listing_media insert failed:", mediaErr);
  }

  // Create the auction row for auction / buy-it-now listings.
  if (payload.type === "auction" || payload.type === "bin") {
    const binPrice = Number(formData.get("bin_price")) || null;
    const startBid = Number(formData.get("start_bid")) || 0;
    const reserve = Number(formData.get("reserve")) || null;
    const days = Number(formData.get("duration_days")) || 7;
    const isAuction = payload.type === "auction";
    const endAt = new Date(Date.now() + (isAuction ? days : 365) * 86400000).toISOString();

    const { error: auctionErr } = await supabase.from("auctions").insert({
      listing_id: data.id,
      start_at: new Date().toISOString(),
      end_at: endAt,
      start_bid: isAuction ? startBid : 0,
      reserve_price: isAuction ? reserve : null,
      bin_price: binPrice,
      status: "live",
    });
    if (auctionErr) console.error("auction insert failed:", auctionErr);
  }

  redirect("/listings/" + data.id);
}
