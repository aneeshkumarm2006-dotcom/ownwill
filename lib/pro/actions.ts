"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/admin/audit";
import { sendEmail } from "@/lib/email/send";
import {
  proClientInviteTemplate,
  proStaffInviteTemplate,
} from "@/lib/email/templates";
import { requirePro, canManageOrg, PRO_ORG_COOKIE, type ProRole } from "@/lib/pro/auth";
import {
  getOrgBrandingForEmail,
  isValidHexColor,
  removeOrgLogo as removeOrgLogoBlob,
  setOrgLogo,
} from "@/lib/pro/branding";

export type ActionResult<T = undefined> =
  | { error: null; data?: T }
  | { error: string; data?: undefined };

const OK: ActionResult = { error: null };
const fail = (message: string): ActionResult => ({ error: message });

const ORG_TYPES = ["advisor", "funeral", "law", "employer", "other"] as const;
type OrgType = (typeof ORG_TYPES)[number];

const INVITE_ROLES: ProRole[] = ["admin", "member", "viewer"];

const SLUG_RE = /^[a-z][a-z0-9-]{2,38}[a-z0-9]$/;
const RESERVED_SLUGS = new Set([
  "pro", "admin", "api", "auth", "login", "signup", "invite",
  "dashboard", "billing", "settings", "team", "clients", "audit",
  "www", "ownwill", "support", "help", "about",
]);

/** Returns true if the slug is syntactically valid AND not already taken. */
export async function isOrgSlugAvailable(slug: string): Promise<boolean> {
  const cleaned = slug.trim().toLowerCase();
  if (!SLUG_RE.test(cleaned) || RESERVED_SLUGS.has(cleaned)) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", cleaned)
    .maybeSingle();
  return !data;
}

function suggestSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

interface CreateOrganizationArgs {
  name: string;
  type: OrgType;
  slug: string;
  billingEmail?: string;
  licensingNumber?: string;
  province?: string;
}

/**
 * Called from /pro/signup after the user has authenticated. Creates the org
 * and writes the first owner membership row. The current user becomes the
 * org owner.
 */
export async function createOrganization(
  args: CreateOrganizationArgs,
): Promise<ActionResult<{ slug: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("You must be signed in to create an organization.");

  const name = args.name.trim();
  if (name.length < 2) return fail("Organization name is too short.");
  if (name.length > 200) return fail("Organization name is too long.");

  if (!ORG_TYPES.includes(args.type)) return fail("Invalid organization type.");

  const slug = args.slug.trim().toLowerCase();
  if (!SLUG_RE.test(slug)) {
    return fail(
      "URL slug must be 3–40 lowercase letters, numbers, or hyphens (and start with a letter).",
    );
  }
  if (RESERVED_SLUGS.has(slug)) {
    return fail("That URL is reserved. Please choose a different one.");
  }

  const admin = createAdminClient();

  // Pre-check + insert. Race window between the two is closed by the unique
  // index on organizations.slug — a concurrent dupe would surface as a 23505
  // and we translate it back to the user.
  const { data: clash } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (clash) return fail("That URL is already taken. Please choose another.");

  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({
      slug,
      name,
      type: args.type,
      billing_email: args.billingEmail?.trim() || user.email,
      licensing_number: args.licensingNumber?.trim() || null,
      province: args.province ?? null,
      created_by: user.id,
    })
    .select("id, slug")
    .single();

  if (orgErr || !org) {
    if (orgErr?.code === "23505") {
      return fail("That URL is already taken. Please choose another.");
    }
    return fail(orgErr?.message ?? "Could not create organization.");
  }

  const { error: memberErr } = await admin.from("organization_members").insert({
    organization_id: org.id,
    user_id: user.id,
    role: "owner",
    accepted_at: new Date().toISOString(),
  });

  if (memberErr) {
    // Roll back the org so a failed membership write doesn't leave an
    // orphaned org row that no one can manage.
    await admin.from("organizations").delete().eq("id", org.id);
    return fail(memberErr.message);
  }

  await logAuditEvent({
    actorId: user.id,
    actorEmail: user.email ?? "",
    action: "pro.org.create",
    targetType: "organization",
    targetId: org.id as string,
    metadata: { slug, name, type: args.type },
  });

  // Stick the new org into the switcher cookie so the dashboard lands on it.
  const cookieStore = await cookies();
  cookieStore.set(PRO_ORG_COOKIE, org.id as string, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  return { error: null, data: { slug: org.slug as string } };
}

function makeInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * Returns an error string if the org has no seats left, or null if there's room
 * for one more invite. "Seats in use" counts accepted members + pending
 * (un-expired, un-accepted) staff invites so we don't oversell the cap.
 *
 * Orgs that haven't completed billing yet still get a tiny grace allowance
 * (seat_count default = 1) so the very first owner can invite a second person
 * during free trials without the seat cap blocking them.
 */
async function checkSeatCapacity(orgId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("seat_count, stripe_subscription_id")
    .eq("id", orgId)
    .maybeSingle<{ seat_count: number; stripe_subscription_id: string | null }>();
  if (!org) return "Organization not found.";

  // Pre-billing grace: when there's no subscription yet, allow up to 2 seats so
  // the owner can bring in one co-founder before being forced to checkout.
  const cap = org.stripe_subscription_id ? org.seat_count : Math.max(org.seat_count, 2);

  const [{ count: members }, { count: pending }] = await Promise.all([
    admin
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    admin
      .from("organization_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("kind", "staff")
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString()),
  ]);

  const used = (members ?? 0) + (pending ?? 0);
  if (used >= cap) {
    return org.stripe_subscription_id
      ? `Seat limit reached (${cap}). Upgrade your plan in /pro/billing to invite more staff.`
      : "Add billing in /pro/billing before inviting more than 2 teammates.";
  }
  return null;
}

interface InviteStaffArgs {
  email: string;
  role: Exclude<ProRole, "owner">;
}

/**
 * Pro: invite a teammate to the current org. Creates an
 * organization_invitations row and emails the recipient with a 14-day link
 * pointing at /pro/invite/[token].
 */
export async function inviteStaff(args: InviteStaffArgs): Promise<ActionResult> {
  const actor = await requirePro();
  if (!canManageOrg(actor.role)) {
    return fail("Only owners and admins can invite teammates.");
  }
  if (!INVITE_ROLES.includes(args.role)) {
    return fail("Invalid role. Choose admin, member, or viewer.");
  }

  const email = args.email.trim().toLowerCase();
  if (!email || !email.includes("@")) return fail("Please enter a valid email.");

  const admin = createAdminClient();

  // Don't double-invite someone who's already a member of this org.
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (existingProfile) {
    const { data: existingMember } = await admin
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", actor.organizationId)
      .eq("user_id", existingProfile.id)
      .maybeSingle();
    if (existingMember) return fail("That person is already on your team.");
  }

  // Seat cap (Phase 3). Counted seats = accepted members + outstanding staff
  // invites that haven't been consumed yet. Counting open invites prevents the
  // "invite 50 people, only 5 seats" footgun where the limit only triggered
  // after acceptance.
  const seatErr = await checkSeatCapacity(actor.organizationId);
  if (seatErr) return fail(seatErr);

  const token = makeInviteToken();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const { error: inviteErr } = await admin.from("organization_invitations").insert({
    organization_id: actor.organizationId,
    email,
    kind: "staff",
    role: args.role,
    token,
    invited_by: actor.id,
    expires_at: expiresAt.toISOString(),
  });
  if (inviteErr) return fail(inviteErr.message);

  const branding = await getOrgBrandingForEmail(actor.organizationId);
  const tpl = proStaffInviteTemplate({
    orgName: actor.organizationName,
    inviterName: actor.fullName,
    inviterEmail: actor.email,
    token,
    expiresAt,
    branding,
  });
  await sendEmail({ to: email, subject: tpl.subject, html: tpl.html });

  await logAuditEvent({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "pro.staff.invite",
    targetType: "organization",
    targetId: actor.organizationId,
    metadata: { email, role: args.role },
  });

  return OK;
}

interface InviteClientArgs {
  email: string;
}

/**
 * Pro: invite a client to be managed by the current org. The email recipient
 * accepts via /pro/invite/[token]; on accept we create the
 * organization_clients row.
 */
export async function inviteClient(args: InviteClientArgs): Promise<ActionResult> {
  const actor = await requirePro();
  if (actor.role === "viewer") {
    return fail("Viewers can't invite clients.");
  }

  const email = args.email.trim().toLowerCase();
  if (!email || !email.includes("@")) return fail("Please enter a valid email.");

  const admin = createAdminClient();
  const token = makeInviteToken();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const { error: inviteErr } = await admin.from("organization_invitations").insert({
    organization_id: actor.organizationId,
    email,
    kind: "client",
    token,
    invited_by: actor.id,
    expires_at: expiresAt.toISOString(),
  });
  if (inviteErr) return fail(inviteErr.message);

  const branding = await getOrgBrandingForEmail(actor.organizationId);
  const tpl = proClientInviteTemplate({
    orgName: actor.organizationName,
    inviterName: actor.fullName,
    inviterEmail: actor.email,
    token,
    expiresAt,
    branding,
  });
  await sendEmail({ to: email, subject: tpl.subject, html: tpl.html });

  await logAuditEvent({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "pro.client.invite",
    targetType: "organization",
    targetId: actor.organizationId,
    metadata: { email },
  });

  return OK;
}

interface InvitationPreview {
  kind: "staff" | "client";
  orgName: string;
  orgSlug: string;
  role: ProRole | null;
  email: string;
  expired: boolean;
}

/**
 * Read-only fetch for the /pro/invite/[token] page so it can render details
 * before the recipient is signed in. No mutation, no auth required.
 */
export async function getInvitationPreview(
  token: string,
): Promise<ActionResult<InvitationPreview>> {
  if (!token || token.length < 8) return fail("Invitation link is invalid.");
  const admin = createAdminClient();
  const { data: inv } = await admin
    .from("organization_invitations")
    .select(
      "kind, role, email, expires_at, accepted_at, organizations:organization_id ( name, slug )",
    )
    .eq("token", token)
    .maybeSingle<{
      kind: "staff" | "client";
      role: ProRole | null;
      email: string;
      expires_at: string;
      accepted_at: string | null;
      organizations: { name: string; slug: string } | null;
    }>();

  if (!inv) return fail("Invitation not found.");
  if (inv.accepted_at) return fail("This invitation has already been used.");
  if (!inv.organizations) return fail("Invitation organization is missing.");

  return {
    error: null,
    data: {
      kind: inv.kind,
      orgName: inv.organizations.name,
      orgSlug: inv.organizations.slug,
      role: inv.role,
      email: inv.email,
      expired: new Date(inv.expires_at).getTime() < Date.now(),
    },
  };
}

/**
 * Consume an invitation token. The caller MUST be signed in — staff invites
 * land them in organization_members, client invites land them in
 * organization_clients. We don't auto-match by email pre-signup to keep the
 * trust boundary explicit (PIPEDA: client must affirmatively accept).
 */
export async function acceptInvitation(token: string): Promise<ActionResult<{ kind: "staff" | "client" }>> {
  if (!token) return fail("Invitation link is invalid.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please sign in to accept this invitation.");

  const admin = createAdminClient();
  const { data: inv } = await admin
    .from("organization_invitations")
    .select("id, organization_id, kind, role, email, expires_at, accepted_at, invited_by")
    .eq("token", token)
    .maybeSingle();

  if (!inv) return fail("Invitation not found.");
  if (inv.accepted_at) return fail("This invitation has already been used.");
  if (new Date(inv.expires_at as string).getTime() < Date.now()) {
    return fail("This invitation has expired. Ask the sender for a new one.");
  }

  // Sanity check: the signed-in email should match the invited email. We don't
  // hard-fail on mismatch (people use email aliases), but we do log it for
  // audit so a suspicious accept is visible.
  const emailMismatch =
    user.email && user.email.toLowerCase() !== (inv.email as string).toLowerCase();

  const nowIso = new Date().toISOString();

  if (inv.kind === "staff") {
    const role = (inv.role as ProRole) ?? "member";
    const { error } = await admin
      .from("organization_members")
      .upsert(
        {
          organization_id: inv.organization_id,
          user_id: user.id,
          role,
          invited_email: inv.email,
          accepted_at: nowIso,
        },
        { onConflict: "organization_id,user_id" },
      );
    if (error) return fail(error.message);
  } else {
    // Client side: if there's already an active org for this user that's
    // different from this one, we'd violate the org_clients_one_active
    // partial unique. Surface a friendly message instead of an SQL error.
    const { data: activeElsewhere } = await admin
      .from("organization_clients")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .neq("organization_id", inv.organization_id)
      .maybeSingle();
    if (activeElsewhere) {
      return fail(
        "You're already actively managed by another firm. Remove that access from your account settings before accepting this invitation.",
      );
    }

    const { error } = await admin
      .from("organization_clients")
      .upsert(
        {
          organization_id: inv.organization_id,
          user_id: user.id,
          status: "active",
          invited_email: inv.email,
          accepted_at: nowIso,
          added_by: inv.invited_by ?? null,
        },
        { onConflict: "organization_id,user_id" },
      );
    if (error) return fail(error.message);
  }

  // Mark the invite consumed so it can't be replayed.
  await admin
    .from("organization_invitations")
    .update({ accepted_at: nowIso, accepted_user_id: user.id })
    .eq("id", inv.id);

  await logAuditEvent({
    actorId: user.id,
    actorEmail: user.email ?? "",
    action: inv.kind === "staff" ? "pro.staff.accept" : "pro.client.accept",
    targetType: "organization",
    targetId: inv.organization_id as string,
    metadata: {
      invite_email: inv.email,
      email_mismatch: !!emailMismatch,
      role: inv.kind === "staff" ? inv.role : null,
    },
  });

  // For staff, drop the cookie so they land on the org they just joined.
  if (inv.kind === "staff") {
    const cookieStore = await cookies();
    cookieStore.set(PRO_ORG_COOKIE, inv.organization_id as string, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return { error: null, data: { kind: inv.kind as "staff" | "client" } };
}

/**
 * Switch the active org for a multi-org user. Drops the new selection in the
 * cookie + bounces to the dashboard so requirePro() reloads with the new org.
 */
export async function switchOrganization(organizationId: string): Promise<void> {
  const actor = await requirePro();
  const allowed = [actor.organizationId, ...actor.otherOrgs.map((o) => o.id)];
  if (!allowed.includes(organizationId)) {
    // Silently snap back; the UI shouldn't offer an org the user isn't in.
    redirect("/pro/dashboard");
  }
  const cookieStore = await cookies();
  cookieStore.set(PRO_ORG_COOKIE, organizationId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/pro/dashboard");
}

/** Re-export so client components don't have to import the file directly. */
export async function suggestOrgSlug(name: string): Promise<string> {
  return suggestSlug(name);
}

// ============================================================
// Phase 2 — client management
// ============================================================

interface InviteClientsBulkArgs {
  emails: string[];
}

interface BulkInviteResult {
  sent: number;
  skipped: { email: string; reason: string }[];
}

/**
 * Pro: bulk-invite many clients at once (CSV upload path). Dedupes against
 * pending invites + already-managed clients for the same org so a re-upload
 * doesn't double-send. Each entry is processed independently — one bad row
 * doesn't block the rest.
 */
export async function inviteClientsBulk(
  args: InviteClientsBulkArgs,
): Promise<ActionResult<BulkInviteResult>> {
  const actor = await requirePro();
  if (actor.role === "viewer") {
    return fail("Viewers can't invite clients.");
  }

  const cleaned: string[] = [];
  const skipped: BulkInviteResult["skipped"] = [];

  // Normalize + dedupe within the input itself first so a CSV with the same
  // email twice doesn't blow up on the unique-token insert ordering.
  const seen = new Set<string>();
  for (const raw of args.emails) {
    const email = raw.trim().toLowerCase();
    if (!email) continue;
    if (!email.includes("@") || email.length > 320) {
      skipped.push({ email: raw, reason: "Invalid email" });
      continue;
    }
    if (seen.has(email)) {
      skipped.push({ email, reason: "Duplicate in upload" });
      continue;
    }
    seen.add(email);
    cleaned.push(email);
  }

  if (cleaned.length === 0) {
    return { error: null, data: { sent: 0, skipped } };
  }

  const admin = createAdminClient();

  // Pending invites already outstanding for this org.
  const { data: pending } = await admin
    .from("organization_invitations")
    .select("email")
    .eq("organization_id", actor.organizationId)
    .eq("kind", "client")
    .is("accepted_at", null);
  const pendingSet = new Set<string>((pending ?? []).map((r) => (r.email as string).toLowerCase()));

  // Already-active clients on this org (by profile email).
  const { data: existingProfiles } = await admin
    .from("profiles")
    .select("id, email")
    .in("email", cleaned);
  const profileByEmail = new Map<string, string>();
  for (const p of existingProfiles ?? []) {
    profileByEmail.set((p.email as string).toLowerCase(), p.id as string);
  }
  const profileIds = Array.from(profileByEmail.values());
  let activeUserIds = new Set<string>();
  if (profileIds.length > 0) {
    const { data: activeRows } = await admin
      .from("organization_clients")
      .select("user_id")
      .eq("organization_id", actor.organizationId)
      .eq("status", "active")
      .in("user_id", profileIds);
    activeUserIds = new Set((activeRows ?? []).map((r) => r.user_id as string));
  }

  // Branding is per-org (not per-recipient), so fetch the signed logo URL once
  // and reuse it across the whole batch — saves a Storage call per email.
  const branding = await getOrgBrandingForEmail(actor.organizationId);

  let sent = 0;
  for (const email of cleaned) {
    if (pendingSet.has(email)) {
      skipped.push({ email, reason: "Already invited" });
      continue;
    }
    const profileId = profileByEmail.get(email);
    if (profileId && activeUserIds.has(profileId)) {
      skipped.push({ email, reason: "Already a client" });
      continue;
    }

    const token = makeInviteToken();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const { error: inviteErr } = await admin.from("organization_invitations").insert({
      organization_id: actor.organizationId,
      email,
      kind: "client",
      token,
      invited_by: actor.id,
      expires_at: expiresAt.toISOString(),
    });
    if (inviteErr) {
      skipped.push({ email, reason: inviteErr.message });
      continue;
    }

    const tpl = proClientInviteTemplate({
      orgName: actor.organizationName,
      inviterName: actor.fullName,
      inviterEmail: actor.email,
      token,
      expiresAt,
      branding,
    });
    const sendResult = await sendEmail({ to: email, subject: tpl.subject, html: tpl.html });
    if (!sendResult.ok && !sendResult.skipped) {
      // Email sender failed — keep the invite row so it can be resent, but
      // surface the failure in the result.
      skipped.push({ email, reason: "Email send failed" });
      continue;
    }

    sent++;
  }

  await logAuditEvent({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "pro.client.invite",
    targetType: "organization",
    targetId: actor.organizationId,
    metadata: { bulk: true, sent, skipped_count: skipped.length, total: cleaned.length },
  });

  revalidatePath("/pro/clients");
  return { error: null, data: { sent, skipped } };
}

/**
 * Pro: revoke a client's link to the current org. Soft revoke per Phase 0
 * decision #7 — sets status='revoked' + revoked_at=now() so the audit trail
 * survives. Re-invite creates a fresh row.
 */
export async function revokeClient(clientUserId: string): Promise<ActionResult> {
  const actor = await requirePro();
  if (actor.role === "viewer") {
    return fail("Viewers can't revoke clients.");
  }
  if (!clientUserId) return fail("Missing client.");

  const admin = createAdminClient();
  const { data: link } = await admin
    .from("organization_clients")
    .select("status")
    .eq("organization_id", actor.organizationId)
    .eq("user_id", clientUserId)
    .maybeSingle();
  if (!link) return fail("That client isn't linked to your firm.");
  if (link.status === "revoked") return fail("That client is already revoked.");

  const nowIso = new Date().toISOString();
  const { error } = await admin
    .from("organization_clients")
    .update({ status: "revoked", revoked_at: nowIso })
    .eq("organization_id", actor.organizationId)
    .eq("user_id", clientUserId);
  if (error) return fail(error.message);

  await logAuditEvent({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "pro.client.revoke",
    targetType: "user",
    targetId: clientUserId,
    metadata: { organization_id: actor.organizationId },
  });

  revalidatePath(`/pro/clients/${clientUserId}`);
  revalidatePath("/pro/clients");
  return OK;
}

/**
 * Pro: log a client-detail view. Audit-only side-effect; the page renders the
 * data either way. Lets the customer-side history surface "X from <firm>
 * viewed your document at <time>" without any extra UI plumbing.
 */
export async function logClientView(clientUserId: string): Promise<void> {
  if (!clientUserId) return;
  const actor = await requirePro();

  // Quick gate so revoked links don't accidentally produce a view event the
  // client would see in their history.
  const admin = createAdminClient();
  const { data: link } = await admin
    .from("organization_clients")
    .select("status")
    .eq("organization_id", actor.organizationId)
    .eq("user_id", clientUserId)
    .maybeSingle();
  if (!link || link.status !== "active") return;

  await logAuditEvent({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "pro.client.view",
    targetType: "user",
    targetId: clientUserId,
    metadata: { organization_id: actor.organizationId },
  });
}

/**
 * Pro: persist a private staff note about a client. Visible to org staff only;
 * the customer never sees these. Audit-logged as `pro.client.edit`.
 */
export async function updateClientNotes(
  clientUserId: string,
  notes: string,
): Promise<ActionResult> {
  const actor = await requirePro();
  if (actor.role === "viewer") {
    return fail("Viewers can't edit client notes.");
  }
  if (!clientUserId) return fail("Missing client.");
  const trimmed = notes.slice(0, 4000);

  const admin = createAdminClient();
  const { error } = await admin
    .from("organization_clients")
    .update({ notes: trimmed })
    .eq("organization_id", actor.organizationId)
    .eq("user_id", clientUserId);
  if (error) return fail(error.message);

  await logAuditEvent({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "pro.client.edit",
    targetType: "user",
    targetId: clientUserId,
    metadata: { field: "notes", organization_id: actor.organizationId },
  });

  revalidatePath(`/pro/clients/${clientUserId}`);
  return OK;
}

/**
 * Customer-side: a managed client removing their firm's access from their own
 * account settings. Requires the actor to be the *client*; mirrors the Pro
 * revokeClient action but auth-gated to the user themselves.
 */
export async function revokeOwnFirmAccess(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please sign in.");

  const admin = createAdminClient();
  const { data: link } = await admin
    .from("organization_clients")
    .select("organization_id, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!link) return fail("No active firm to remove.");

  const nowIso = new Date().toISOString();
  const { error } = await admin
    .from("organization_clients")
    .update({ status: "revoked", revoked_at: nowIso })
    .eq("organization_id", link.organization_id as string)
    .eq("user_id", user.id);
  if (error) return fail(error.message);

  await logAuditEvent({
    actorId: user.id,
    actorEmail: user.email ?? "",
    action: "pro.client.revoke",
    targetType: "user",
    targetId: user.id,
    metadata: {
      organization_id: link.organization_id,
      initiated_by: "client",
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return OK;
}

// ============================================================
// Phase 4 — White-label settings
// ============================================================

interface UpdateOrgSettingsArgs {
  name: string;
  /** Hex like `#0E4C49`, or empty string to clear. */
  primaryColor: string;
}

/**
 * Pro: persist firm name + primary color. Owner/admin only (canManageOrg).
 * Slug is intentionally not editable here — slug changes break inbound links
 * that have been emailed; route slug rename through a future dedicated flow
 * once we're sure the redirect plumbing is in place.
 */
export async function updateOrgSettings(
  args: UpdateOrgSettingsArgs,
): Promise<ActionResult> {
  const actor = await requirePro();
  if (!canManageOrg(actor.role)) {
    return fail("Only owners and admins can change org settings.");
  }

  const name = args.name.trim();
  if (name.length < 2) return fail("Organization name is too short.");
  if (name.length > 200) return fail("Organization name is too long.");

  const rawColor = args.primaryColor.trim();
  let primary_color: string | null;
  if (rawColor === "") {
    primary_color = null;
  } else if (isValidHexColor(rawColor)) {
    primary_color = rawColor.toLowerCase();
  } else {
    return fail("Primary color must be a hex value like #0E4C49.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ name, primary_color, updated_at: new Date().toISOString() })
    .eq("id", actor.organizationId);
  if (error) return fail(error.message);

  await logAuditEvent({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "pro.org.update",
    targetType: "organization",
    targetId: actor.organizationId,
    metadata: {
      field: "branding",
      name,
      primary_color,
    },
  });

  revalidatePath("/pro/settings");
  revalidatePath("/pro/dashboard");
  return OK;
}

/**
 * Pro: upload a new logo for the firm. FormData-shaped so it works directly
 * with `<form action={uploadOrgLogo}>` from a server component. Owner/admin
 * only. The actual blob handling lives in lib/pro/branding; this layer just
 * enforces auth and audit logging.
 */
export async function uploadOrgLogo(formData: FormData): Promise<ActionResult> {
  const actor = await requirePro();
  if (!canManageOrg(actor.role)) {
    return fail("Only owners and admins can change the logo.");
  }
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return fail("Choose an image to upload.");
  }
  const blob = file as File;
  const buffer = new Uint8Array(await blob.arrayBuffer());
  const result = await setOrgLogo(actor.organizationId, {
    bytes: buffer,
    contentType: blob.type,
    size: blob.size,
  });
  if (result.error) return fail(result.error);

  await logAuditEvent({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "pro.org.update",
    targetType: "organization",
    targetId: actor.organizationId,
    metadata: { field: "logo", path: result.path },
  });

  revalidatePath("/pro/settings");
  return OK;
}

/** Pro: clear the firm logo (DB pointer + storage blob). Owner/admin only. */
export async function removeOrgLogo(): Promise<ActionResult> {
  const actor = await requirePro();
  if (!canManageOrg(actor.role)) {
    return fail("Only owners and admins can change the logo.");
  }
  const result = await removeOrgLogoBlob(actor.organizationId);
  if (result.error) return fail(result.error);

  await logAuditEvent({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "pro.org.update",
    targetType: "organization",
    targetId: actor.organizationId,
    metadata: { field: "logo", cleared: true },
  });

  revalidatePath("/pro/settings");
  return OK;
}
