import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Optional site-wide password gate for the private pre-launch phase.
// Enabled only when SITE_GATE_PASSWORD is set (e.g. in Vercel env vars).
// When unset (local dev), the site is open as normal.
function passwordGate(request: NextRequest): NextResponse | null {
  const password = process.env.SITE_GATE_PASSWORD;
  if (!password) return null;

  const user = process.env.SITE_GATE_USER || "showclutch";
  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    try {
      const [u, ...rest] = atob(header.slice(6)).split(":");
      if (u === user && rest.join(":") === password) return null;
    } catch {
      // fall through to challenge
    }
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="ShowClutch (private)"' },
  });
}

export async function proxy(request: NextRequest) {
  const blocked = passwordGate(request);
  if (blocked) return blocked;
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
