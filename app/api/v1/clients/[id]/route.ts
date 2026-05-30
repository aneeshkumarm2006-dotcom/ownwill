import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApiRequest } from "@/lib/pro/api-auth";
import { apiError, apiOk } from "@/lib/api/response";

export const runtime = "nodejs";

/**
 * GET /api/v1/clients/{id} — one client's profile + document index.
 *
 * Only resolves the client if they're linked to the calling org (any status).
 * Returns the profile, the linkage, and per-document metadata (no answers).
 * The doc body is owned by the customer; firms get the index so they can show
 * status and pull the PDF via the customer-facing download flow.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await authenticateApiRequest(req);
  if (!ctx) return apiError("Unauthorized", 401);
  const { id } = await params;
  if (!id) return apiError("Missing client id", 400);

  const admin = createAdminClient();

  const { data: link } = await admin
    .from("organization_clients")
    .select("user_id, status, invited_email, invited_at, accepted_at, revoked_at, notes")
    .eq("organization_id", ctx.organizationId)
    .eq("user_id", id)
    .maybeSingle();
  if (!link) return apiError("Client not found", 404);

  const [{ data: profile }, { data: docs }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, full_name, province, phone, city")
      .eq("id", id)
      .maybeSingle(),
    admin
      .from("documents")
      .select("id, type, status, province, pdf_url, pdf_generated_at, completed_at, updated_at")
      .eq("user_id", id)
      .eq("is_current", true)
      .order("type"),
  ]);

  return apiOk({
    organization: { id: ctx.organizationId, slug: ctx.organizationSlug, name: ctx.organizationName },
    client: {
      id,
      email: (profile?.email as string) ?? (link.invited_email as string) ?? "",
      full_name: (profile?.full_name as string) ?? null,
      province: (profile?.province as string) ?? null,
      city: (profile?.city as string) ?? null,
      phone: (profile?.phone as string) ?? null,
      status: link.status as "active" | "invited" | "revoked",
      invited_at: (link.invited_at as string) ?? null,
      accepted_at: (link.accepted_at as string) ?? null,
      revoked_at: (link.revoked_at as string) ?? null,
      notes: (link.notes as string) ?? null,
    },
    documents: (docs ?? []).map((d) => ({
      id: d.id as string,
      type: d.type as string,
      status: d.status as string,
      province: (d.province as string) ?? null,
      pdf_url: (d.pdf_url as string) ?? null,
      pdf_generated_at: (d.pdf_generated_at as string) ?? null,
      completed_at: (d.completed_at as string) ?? null,
      updated_at: d.updated_at as string,
    })),
  });
}
