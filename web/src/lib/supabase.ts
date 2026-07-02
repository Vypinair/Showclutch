import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Null until the env vars are set — the waitlist action falls back to a local
// dev file in that case, so the app still runs before Supabase is connected.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
