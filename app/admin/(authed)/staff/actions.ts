"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/admin/audit";

type Role = "customer" | "support" | "admin" | "super_admin";

const STAFF_ROLES: Role[] = ["support", "admin", "super_admin"];

type Result = { error: string | null };
function err(message: string): Result { return { error: message }; }
function ok(): Result { return { error: null }; }

async function requireSuperAdmin() {
  const actor = await requireAdmin();
  if (actor.role !== "super_admin") {
    throw new Error("Only super admins can manage staff.");
  }
  return actor;
}

/** Grant or change a user's staff role. Email-based lookup so super-admins
 *  don't have to copy UUIDs around. */
export async function grantStaffRole(args: { email: string; role: Role }): Promise<Result> {
  const actor = await requireSuperAdmin();
  if (!STAFF_ROLES.includes(args.role) && args.role !== "customer") {
    return err("Invalid role.");
  }

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("id, email, role")
    .ilike("email", args.email.trim())
    .maybeSingle();

  if (!target) return err("No user with that email. They must sign up first.");
  if (target.id === actor.id) return err("Use another super admin to change your own role.");

  const prevRole = (target.role as Role) ?? "customer";
  if (prevRole === args.role) return err(`Already ${args.role}.`);

  // Block demoting the last super_admin.
  if (prevRole === "super_admin" && args.role !== "super_admin") {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");
    if ((count ?? 0) <= 1) return err("Can't demote the last super admin.");
  }

  const { error } = await admin
    .from("profiles")
    .update({ role: args.role, updated_at: new Date().toISOString() })
    .eq("id", target.id);
  if (error) return err(error.message);

  await logAuditEvent({
    actorId: actor.id, actorEmail: actor.email,
    action: args.role === "customer" ? "staff.revoke" : "staff.set_role",
    targetType: "user", targetId: target.id as string,
    metadata: { email: target.email, from: prevRole, to: args.role },
  });

  revalidatePath("/admin/staff");
  revalidatePath(`/admin/users/${target.id}`);
  return ok();
}

/** Convenience: revoke = set role back to 'customer'. */
export async function revokeStaff(userId: string): Promise<Result> {
  const actor = await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: target } = await admin
    .from("profiles")
    .select("id, email, role")
    .eq("id", userId)
    .maybeSingle();
  if (!target) return err("User not found.");
  if (target.id === actor.id) return err("Use another super admin to revoke your own role.");

  const prevRole = (target.role as Role) ?? "customer";
  if (!STAFF_ROLES.includes(prevRole)) return err("Not a staff member.");

  if (prevRole === "super_admin") {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");
    if ((count ?? 0) <= 1) return err("Can't revoke the last super admin.");
  }

  const { error } = await admin
    .from("profiles")
    .update({ role: "customer", updated_at: new Date().toISOString() })
    .eq("id", target.id);
  if (error) return err(error.message);

  await logAuditEvent({
    actorId: actor.id, actorEmail: actor.email,
    action: "staff.revoke",
    targetType: "user", targetId: target.id as string,
    metadata: { email: target.email, from: prevRole, to: "customer" },
  });

  revalidatePath("/admin/staff");
  revalidatePath(`/admin/users/${target.id}`);
  return ok();
}
