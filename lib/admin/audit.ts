import { createAdminClient } from "@/lib/supabase/admin";

export interface AuditEvent {
  actorId: string;
  actorEmail: string;
  action: string; // e.g. "user.suspend", "plan.grant", "doc.regenerate_pdf"
  targetType?: string; // e.g. "user", "document", "payment"
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

/**
 * Append-only log of admin actions. Always called from server code with the
 * service-role client; never exposed to the browser.
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("admin_audit_log").insert({
      actor_id: event.actorId,
      actor_email: event.actorEmail,
      action: event.action,
      target_type: event.targetType ?? null,
      target_id: event.targetId ?? null,
      metadata: event.metadata ?? {},
      ip: event.ip ?? null,
    });
  } catch (e) {
    // Never let audit logging break the actual admin action.
    console.error("[audit] failed to log", event.action, e);
  }
}
