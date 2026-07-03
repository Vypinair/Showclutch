import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SellForm } from "@/components/SellForm";

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-6">
      <SiteHeader />
      <main className="py-10">
        <h1 className="font-display text-4xl text-ash">List an item</h1>
        <p className="mt-2 text-ash-2">Add a piece to the ShowClutch catalogue.</p>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <SellForm />
      </main>
    </div>
  );
}
