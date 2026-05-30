import { createHash } from "node:crypto";
import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ApiContext {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  apiKeyId: string;
  scopes: string[];
}

/**
 * Authenticate an /api/v1 request by Bearer token. Returns the resolved org
 * context, or null when the token is missing/invalid/revoked. We also bump
 * `last_used_at` on every successful auth so the UI can warn about idle keys.
 *
 * The token is hashed (SHA-256) before lookup so plaintext never appears in a
 * query log.
 */
export async function authenticateApiRequest(req: NextRequest): Promise<ApiContext | null> {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  if (!token.startsWith("owk_") || token.length < 16) return null;

  const hash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();

  const { data: key } = await admin
    .from("organization_api_keys")
    .select(
      "id, organization_id, scopes, revoked_at, organizations:organization_id ( id, slug, name, status )",
    )
    .eq("key_hash", hash)
    .maybeSingle<{
      id: string;
      organization_id: string;
      scopes: string[];
      revoked_at: string | null;
      organizations: { id: string; slug: string; name: string; status: string } | null;
    }>();

  if (!key) return null;
  if (key.revoked_at) return null;
  if (!key.organizations || key.organizations.status !== "active") return null;

  // Fire-and-forget: best-effort bump. A failure here doesn't deny the request
  // since the caller already passed auth.
  void admin
    .from("organization_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", key.id);

  return {
    organizationId: key.organization_id,
    organizationSlug: key.organizations.slug,
    organizationName: key.organizations.name,
    apiKeyId: key.id,
    scopes: key.scopes ?? [],
  };
}
