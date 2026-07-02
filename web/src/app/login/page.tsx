import Link from "next/link";
import { login, signup } from "@/app/auth/actions";

const inputCls =
  "w-full rounded-lg border border-line bg-ink-3 px-4 py-3 text-ash placeholder:text-ash-3 outline-none transition-colors focus:border-fire/60";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <Link href="/" className="mb-8 inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/showclutch-logo.png" alt="ShowClutch" className="h-8 w-auto" />
      </Link>

      <h1 className="font-display text-4xl text-ash">Sign in</h1>
      <p className="mt-2 text-ash-2">Log in, or create your ShowClutch account.</p>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 rounded-lg border border-fire/30 bg-fire/10 px-4 py-2 text-sm text-fire">
          {message}
        </p>
      )}

      <form className="mt-6 space-y-4">
        <input className={inputCls} name="email" type="email" required placeholder="Email address" autoComplete="email" />
        <input
          className={inputCls}
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Password (min 6 characters)"
          autoComplete="current-password"
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            formAction={login}
            className="font-display flex-1 rounded-lg bg-fire px-6 py-3 text-lg tracking-wide text-white transition-colors hover:bg-fire-2"
          >
            Log in
          </button>
          <button
            formAction={signup}
            className="flex-1 rounded-lg border border-line px-6 py-3 text-ash-2 transition-colors hover:border-fire/50 hover:text-ash"
          >
            Create account
          </button>
        </div>
      </form>
    </div>
  );
}
