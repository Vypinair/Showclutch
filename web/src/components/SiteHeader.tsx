import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between border-b border-line py-4">
      <div className="flex items-center gap-6">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/showclutch-logo.png" alt="ShowClutch" className="h-7 w-auto" />
        </Link>
        <nav className="flex items-center gap-4 text-sm text-ash-2">
          <Link href="/listings" className="transition-colors hover:text-ash">
            Browse
          </Link>
          <Link href="/sell" className="transition-colors hover:text-ash">
            Sell
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3 text-sm">
        {user ? (
          <>
            <Link href="/account" className="text-ash-2 transition-colors hover:text-ash">
              Account
            </Link>
            <form action={logout}>
              <button className="rounded-lg border border-line px-3 py-1.5 text-ash-2 transition-colors hover:border-fire/50 hover:text-ash">
                Log out
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-lg border border-fire/40 bg-fire/10 px-4 py-1.5 font-medium text-fire transition-colors hover:bg-fire hover:text-white"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
