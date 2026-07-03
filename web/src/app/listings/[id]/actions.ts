"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function placeBid(formData: FormData) {
  const supabase = await createClient();
  const listingId = String(formData.get("listing_id") ?? "");
  const auctionId = String(formData.get("auction_id") ?? "");
  const amount = Number(formData.get("amount"));

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!amount || amount <= 0) {
    redirect(`/listings/${listingId}?error=${encodeURIComponent("Enter a valid bid amount.")}`);
  }

  const { error } = await supabase.rpc("place_bid", {
    p_auction: auctionId,
    p_amount: amount,
  });
  if (error) {
    redirect(`/listings/${listingId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/listings/${listingId}`);
  redirect(`/listings/${listingId}?ok=Bid+placed`);
}

export async function buyNow(formData: FormData) {
  const supabase = await createClient();
  const listingId = String(formData.get("listing_id") ?? "");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("buy_now", { p_listing: listingId });
  if (error) {
    redirect(`/listings/${listingId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/listings/${listingId}`);
  redirect(`/listings/${listingId}?ok=Purchased+via+Buy+It+Now`);
}
