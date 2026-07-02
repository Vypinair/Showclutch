import { WaitlistForm } from "@/components/WaitlistForm";

const BRAND_LINE =
  "Hot Wheels · Tomica · Matchbox · Mini GT · Greenlight · Majorette · Tarmac · Pop Race · Inno64 · Solido · Street Warrior · Stancehunters · TrendHobby";

const VALUE_PROPS: [string, string][] = [
  ["Escrow protected", "Payments are held safely until you confirm the item arrived exactly as described."],
  ["Box-scan listings", "Snap the front and back of the box — details auto-fill. Listing takes seconds, not minutes."],
  ["Most Wanted", "Post the grail you're hunting and let owners come to you with offers."],
];

export default function Home() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-6">
      <header className="flex items-center justify-between py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/showclutch-logo.png" alt="ShowClutch" className="h-8 w-auto" />
        <a
          href="#waitlist"
          className="rounded-lg border border-fire/40 bg-fire/10 px-4 py-2 text-sm font-medium text-fire transition-colors hover:bg-fire hover:text-white"
        >
          Join Waitlist
        </a>
      </header>

      <main className="flex flex-1 flex-col justify-center py-14">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-line px-3 py-1 text-xs tracking-wide text-ash-2">
          <span className="h-1.5 w-1.5 rounded-full bg-fire" />
          India&apos;s first collector-grade die-cast marketplace
        </div>

        <h1 className="font-display mt-6 text-6xl leading-[0.95] tracking-tight text-ash sm:text-8xl">
          BID.
          <br />
          TRADE.
          <br />
          <span className="text-fire">SHOW OFF.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ash-2">
          Auctions, exchanges, and escrow-protected deals for serious die-cast collectors. Buy and
          sell Hot Wheels, Tomica, Mini GT and more — safely, on one platform.
        </p>
        <p className="mt-3 text-sm text-ash-3">{BRAND_LINE}</p>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {VALUE_PROPS.map(([title, desc]) => (
            <div key={title} className="rounded-xl border border-line bg-surface/40 p-5">
              <div className="font-display text-lg text-ash">{title}</div>
              <p className="mt-1 text-sm leading-relaxed text-ash-2">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <section id="waitlist" className="scroll-mt-6 py-16">
        <div className="rounded-3xl border border-line bg-ink-2/70 p-8 sm:p-10">
          <h2 className="font-display text-3xl text-ash sm:text-4xl">Join the Waitlist</h2>
          <p className="mt-2 max-w-xl text-ash-2">
            We&apos;re building ShowClutch now. Get early access, help shape the features, and be
            first in line when we launch.
          </p>
          <div className="mt-8 max-w-2xl">
            <WaitlistForm />
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-sm text-ash-3">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <span>© 2026 ShowClutch · Bengaluru, India</span>
          <span>Bid. Trade. Show Off.</span>
        </div>
      </footer>
    </div>
  );
}
