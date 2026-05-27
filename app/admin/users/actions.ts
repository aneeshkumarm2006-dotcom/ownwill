"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/admin/audit";

type Plan = "none" | "essentials" | "premium" | "premium_x2";

function ok() { return { error: null as string | null }; }
function err(message: string) { return { error: message }; }

/** Grant or revoke a user's plan (manual comp). */
export async function setUserPlan(userId: string, plan: Plan): Promise<{ error: string | null }> {
  const actor = await requireAdmin();
  const admin = createAdminClient();
  const patch: Record<string, unknown> = { plan };
  if (plan !== "none") patch.plan_purchased_at = new Date().toISOString();
  const { error } = await admin.from("profiles").update(patch).eq("id", userId);
  if (error) return err(error.message);
  await logAuditEvent({
    actorId: actor.id, actorEmail: actor.email,
    action: plan === "none" ? "user.revoke_plan" : "user.grant_plan",
    targetType: "user", targetId: userId, metadata: { plan },
  });
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  return ok();
}

/** Suspend (ban) or unsuspend a user via Supabase Auth. */
export async function setUserSuspended(userId: string, suspend: boolean): Promise<{ error: string | null }> {
  const actor = await requireAdmin();
  const admin = createAdminClient();
  // 'none' clears the ban; a long duration effectively suspends.
  const ban_duration = suspend ? "876000h" : "none";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.auth.admin as any).updateUserById(userId, { ban_duration });
  if (error) return err(error.message);
  await logAuditEvent({
    actorId: actor.id, actorEmail: actor.email,
    action: suspend ? "user.suspend" : "user.unsuspend",
    targetType: "user", targetId: userId,
  });
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  return ok();
}

/** Hard-delete a user (PIPEDA). Cascades via FK on profiles + data tables. */
export async function deleteUser(userId: string): Promise<{ error: string | null }> {
  const actor = await requireAdmin();
  if (actor.id === userId) return err("You can't delete your own account from the admin panel.");
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return err(error.message);
  await logAuditEvent({
    actorId: actor.id, actorEmail: actor.email,
    action: "user.delete", targetType: "user", targetId: userId,
  });
  revalidatePath("/admin/users");
  return ok();
}

/** Trigger Supabase to resend the email-verification link. */
export async function resendVerification(userId: string, email: string): Promise<{ error: string | null }> {
  const actor = await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.resend({ type: "signup", email });
  if (error) return err(error.message);
  await logAuditEvent({
    actorId: actor.id, actorEmail: actor.email,
    action: "user.resend_verification", targetType: "user", targetId: userId, metadata: { email },
  });
  return ok();
}

/** Send a password-reset email to the user. */
export async function sendPasswordReset(userId: string, email: string): Promise<{ error: string | null }> {
  const actor = await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.resetPasswordForEmail(email);
  if (error) return err(error.message);
  await logAuditEvent({
    actorId: actor.id, actorEmail: actor.email,
    action: "user.password_reset", targetType: "user", targetId: userId, metadata: { email },
  });
  return ok();
}
