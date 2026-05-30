import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * PIPEDA-aligned personal data export (§7.2).
 *
 * Returns a JSON snapshot of everything we hold about the signed-in user:
 * profile, will/POA/asset draft contents, document metadata, payments, email
 * activity, plus *organization context* if a firm has been linked to the
 * account. Document PDFs are referenced by ID — the user already has a
 * download path for those through /documents.
 *
 * Audited as `pro.client.export` when an org link exists, mirroring the
 * customer-initiated revoke pattern so the firm can see the export happened.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminClient();

  // Pull everything in parallel — each row is small, every read filters on the
  // user id so cross-tenant leaks aren't possible.
  const [
    { data: profile },
    { data: documents },
    { data: willData },
    { data: poaHealthData },
    { data: poaPropertyData },
    { data: assetListData },
    { data: payments },
    { data: emails },
    { data: signing },
    { data: organizations },
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    admin.from("documents").select("*").eq("user_id", user.id),
    admin.from("will_data").select("*").eq("user_id", user.id),
    admin.from("poa_health_data").select("*").eq("user_id", user.id),
    admin.from("poa_property_data").select("*").eq("user_id", user.id),
    admin.from("asset_list_data").select("*").eq("user_id", user.id),
    admin.from("payments").select("*").eq("user_id", user.id),
    admin.from("email_logs").select("*").eq("user_id", user.id),
    admin.from("signing_instructions").select("*").eq("user_id", user.id),
    // Org context (§7.2). All historical links — active, invited, revoked —
    // so the user has the full picture of which firms have ever been able to
    // see this account. The org row is joined in for human readability.
    admin
      .from("organization_clients")
      .select(
        "organization_id, status, invited_email, invited_at, accepted_at, revoked_at, organizations:organization_id ( id, slug, name, type )",
      )
      .eq("user_id", user.id),
  ]);

  // Staff-view history is sourced from the audit log — same surface the
  // FirmAccessCard renders — so the export matches what the user sees.
  const { data: firmActivity } = await admin
    .from("admin_audit_log")
    .select("actor_email, action, metadata, created_at")
    .eq("target_type", "user")
    .eq("target_id", user.id)
    .like("action", "pro.%")
    .order("created_at", { ascending: false })
    .limit(500);

  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
    },
    profile,
    documents,
    will: willData,
    poaHealth: poaHealthData,
    poaProperty: poaPropertyData,
    assetList: assetListData,
    payments,
    emails,
    signingInstructions: signing,
    organizations: organizations ?? [],
    firmActivity: firmActivity ?? [],
    notes:
      "OwnWill personal data export. Document PDFs are referenced by ID — download them from your dashboard. If you have questions about any record, email support@ownwill.ca.",
  };

  // Best-effort audit. Only stamp the active org so a user with no firm
  // doesn't generate org-scoped events.
  const activeLink = (organizations ?? []).find(
    (r) => (r as { status?: string }).status === "active",
  );
  if (activeLink) {
    // Dynamic import keeps the audit dependency out of the hot path for
    // anonymous-shaped failures (lib/admin/audit is a server-only module).
    const { logAuditEvent } = await import("@/lib/admin/audit");
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email ?? "",
      action: "pro.client.export",
      targetType: "user",
      targetId: user.id,
      metadata: {
        organization_id: (activeLink as { organization_id: string })
          .organization_id,
        initiated_by: "client",
      },
    });
  }

  const filename = `ownwill-export-${user.id}-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
