import { createHmac, randomBytes, randomUUID, timingSafeEqual, createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Outbound webhook events emitted by the platform to Pro firms. Strings are
 * stable contract — clients filter on them, and we promise additions, not
 * renames.
 */
export type WebhookEventType =
  | "document.completed"
  | "document.generated";

export const WEBHOOK_EVENT_TYPES: WebhookEventType[] = [
  "document.completed",
  "document.generated",
];

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_EXCERPT = 512;
/** Retry the same delivery this many times before parking it as failed. */
const MAX_DELIVERY_ATTEMPTS = 5;
/** Exponential-ish backoff (ms). Total fan-out window stays under 8 min so we
 *  don't hold the calling request open — these run fire-and-forget. */
const BACKOFF_MS = [0, 1_000, 5_000, 30_000, 120_000];

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(32).toString("hex")}`;
}

/** Hex SHA-256 of the raw secret. Used to authenticate test-fire calls when we
 *  intentionally don't store the plaintext (the secret itself is plaintext,
 *  but its presence in HMAC sign material doesn't leak the raw bytes). */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Compute the signature header value. We include the timestamp inside the
 * signed payload so a replayed body with a stale timestamp can be rejected on
 * the receiver side.
 */
export function signPayload(secret: string, timestamp: string, body: string): string {
  const mac = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${mac}`;
}

/**
 * Receiver helper: verify a signature header produced by `signPayload`.
 * Constant-time compare to avoid timing oracles. We expose this so the
 * documented receiver example in /pro/settings/webhooks doesn't have to be
 * hand-rolled — Pro customers' integrations can import the snippet verbatim.
 */
export function verifySignature(secret: string, header: string, body: string): boolean {
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const idx = p.indexOf("=");
      return [p.slice(0, idx).trim(), p.slice(idx + 1).trim()];
    }),
  );
  const t = parts.t;
  const v = parts.v1;
  if (!t || !v) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(v, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

interface DocumentEventPayload {
  type: WebhookEventType;
  organization: { id: string; slug: string; name: string };
  document: {
    id: string;
    type: "will" | "poa_health" | "poa_property" | "asset_list";
    status: string;
    pdf_url: string | null;
    pdf_generated_at: string | null;
    completed_at: string | null;
  };
  client: {
    user_id: string;
    email: string;
    full_name: string;
  };
}

interface WebhookRow {
  id: string;
  organization_id: string;
  url: string;
  events: string[];
  signing_secret: string;
  status: "active" | "disabled";
}

/**
 * Lookup the org that manages a given customer user, then fire all matching
 * webhooks for that org. Called from `documents` status transitions
 * (will completion, POA completion, PDF generation). Fire-and-forget: never
 * blocks the customer flow, never throws.
 */
export async function fireDocumentEvent(args: {
  type: WebhookEventType;
  documentId: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();

    // Resolve user_id from the doc so callers (will/poa save paths) don't have
    // to thread the session through. Lets us hook in from background contexts
    // where we don't have a Supabase auth handle.
    const { data: docRow } = await admin
      .from("documents")
      .select("user_id")
      .eq("id", args.documentId)
      .maybeSingle();
    const userId = (docRow?.user_id as string) ?? null;
    if (!userId) return;

    // Find the active org link for this user. Soft-revoked clients don't get
    // their events forwarded — once a firm loses access we treat the user as
    // unmanaged for downstream purposes.
    const { data: link } = await admin
      .from("organization_clients")
      .select("organization_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    if (!link) return;

    const { data: hooks } = await admin
      .from("organization_webhooks")
      .select("id, organization_id, url, events, signing_secret, status")
      .eq("organization_id", link.organization_id as string)
      .eq("status", "active")
      .returns<WebhookRow[]>();
    const matching = (hooks ?? []).filter((h) => h.events.includes(args.type));
    if (matching.length === 0) return;

    // Build payload once per event — same body for every endpoint subscribed.
    const [doc, org, client] = await Promise.all([
      admin
        .from("documents")
        .select("id, type, status, pdf_url, pdf_generated_at, completed_at, user_id")
        .eq("id", args.documentId)
        .maybeSingle(),
      admin
        .from("organizations")
        .select("id, slug, name")
        .eq("id", link.organization_id as string)
        .maybeSingle(),
      admin
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", userId)
        .maybeSingle(),
    ]);
    if (!doc.data || !org.data || !client.data) return;

    const payload: DocumentEventPayload = {
      type: args.type,
      organization: {
        id: org.data.id as string,
        slug: org.data.slug as string,
        name: org.data.name as string,
      },
      document: {
        id: doc.data.id as string,
        type: doc.data.type as DocumentEventPayload["document"]["type"],
        status: doc.data.status as string,
        pdf_url: (doc.data.pdf_url as string) ?? null,
        pdf_generated_at: (doc.data.pdf_generated_at as string) ?? null,
        completed_at: (doc.data.completed_at as string) ?? null,
      },
      client: {
        user_id: client.data.id as string,
        email: (client.data.email as string) ?? "",
        full_name: (client.data.full_name as string) ?? "",
      },
    };

    const eventId = randomUUID();

    // Don't await — Stripe-style fire-and-forget so the request that triggered
    // the event (save will, render PDF) returns immediately.
    for (const hook of matching) {
      void dispatchWithRetry(hook, eventId, payload);
    }
  } catch (e) {
    console.error("[webhooks] fire failed", args.type, e);
  }
}

/**
 * Fire-and-forget: attempts up to MAX_DELIVERY_ATTEMPTS times with exponential
 * backoff. Each attempt writes a row to organization_webhook_deliveries so the
 * UI can show a delivery history. A retry that finally succeeds clears the
 * `consecutive_failures` counter on the webhook so the "endpoint down" warning
 * disappears.
 */
async function dispatchWithRetry(
  hook: WebhookRow,
  eventId: string,
  payload: DocumentEventPayload,
): Promise<void> {
  const admin = createAdminClient();
  const body = JSON.stringify(payload);

  for (let attempt = 1; attempt <= MAX_DELIVERY_ATTEMPTS; attempt++) {
    const delay = BACKOFF_MS[attempt - 1] ?? BACKOFF_MS[BACKOFF_MS.length - 1];
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));

    const result = await postOnce(hook, eventId, body);

    await admin.from("organization_webhook_deliveries").insert({
      webhook_id: hook.id,
      organization_id: hook.organization_id,
      event_id: eventId,
      event_type: payload.type,
      attempt,
      status: result.ok ? "success" : "failed",
      http_status: result.status ?? null,
      response_excerpt: result.responseExcerpt ?? null,
      error: result.error ?? null,
    });

    if (result.ok) {
      await admin
        .from("organization_webhooks")
        .update({
          last_delivery_at: new Date().toISOString(),
          last_success_at: new Date().toISOString(),
          consecutive_failures: 0,
        })
        .eq("id", hook.id);
      return;
    }

    // On final failure, bump the failure counter so the UI flags it.
    if (attempt === MAX_DELIVERY_ATTEMPTS) {
      await admin.rpc("increment_webhook_failures", { hook_id: hook.id }).then(
        () => {},
        async () => {
          // Fall back to a read-modify-write if the helper RPC isn't installed.
          const { data: row } = await admin
            .from("organization_webhooks")
            .select("consecutive_failures")
            .eq("id", hook.id)
            .maybeSingle();
          await admin
            .from("organization_webhooks")
            .update({
              last_delivery_at: new Date().toISOString(),
              consecutive_failures: ((row?.consecutive_failures as number) ?? 0) + 1,
            })
            .eq("id", hook.id);
        },
      );
    }
  }
}

interface PostResult {
  ok: boolean;
  status?: number;
  responseExcerpt?: string;
  error?: string;
}

async function postOnce(hook: WebhookRow, eventId: string, body: string): Promise<PostResult> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signPayload(hook.signing_secret, timestamp, body);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(hook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "OwnWill-Webhooks/1.0",
        "X-OwnWill-Signature": signature,
        "X-OwnWill-Event-Id": eventId,
      },
      body,
      signal: controller.signal,
    });
    const text = await res.text().catch(() => "");
    return {
      ok: res.ok,
      status: res.status,
      responseExcerpt: text.slice(0, MAX_RESPONSE_EXCERPT),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "unknown error",
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Owner-triggered test fire. Synchronous (awaits the single POST + records the
 * result) so the UI can show "delivered" or the failure body immediately.
 */
export async function sendTestEvent(hook: WebhookRow): Promise<PostResult> {
  const body = JSON.stringify({
    type: "test.ping",
    sent_at: new Date().toISOString(),
    organization: { id: hook.organization_id },
    message: "OwnWill webhook test delivery.",
  });
  const result = await postOnce(hook, randomUUID(), body);
  const admin = createAdminClient();
  await admin.from("organization_webhook_deliveries").insert({
    webhook_id: hook.id,
    organization_id: hook.organization_id,
    event_id: randomUUID(),
    event_type: "test.ping",
    attempt: 1,
    status: result.ok ? "success" : "failed",
    http_status: result.status ?? null,
    response_excerpt: result.responseExcerpt ?? null,
    error: result.error ?? null,
  });
  return result;
}
