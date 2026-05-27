import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Uses the request cookies so the user's session is available server-side.
 *
 * Note: `cookies()` is async in Next.js 16, so this helper must be awaited.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch (err) {
            // `setAll` from a Server Component throws because cookies are
            // read-only there; that's expected and safe when the proxy
            // (see proxy.ts) refreshes the session on the next request.
            // Anything else is worth surfacing so we don't lose a real bug
            // (e.g. a route handler hitting an unrelated cookie error).
            const message = err instanceof Error ? err.message : String(err);
            const names = cookiesToSet.map((c) => c.name).join(", ");
            console.warn(
              `[supabase/server] setAll skipped (likely Server Component) — cookies: ${names}; reason: ${message}`,
            );
          }
        },
      },
    },
  );
}
