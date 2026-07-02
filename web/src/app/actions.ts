"use server";

import { promises as fs } from "fs";
import path from "path";

export type WaitlistState = { ok: boolean; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const brands = formData.getAll("brands").map(String);

  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  const entry = {
    name,
    email,
    phone,
    city,
    role,
    brands,
    ts: new Date().toISOString(),
  };

  // TODO(production): insert into Supabase `waitlist_signups` table.
  // For now (no DB connected yet) we append to a local dev file so signups are
  // captured during development. This will NOT persist on Vercel — swap to
  // Supabase before deploying.
  try {
    const file = path.join(process.cwd(), "waitlist-dev.jsonl");
    await fs.appendFile(file, JSON.stringify(entry) + "\n", "utf8");
  } catch (err) {
    console.error("waitlist write failed:", err);
  }
  console.log("waitlist signup:", entry);

  return { ok: true, message: "You're on the list — we'll email you before launch." };
}
