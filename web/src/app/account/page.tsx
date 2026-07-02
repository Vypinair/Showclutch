import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, city, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/showclutch-logo.png" alt="ShowClutch" className="h-8 w-auto" />
        </Link>
        <form action={logout}>
          <button className="rounded-lg border border-line px-4 py-2 text-sm text-ash-2 transition-colors hover:border-fire/50 hover:text-ash">
            Log out
          </button>
        </form>
      </header>

      <main className="mt-12">
        <h1 className="font-display text-4xl text-ash">Your account</h1>
        <p className="mt-2 text-ash-2">You&apos;re signed in.</p>

        <div className="mt-8 space-y-4 rounded-2xl border border-line bg-surface/40 p-6">
          <Row label="Email" value={user.email ?? "—"} />
          <Row label="Username" value={profile?.username ?? "Not set yet"} />
          <Row label="City" value={profile?.city ?? "Not set yet"} />
          <Row label="Role" value={profile?.role ?? "Not set yet"} />
          <Row label="User ID" value={user.id} mono />
        </div>

        <p className="mt-6 text-sm text-ash-3">
          Profile editing, listings, and the marketplace engines are coming next.
        </p>
      </main>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between">
      <span className="text-sm text-ash-2">{label}</span>
      <span className={"text-ash " + (mono ? "font-mono text-xs" : "")}>{value}</span>
    </div>
  );
}
