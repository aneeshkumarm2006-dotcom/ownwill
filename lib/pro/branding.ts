import { createAdminClient } from "@/lib/supabase/admin";

/** Private bucket that holds per-org logos. Created in supabase/schema.sql. */
export const ORG_LOGO_BUCKET = "org-logos";

/** Default for email-embedded signed URLs (30 days covers the 14-day invite
 * window plus generous slack for late opens). */
const EMAIL_SIGNED_URL_TTL = 30 * 24 * 60 * 60;
/** Default for in-app previews on /pro/settings. */
const PREVIEW_SIGNED_URL_TTL = 60 * 60;

const ALLOWED_LOGO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/** Hex color check: 3- or 6-digit `#…`. Accepts `null`/empty as "clear it". */
const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
export function isValidHexColor(value: string): boolean {
  return HEX_RE.test(value.trim());
}

export interface OrgBranding {
  organizationId: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

interface OrgRow {
  id: string;
  name: string;
  logo_path: string | null;
  primary_color: string | null;
}

/**
 * Branding bundle for an org: name + signed logo URL + primary color. The
 * signed URL is minted on every call so it stays fresh; pass a long TTL when
 * embedding into emails the recipient may not open immediately.
 *
 * Returns `null` if the org doesn't exist. Logo signing failures degrade
 * gracefully (logoUrl=null) so a transient storage error doesn't break
 * outbound email.
 */
export async function getOrgBranding(
  organizationId: string,
  options: { signedUrlTtlSeconds?: number } = {},
): Promise<OrgBranding | null> {
  if (!organizationId) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("id, name, logo_path, primary_color")
    .eq("id", organizationId)
    .maybeSingle<OrgRow>();
  if (!data) return null;

  let logoUrl: string | null = null;
  if (data.logo_path) {
    const ttl = options.signedUrlTtlSeconds ?? PREVIEW_SIGNED_URL_TTL;
    const { data: signed, error } = await admin.storage
      .from(ORG_LOGO_BUCKET)
      .createSignedUrl(data.logo_path, ttl);
    if (!error && signed?.signedUrl) {
      logoUrl = signed.signedUrl;
    }
  }

  return {
    organizationId: data.id,
    name: data.name,
    logoUrl,
    primaryColor: normalizePrimaryColor(data.primary_color),
  };
}

/** Convenience: branding tuned for embedding inside an outbound email. */
export function getOrgBrandingForEmail(organizationId: string) {
  return getOrgBranding(organizationId, { signedUrlTtlSeconds: EMAIL_SIGNED_URL_TTL });
}

function normalizePrimaryColor(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return isValidHexColor(trimmed) ? trimmed.toLowerCase() : null;
}

interface LogoUploadResult {
  error: string | null;
  path?: string;
  signedUrl?: string;
}

/**
 * Writes a new logo for the org into the private bucket and points the org row
 * at it. Caller is responsible for auth gating (canManageOrg) — this helper
 * only validates the file payload. We delete the prior logo on success so a
 * single org never accumulates orphan blobs.
 */
export async function setOrgLogo(
  organizationId: string,
  file: { bytes: Uint8Array; contentType: string; size: number },
): Promise<LogoUploadResult> {
  if (!organizationId) return { error: "Missing organization." };
  if (!file.size) return { error: "Choose an image to upload." };
  if (file.size > MAX_LOGO_BYTES) {
    return { error: "Logo must be under 2 MB." };
  }
  const ext = ALLOWED_LOGO_TYPES[file.contentType.toLowerCase()];
  if (!ext) {
    return { error: "Use a PNG, JPG, or WebP file." };
  }

  const admin = createAdminClient();

  // Stamp the path so client-cached signed URLs from the old version can't
  // collide with the new one (Supabase Storage is path-keyed for cache).
  const path = `${organizationId}/logo-${Date.now()}.${ext}`;
  const { error: upErr } = await admin.storage
    .from(ORG_LOGO_BUCKET)
    .upload(path, file.bytes, { contentType: file.contentType, upsert: false });
  if (upErr) return { error: upErr.message };

  // Capture the previous path so we can clean it up after the org row is
  // updated. If the update fails, we leave both — better an orphan than a
  // missing logo.
  const { data: previous } = await admin
    .from("organizations")
    .select("logo_path")
    .eq("id", organizationId)
    .maybeSingle<{ logo_path: string | null }>();

  const { error: updateErr } = await admin
    .from("organizations")
    .update({ logo_path: path, updated_at: new Date().toISOString() })
    .eq("id", organizationId);
  if (updateErr) {
    // Roll back the upload so the bucket stays consistent with the DB.
    await admin.storage.from(ORG_LOGO_BUCKET).remove([path]).catch(() => {});
    return { error: updateErr.message };
  }

  if (previous?.logo_path && previous.logo_path !== path) {
    await admin.storage.from(ORG_LOGO_BUCKET).remove([previous.logo_path]).catch(() => {});
  }

  const { data: signed } = await admin.storage
    .from(ORG_LOGO_BUCKET)
    .createSignedUrl(path, PREVIEW_SIGNED_URL_TTL);

  return { error: null, path, signedUrl: signed?.signedUrl };
}

/** Clears the org's logo (DB pointer + storage blob). Idempotent. */
export async function removeOrgLogo(organizationId: string): Promise<{ error: string | null }> {
  if (!organizationId) return { error: "Missing organization." };
  const admin = createAdminClient();

  const { data: row } = await admin
    .from("organizations")
    .select("logo_path")
    .eq("id", organizationId)
    .maybeSingle<{ logo_path: string | null }>();

  const { error: updateErr } = await admin
    .from("organizations")
    .update({ logo_path: null, updated_at: new Date().toISOString() })
    .eq("id", organizationId);
  if (updateErr) return { error: updateErr.message };

  if (row?.logo_path) {
    await admin.storage.from(ORG_LOGO_BUCKET).remove([row.logo_path]).catch(() => {});
  }
  return { error: null };
}
