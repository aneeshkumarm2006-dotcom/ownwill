import { createAdminClient } from "@/lib/supabase/admin";

export interface ManagedByOrg {
  id: string;
  slug: string;
  name: string;
  type: "advisor" | "funeral" | "law" | "employer" | "other";
  acceptedAt: string | null;
}

export interface FirmStaffViewEvent {
  actorEmail: string;
  action: string;
  createdAt: string;
}

/**
 * Server-only: returns the org that currently manages this customer (if any).
 * Reads through the service-role client because organization_clients is
 * RLS-locked. Used by the customer dashboard + settings page to render the
 * "Managed by X" badge and the revoke control.
 */
export async function getManagedByOrg(userId: string): Promise<ManagedByOrg | null> {
  if (!userId) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("organization_clients")
    .select(
      "accepted_at, organizations:organization_id ( id, slug, name, type )",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle<{
      accepted_at: string | null;
      organizations: {
        id: string;
        slug: string;
        name: string;
        type: ManagedByOrg["type"];
      } | null;
    }>();

  if (!data?.organizations) return null;
  return {
    id: data.organizations.id,
    slug: data.organizations.slug,
    name: data.organizations.name,
    type: data.organizations.type,
    acceptedAt: data.accepted_at,
  };
}

/**
 * Server-only: the most recent staff "view" events on this customer's record
 * (across all orgs they've ever been linked to). Surfaced in the customer's
 * account history as a trust feature — the user can see exactly who at their
 * firm has looked at their documents and when.
 */
export async function getFirmStaffViewHistory(
  userId: string,
  limit = 20,
): Promise<FirmStaffViewEvent[]> {
  if (!userId) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_audit_log")
    .select("actor_email, action, created_at")
    .eq("target_type", "user")
    .eq("target_id", userId)
    .in("action", ["pro.client.view", "pro.client.edit"])
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((r) => ({
    actorEmail: (r.actor_email as string) ?? "",
    action: r.action as string,
    createdAt: r.created_at as string,
  }));
}
