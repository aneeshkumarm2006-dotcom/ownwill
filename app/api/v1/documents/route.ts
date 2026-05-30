import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApiRequest } from "@/lib/pro/api-auth";
import { apiError, apiOk } from "@/lib/api/response";

export const runtime = "nodejs";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

/**
 * GET /api/v1/documents — flat index of every current document belonging to
 * the calling org's active clients. Useful for sync jobs that want to drive
 * downstream workflow off document status without one request per client.
 *
 * Filters: ?type=will|poa_health|poa_property|asset_list
 *          ?status=draft|completed|paid|generated
 *          ?limit, ?cursor (updated_at)
 */
export async function GET(req: NextRequest) {
  const ctx = await authenticateApiRequest(req);
  if (!ctx) return apiError("Unauthorized", 401);

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");
  const cursor = url.searchParams.get("cursor");
  const rawLimit = Number(url.searchParams.get("limit") ?? DEFAULT_PAGE_SIZE);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : DEFAULT_PAGE_SIZE));

  if (type && !["will", "poa_health", "poa_property", "asset_list"].includes(type)) {
    return apiError("Invalid type filter", 400);
  }
  if (status && !["draft", "completed", "paid", "generated"].includes(status)) {
    return apiError("Invalid status filter", 400);
  }

  const admin = createAdminClient();

  // Step 1: which clients belong to this org (active only — revoked links
  // should not leak data into the API).
  const { data: links } = await admin
    .from("organization_clients")
    .select("user_id")
    .eq("organization_id", ctx.organizationId)
    .eq("status", "active");
  const userIds = (links ?? []).map((l) => l.user_id as string);
  if (userIds.length === 0) {
    return apiOk({
      organization: { id: ctx.organizationId, slug: ctx.organizationSlug, name: ctx.organizationName },
      documents: [],
      page: { limit, has_more: false, next_cursor: null },
    });
  }

  let q = admin
    .from("documents")
    .select("id, user_id, type, status, province, pdf_url, pdf_generated_at, completed_at, updated_at")
    .in("user_id", userIds)
    .eq("is_current", true)
    .order("updated_at", { ascending: false })
    .limit(limit + 1);

  if (type) q = q.eq("type", type);
  if (status) q = q.eq("status", status);
  if (cursor) q = q.lte("updated_at", cursor);

  const { data: docs, error } = await q;
  if (error) return apiError(error.message, 500);

  const page = (docs ?? []).slice(0, limit);
  const hasMore = (docs ?? []).length > limit;
  const nextCursor = hasMore ? (page[page.length - 1]?.updated_at as string) : null;

  return apiOk({
    organization: { id: ctx.organizationId, slug: ctx.organizationSlug, name: ctx.organizationName },
    documents: page.map((d) => ({
      id: d.id as string,
      client_id: d.user_id as string,
      type: d.type as string,
      status: d.status as string,
      province: (d.province as string) ?? null,
      pdf_url: (d.pdf_url as string) ?? null,
      pdf_generated_at: (d.pdf_generated_at as string) ?? null,
      completed_at: (d.completed_at as string) ?? null,
      updated_at: d.updated_at as string,
    })),
    page: { limit, has_more: hasMore, next_cursor: nextCursor },
  });
}
