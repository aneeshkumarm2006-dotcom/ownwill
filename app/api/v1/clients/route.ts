import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApiRequest } from "@/lib/pro/api-auth";
import { apiError, apiOk } from "@/lib/api/response";

export const runtime = "nodejs";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

/**
 * GET /api/v1/clients — list the calling org's clients.
 *
 * Filters:
 *   ?status=active|invited|revoked
 *   ?limit=1..100 (default 50)
 *   ?cursor=<accepted_at ISO> — keyset pagination, opaque to clients.
 *
 * Returns minimal contact info + linkage status. Document content is
 * intentionally not included here — that's what /clients/{id} is for, and the
 * separation lets sync jobs do cheap diffs.
 */
export async function GET(req: NextRequest) {
  const ctx = await authenticateApiRequest(req);
  if (!ctx) return apiError("Unauthorized", 401);

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const cursor = url.searchParams.get("cursor");
  const rawLimit = Number(url.searchParams.get("limit") ?? DEFAULT_PAGE_SIZE);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : DEFAULT_PAGE_SIZE));

  if (status && !["active", "invited", "revoked"].includes(status)) {
    return apiError("Invalid status filter", 400);
  }

  const admin = createAdminClient();
  let query = admin
    .from("organization_clients")
    .select("user_id, status, invited_email, invited_at, accepted_at, revoked_at, notes")
    .eq("organization_id", ctx.organizationId)
    .order("accepted_at", { ascending: false, nullsFirst: false })
    .order("invited_at", { ascending: false })
    .limit(limit + 1);

  if (status) query = query.eq("status", status);
  if (cursor) {
    // Keyset on accepted_at (then invited_at). Simple <= comparison is enough
    // for now; if traffic warrants we'll add a strict tiebreaker.
    query = query.lte("accepted_at", cursor);
  }

  const { data: links, error } = await query;
  if (error) return apiError(error.message, 500);

  const rows = (links ?? []).slice(0, limit);
  const userIds = rows.map((l) => l.user_id as string);

  let profileById = new Map<string, { email: string; full_name: string; province: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email, full_name, province")
      .in("id", userIds);
    profileById = new Map(
      (profiles ?? []).map((p) => [
        p.id as string,
        {
          email: (p.email as string) ?? "",
          full_name: (p.full_name as string) ?? "",
          province: (p.province as string) ?? null,
        },
      ]),
    );
  }

  const data = rows.map((l) => {
    const profile = profileById.get(l.user_id as string);
    return {
      id: l.user_id as string,
      email: profile?.email || (l.invited_email as string) || "",
      full_name: profile?.full_name || null,
      province: profile?.province ?? null,
      status: l.status as "active" | "invited" | "revoked",
      invited_at: (l.invited_at as string) ?? null,
      accepted_at: (l.accepted_at as string) ?? null,
      revoked_at: (l.revoked_at as string) ?? null,
    };
  });

  const hasMore = (links ?? []).length > limit;
  const nextCursor = hasMore ? data[data.length - 1]?.accepted_at ?? null : null;

  return apiOk({
    organization: { id: ctx.organizationId, slug: ctx.organizationSlug, name: ctx.organizationName },
    clients: data,
    page: { limit, has_more: hasMore, next_cursor: nextCursor },
  });
}
