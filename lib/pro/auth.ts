import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProRole = "owner" | "admin" | "member" | "viewer";

export interface ProOrg {
  id: string;
  slug: string;
  name: string;
  type: "advisor" | "funeral" | "law" | "employer" | "other";
  status: "active" | "suspended" | "closed";
  plan: string | null;
  seatCount: number;
  logoUrl: string | null;
}

export interface ProUser {
  id: string;
  email: string;
  fullName: string;
  /** Currently selected org (cookie-driven, falls back to oldest membership). */
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationType: ProOrg["type"];
  role: ProRole;
  /** Other orgs the user can switch into. Empty for single-org accounts. */
  otherOrgs: ProOrg[];
}

const PRO_ROLES: ProRole[] = ["owner", "admin", "member", "viewer"];
export const PRO_ORG_COOKIE = "ow_pro_org";

interface MembershipRow {
  organization_id: string;
  role: ProRole;
  created_at: string;
  organizations: {
    id: string;
    slug: string;
    name: string;
    type: ProOrg["type"];
    status: ProOrg["status"];
    plan: string | null;
    seat_count: number;
    logo_url: string | null;
  } | null;
}

/**
 * Server-only: verifies the current request is from a signed-in Pro staff
 * member with at least one active org membership. Redirects to /pro/login
 * otherwise. The currently selected org is chosen via the `ow_pro_org` cookie
 * (set by the org switcher), falling back to the oldest membership so a fresh
 * sign-in lands somewhere sensible.
 */
export async function requirePro(): Promise<ProUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/pro/login");
  }

  // Service-role read: organization_members + organizations are RLS-locked, so
  // the anon-key client can't see them. Filtering by user_id keeps the data
  // scoped to the requester.
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/pro/login");
  }

  const { data: memberships } = await admin
    .from("organization_members")
    .select(
      "organization_id, role, created_at, organizations:organization_id ( id, slug, name, type, status, plan, seat_count, logo_url )",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .returns<MembershipRow[]>();

  // Drop memberships that reference a suspended/closed org or a role outside
  // our allowed enum. An attacker who manipulated the org cookie would still
  // hit `redirect` below if no usable org remained.
  const usable = (memberships ?? []).filter(
    (m) => m.organizations && m.organizations.status === "active" && PRO_ROLES.includes(m.role),
  );

  if (usable.length === 0) {
    redirect("/pro/login");
  }

  const cookieStore = await cookies();
  const preferredOrgId = cookieStore.get(PRO_ORG_COOKIE)?.value ?? null;
  const selected =
    usable.find((m) => m.organization_id === preferredOrgId) ?? usable[0];
  const others = usable
    .filter((m) => m.organization_id !== selected.organization_id)
    .map((m) => ({
      id: m.organizations!.id,
      slug: m.organizations!.slug,
      name: m.organizations!.name,
      type: m.organizations!.type,
      status: m.organizations!.status,
      plan: m.organizations!.plan,
      seatCount: m.organizations!.seat_count,
      logoUrl: m.organizations!.logo_url,
    }));

  return {
    id: profile.id as string,
    email: (profile.email as string) ?? user.email ?? "",
    fullName: (profile.full_name as string) ?? "",
    organizationId: selected.organizations!.id,
    organizationName: selected.organizations!.name,
    organizationSlug: selected.organizations!.slug,
    organizationType: selected.organizations!.type,
    role: selected.role,
    otherOrgs: others,
  };
}

export const canManageOrg = (r: ProRole) => r === "owner" || r === "admin";
export const canInviteClients = (r: ProRole) => r !== "viewer";
export const canEditClientDocs = (r: ProRole) => r === "owner" || r === "admin";
export const canManageBilling = (r: ProRole) => r === "owner";
