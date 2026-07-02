"use server";

import { promises as fs } from "fs";
import path from "path";
import { supabase } from "@/lib/supabase";

export type WaitlistState = { ok: boolean; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUCCESS = "You're on the list — we'll email you before launch.";

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

  const entry = { name, email, phone, city, role, brands };

  // Production path: persist to Supabase when configured.
  if (supabase) {
    const { error } = await supabase.from("waitlist_signups").insert(entry);
    if (error) {
      // 23505 = unique_violation — email already signed up. Treat as success.
      if (error.code === "23505") {
        return { ok: true, message: "You're already on the list — see you at launch." };
      }
      console.error("supabase insert failed:", error);
      return { ok: false, message: "Something went wrong. Please try again." };
    }
    return { ok: true, message: SUCCESS };
  }

  // Dev fallback: no Supabase keys yet — append to a local (gitignored) file.
  try {
    const file = path.join(process.cwd(), "waitlist-dev.jsonl");
    const line = JSON.stringify({ ...entry, ts: new Date().toISOString() }) + "\n";
    await fs.appendFile(file, line, "utf8");
  } catch (err) {
    console.error("waitlist dev write failed:", err);
  }
  console.log("waitlist signup (dev):", entry);
  return { ok: true, message: SUCCESS };
}
