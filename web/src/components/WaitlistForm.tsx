"use client";

import { useActionState } from "react";
import { joinWaitlist, type WaitlistState } from "@/app/actions";

const BRANDS = [
  "Hot Wheels",
  "Tomica",
  "Mini GT",
  "Tarmac",
  "Inno64",
  "Pop Race",
  "Solido",
  "Majorette",
  "Greenlight",
  "Matchbox",
];

const initialState: WaitlistState = { ok: false, message: "" };

const inputCls =
  "w-full rounded-lg border border-line bg-ink-3 px-4 py-3 text-ash placeholder:text-ash-3 outline-none transition-colors focus:border-fire/60";

export function WaitlistForm() {
  const [state, formAction, pending] = useActionState(joinWaitlist, initialState);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-fire/30 bg-fire/5 p-8 text-center">
        <div className="font-display text-2xl text-fire">You&apos;re on the list.</div>
        <p className="mt-2 text-ash-2">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input className={inputCls} name="name" placeholder="Your name" autoComplete="name" />
        <input
          className={inputCls}
          name="email"
          type="email"
          required
          placeholder="Email address *"
          autoComplete="email"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <input className={inputCls} name="phone" type="tel" placeholder="Phone (optional)" autoComplete="tel" />
        <input className={inputCls} name="city" placeholder="City" autoComplete="address-level2" />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm text-ash-2">Favourite brands</legend>
        <div className="flex flex-wrap gap-2">
          {BRANDS.map((b) => (
            <label key={b} className="cursor-pointer">
              <input type="checkbox" name="brands" value={b} className="peer sr-only" />
              <span className="inline-block rounded-full border border-line px-3 py-1.5 text-sm text-ash-2 transition-colors peer-checked:border-fire peer-checked:bg-fire/10 peer-checked:text-fire">
                {b}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-ash-2">I&apos;m mostly a…</legend>
        <div className="flex flex-wrap gap-2">
          {["Buyer", "Seller", "Both"].map((r, i) => (
            <label key={r} className="cursor-pointer">
              <input type="radio" name="role" value={r} defaultChecked={i === 0} className="peer sr-only" />
              <span className="inline-block rounded-lg border border-line px-4 py-2 text-sm text-ash-2 transition-colors peer-checked:border-fire peer-checked:bg-fire/10 peer-checked:text-fire">
                {r}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {state.message && !state.ok && (
        <p className="text-sm text-red-400" aria-live="polite">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="font-display w-full rounded-lg bg-fire px-6 py-3.5 text-lg tracking-wide text-white transition-colors hover:bg-fire-2 disabled:opacity-60"
      >
        {pending ? "Joining…" : "Join the Waitlist"}
      </button>
      <p className="text-center text-xs text-ash-3">
        No spam. We&apos;ll only email you about the ShowClutch launch.
      </p>
    </form>
  );
}
