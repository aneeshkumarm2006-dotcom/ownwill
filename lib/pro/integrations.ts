"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/admin/audit";
import { canManageOrg, requirePro } from "@/lib/pro/auth";
import {
  generateWebhookSecret,
  sendTestEvent,
  WEBHOOK_EVENT_TYPES,
  type WebhookEventType,
} from "@/lib/pro/webhooks";

type ActionResult<T = undefined> =
  | { error: null; data?: T }
  | { error: string; data?: undefined };

const OK: ActionResult = { error: null };
const fail = (msg: string): ActionResult => ({ error: msg });

// ============================================================
// Webhooks
// ============================================================

interface CreateWebhookArgs {
  url: string;
  description?: string;
  events: string[];
}

function validateWebhookUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  // HTTPS only. localhost is allowed in dev for testing, but only over http if
  // we're explicitly running in development.
  if (u.protocol === "https:") return u.toString();
  if (u.protocol === "http:" && process.env.NODE_ENV !== "production") return u.toString();
  return null;
}

export async function createWebhook(
  args: CreateWebhookArgs,
): Promise<ActionResult<{ id: string; secret: string }>> {
  const actor = await requirePro();
  if (!canManageOrg(actor.role)) {
    return fail("Only owners and admins can manage webhooks.");
  }
  const url = validateWebhookUrl(args.url.trim());
  if (!url) return fail("Webhook URL must be a valid https:// URL.");

  const events = args.events.filter((e): e is WebhookEventType =>
    (WEBHOOK_EVENT_TYPES as string[]).includes(e),
  );
  if (events.length === 0) return fail("Pick at least one event type.");

  const description = args.description?.trim().slice(0, 200) || null;
  const secret = generateWebhookSecret();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_webhooks")
    .insert({
      organization_id: actor.organizationId,
      url,
      description,
      events,
      signing_secret: secret,
      created_by: actor.id,
    })
    .select("id, signing_secret")
    .single();
  if (error || !data) return fail(error?.message ?? "Could not create webhook.");

  await logAuditEvent({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "pro.webhook.create",
    targetType: "organization",
    targetId: actor.organizationId,
    metadata: { webhook_id: data.id, url, events },
  });

  revalidatePath("/pro/settings/webhooks");
  return { error: null, data: { id: data.id as string, secret: data.signing_secret as string } };
}

export async function rotateWebhookSecret(
  webhookId: string,
): Promise<ActionResult<{ secret: string }>> {
  const actor = await requirePro();
  if (!canManageOrg(actor.role)) return fail("Only owners and admins can rotate secrets.");
  if (!webhookId) return fail("Missing webhook.");

  const secret = generateWebhookSecret();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_webhooks")
    .update({ signing_secret: secret })
    .eq("id", webhookId)
    .eq("organization_id", actor.organizationId)
    .select("id")
    .maybeSingle();
  if (error) return fail(error.message);
  if (!data) return fail("Webhook not found.");

  await logAuditEvent({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "pro.webhook.rotate_secret",
    targetType: "organization",
    targetId: actor.organizationId,
    metadata: { webhook_id: webhookId },
  });

  revalidatePath("/pro/settings/webhooks");
  return { error: null, data: { secret } };
}

export async function setWebhookStatus(
  webhookId: string,
  status: "active" | "disabled",
): Promise<ActionResult> {
  const actor = await requirePro();
  if (!canManageOrg(actor.role)) return fail("Only owners and admins can change webhook status.");
  if (!webhookId) return fail("Missing webhook.");

  const admin = createAdminClient();
  const update: Record<string, unknown> = { status };
  // Re-enabling a previously failing endpoint should reset the failure counter
  // so the UI's "endpoint down" warning clears with the toggle.
  if (status === "active") update.consecutive_failures = 0;

  const { error, data } = await admin
    .from("organization_webhooks")
    .update(update)
    .eq("id", webhookId)
    .eq("organization_id", actor.organizationId)
    .select("id")
    .maybeSingle();
  if (error) return fail(error.message);
  if (!data) return fail("Webhook not found.");

  await logAuditEvent({
    actorId: actor.id,
    actorEmail: actor.email,
    action: status === "active" ? "pro.webhook.enable" : "pro.webhook.disable",
    targetType: "organization",
    targetId: actor.organizationId,
    metadata: { webhook_id: webhookId },
  });

  revalidatePath("/pro/settings/webhooks");
  return OK;
}

export async function deleteWebhook(webhookId: string): Promise<ActionResult> {
  const actor = await requirePro();
  if (!canManageOrg(actor.role)) return fail("Only owners and admins can delete webhooks.");
  if (!webhookId) return fail("Missing webhook.");

  const admin = createAdminClient();
  const { error, data } = await admin
    .from("organization_webhooks")
    .delete()
    .eq("id", webhookId)
    .eq("organization_id", actor.organizationId)
    .select("id")
    .maybeSingle();
  if (error) return fail(error.message);
  if (!data) return fail("Webhook not found.");

  await logAuditEvent({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "pro.webhook.delete",
    targetType: "organization",
    targetId: actor.organizationId,
    metadata: { webhook_id: webhookId },
  });

  revalidatePath("/pro/settings/webhooks");
  return OK;
}

export async function testWebhook(
  webhookId: string,
): Promise<ActionResult<{ ok: boolean; status: number | null; error: string | null }>> {
  const actor = await requirePro();
  if (!canManageOrg(actor.role)) return fail("Only owners and admins can test webhooks.");
  if (!webhookId) return fail("Missing webhook.");

  const admin = createAdminClient();
  const { data: hook } = await admin
    .from("organization_webhooks")
    .select("id, organization_id, url, events, signing_secret, status")
    .eq("id", webhookId)
    .eq("organization_id", actor.organizationId)
    .maybeSingle();
  if (!hook) return fail("Webhook not found.");

  const result = await sendTestEvent(hook as Parameters<typeof sendTestEvent>[0]);
  revalidatePath("/pro/settings/webhooks");
  return {
    error: null,
    data: { ok: result.ok, status: result.status ?? null, error: result.error ?? null },
  };
}

// ============================================================
// API keys
// ============================================================

const API_KEY_PREFIX = "owk_";

function generateApiKey(): { plaintext: string; prefix: string; hash: string } {
  const body = randomBytes(32).toString("base64url");
  const plaintext = `${API_KEY_PREFIX}${body}`;
  // Prefix shown in the UI = API_KEY_PREFIX + first 8 chars of body. Enough to
  // recognise but not enough to reconstruct.
  const prefix = `${API_KEY_PREFIX}${body.slice(0, 8)}`;
  const hash = createHash("sha256").update(plaintext).digest("hex");
  return { plaintext, prefix, hash };
}

export async function createApiKey(
  name: string,
): Promise<ActionResult<{ id: string; plaintext: string }>> {
  const actor = await requirePro();
  if (!canManageOrg(actor.role)) return fail("Only owners and admins can create API keys.");

  const cleanName = name.trim().slice(0, 80);
  if (cleanName.length < 1) return fail("Give the key a name so you can identify it later.");

  const { plaintext, prefix, hash } = generateApiKey();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_api_keys")
    .insert({
      organization_id: actor.organizationId,
      name: cleanName,
      prefix,
      key_hash: hash,
      scopes: ["read"],
      created_by: actor.id,
    })
    .select("id")
    .single();
  if (error || !data) return fail(error?.message ?? "Could not create key.");

  await logAuditEvent({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "pro.api_key.create",
    targetType: "organization",
    targetId: actor.organizationId,
    metadata: { api_key_id: data.id, name: cleanName, prefix },
  });

  revalidatePath("/pro/settings/api-keys");
  return { error: null, data: { id: data.id as string, plaintext } };
}

export async function revokeApiKey(keyId: string): Promise<ActionResult> {
  const actor = await requirePro();
  if (!canManageOrg(actor.role)) return fail("Only owners and admins can revoke API keys.");
  if (!keyId) return fail("Missing key.");

  const admin = createAdminClient();
  const { error, data } = await admin
    .from("organization_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("organization_id", actor.organizationId)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();
  if (error) return fail(error.message);
  if (!data) return fail("Key not found or already revoked.");

  await logAuditEvent({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "pro.api_key.revoke",
    targetType: "organization",
    targetId: actor.organizationId,
    metadata: { api_key_id: keyId },
  });

  revalidatePath("/pro/settings/api-keys");
  return OK;
}
