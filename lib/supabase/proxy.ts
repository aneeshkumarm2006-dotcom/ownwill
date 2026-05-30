import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Route prefixes that require an authenticated user. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/will",
  "/poa-health",
  "/poa-property",
  "/assets",
  "/payment",
  "/billing",
  "/review",
  "/signing",
  "/documents",
  "/help",
  "/admin",
  // Pro / B2B authed surface. `/pro` (marketing), `/pro/login`,
  // `/pro/signup`, and `/pro/invite/[token]` stay public — those are carved
  // out below the same way `/admin/login` is for the admin entry point.
  "/pro/dashboard",
  "/pro/clients",
  "/pro/team",
  "/pro/billing",
  "/pro/settings",
  "/pro/audit",
];

/**
 * Pro entry points that must stay reachable without a session. Mirrors the
 * `/admin/login` carve-out — without these, an anon visitor trying to sign up
 * or accept an invite would loop on the redirect below.
 */
const PRO_PUBLIC_PATHS = ["/pro", "/pro/login", "/pro/signup"];
function isProPublic(pathname: string): boolean {
  if (PRO_PUBLIC_PATHS.includes(pathname)) return true;
  // /pro/invite/<token> — the token is opaque, so prefix-match the parent.
  return pathname.startsWith("/pro/invite/");
}

/**
 * Refreshes the Supabase auth session on every matched request and guards the
 * authenticated app routes. Runs from the root `proxy.ts` (Next.js 16's rename
 * of `middleware.ts`).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    // Dev: fail loud so the misconfiguration is impossible to miss.
    // Prod: surface a 500 — silently skipping auth would expose protected
    // routes to anyone (every request would see `user = null` and the
    // protected-prefix check below would still redirect, but downstream
    // server code that trusts cookies/session would be broken).
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        "[proxy] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      );
    }
    console.error("[proxy] Supabase env vars missing — returning 500.");
    return new NextResponse("Server misconfigured", { status: 500 });
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run any code between createServerClient and getUser().
  // getUser() revalidates the token and refreshes the session cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // /admin/login + the public /pro entry points must be reachable without a
  // session, otherwise we'd loop on the redirect below.
  const isAdminLogin = pathname === "/admin/login";
  const isProPublicPath = isProPublic(pathname);
  // Exact match or trailing-slash match only — so "/willx" doesn't match "/will".
  const isProtected =
    !isAdminLogin &&
    !isProPublicPath &&
    PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    // Admin and Pro routes bounce to their own login screens so the three
    // entry points (customer / admin / Pro) stay separate.
    const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
    const isPro = pathname.startsWith("/pro/");
    url.pathname = isAdmin ? "/admin/login" : isPro ? "/pro/login" : "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
