import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
}

const FROM = process.env.SES_FROM_EMAIL || "OwnWill <noreply@ownwill.ca>";

/**
 * Sends a transactional email via AWS SES. If SES credentials aren't set, it
 * no-ops gracefully (logs to the server console) so the rest of the flow works
 * in testing without AWS configured.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailArgs): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const accessKeyId = process.env.AWS_SES_ACCESS_KEY;
  const secretAccessKey = process.env.AWS_SES_SECRET_KEY;
  const region = process.env.AWS_SES_REGION;

  if (!accessKeyId?.length || !secretAccessKey?.length || !region?.length) {
    console.log(`[email skipped — SES not configured] to=${to} subject="${subject}"`);
    return { ok: false, skipped: true };
  }

  try {
    const client = new SESv2Client({ region, credentials: { accessKeyId, secretAccessKey } });
    await client.send(
      new SendEmailCommand({
        FromEmailAddress: FROM,
        Destination: { ToAddresses: [to] },
        Content: { Simple: { Subject: { Data: subject }, Body: { Html: { Data: html } } } },
      }),
    );
    return { ok: true };
  } catch (e) {
    console.error("[email error]", e);
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

// ============================================================
// Branded layout — Phase 4 (white-label)
// ============================================================

/**
 * Branding inputs threaded from a Pro org into outbound email. All fields are
 * optional; missing fields fall back to OwnWill defaults so calls from
 * non-Pro flows (customer auth, support) still render the OwnWill mark.
 */
export interface EmailBranding {
  /** Firm name shown next to (or beneath) the logo. */
  name?: string | null;
  /** Pre-signed URL for the firm logo (mint via lib/pro/branding). */
  logoUrl?: string | null;
  /** Hex like `#0E4C49`. Drives header text + CTA background. */
  primaryColor?: string | null;
}

export interface EmailPalette {
  primary: string;
  primaryForeground: string;
  ink: string;
  inkMuted: string;
  name: string;
  logoUrl: string | null;
  /** True when this email is co-branded with a Pro org (i.e. not stock OwnWill). */
  hasOrg: boolean;
}

const OWNWILL_PALETTE: EmailPalette = {
  primary: "#0E4C49",
  primaryForeground: "#FFFFFF",
  ink: "#1C2B2A",
  inkMuted: "#3A4543",
  name: "OwnWill",
  logoUrl: null,
  hasOrg: false,
};

/** Resolves a branding bundle to a complete palette, filling defaults. */
export function resolveEmailPalette(branding?: EmailBranding | null): EmailPalette {
  if (!branding) return OWNWILL_PALETTE;
  const name = branding.name?.trim() || OWNWILL_PALETTE.name;
  const logoUrl = branding.logoUrl || null;
  const primary = sanitizeHex(branding.primaryColor) ?? OWNWILL_PALETTE.primary;
  return {
    primary,
    primaryForeground: pickForeground(primary),
    ink: OWNWILL_PALETTE.ink,
    inkMuted: OWNWILL_PALETTE.inkMuted,
    name,
    logoUrl,
    hasOrg: name !== OWNWILL_PALETTE.name || !!logoUrl || primary !== OWNWILL_PALETTE.primary,
  };
}

/**
 * Branded HTML wrapper for emails. When an org branding context is passed, the
 * header shows the firm logo (or wordmark) and the disclaimer notes the firm
 * is using OwnWill — keeping it clear OwnWill itself isn't a law firm even
 * when a `type='law'` org is the sender.
 */
export function emailLayout(
  heading: string,
  bodyHtml: string,
  branding?: EmailBranding | null,
): string {
  const palette = resolveEmailPalette(branding);
  const header = renderHeader(palette);
  const disclaimer = palette.hasOrg
    ? `OwnWill is software ${escapeHtmlText(palette.name)} uses to help you build your documents. OwnWill is not a law firm and does not provide legal advice.`
    : "OwnWill is not a law firm and does not provide legal advice.";
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:${palette.ink}">
    ${header}
    <h1 style="font-size:22px;margin:0 0 12px">${heading}</h1>
    <div style="font-size:15px;line-height:1.6;color:${palette.inkMuted}">${bodyHtml}</div>
    <p style="font-size:12px;color:#7A847F;margin-top:32px">${disclaimer}</p>
  </div>`;
}

/**
 * Returns inline CSS for a branded CTA button. Templates compose this so each
 * call site can choose the right verb/href without re-implementing styling.
 */
export function ctaButton(label: string, href: string, palette: EmailPalette): string {
  return `<a href="${href}" style="display:inline-block;background:${palette.primary};color:${palette.primaryForeground};padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtmlText(label)}</a>`;
}

function renderHeader(palette: EmailPalette): string {
  if (palette.logoUrl) {
    // Org-branded: logo image + firm name. Constrain max-height so a giant
    // upload doesn't blow out the email layout.
    return `<div style="padding:24px 0;display:flex;align-items:center;gap:12px">
      <img src="${palette.logoUrl}" alt="${escapeHtmlText(palette.name)}" style="max-height:40px;max-width:160px;display:block" />
      <strong style="font-size:18px;color:${palette.primary}">${escapeHtmlText(palette.name)}</strong>
    </div>`;
  }
  if (palette.hasOrg) {
    return `<div style="padding:24px 0"><strong style="font-size:18px;color:${palette.primary}">${escapeHtmlText(palette.name)}</strong></div>`;
  }
  // Stock OwnWill mark — keep the leaf emoji we shipped before so existing
  // emails look unchanged when no branding is passed.
  return `<div style="padding:24px 0"><strong style="font-size:18px;color:${palette.primary}">🍃 OwnWill</strong></div>`;
}

function sanitizeHex(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

/** Picks white or near-black text for a CTA based on background luminance. */
function pickForeground(hex: string): string {
  const expanded =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  const r = parseInt(expanded.slice(1, 3), 16);
  const g = parseInt(expanded.slice(3, 5), 16);
  const b = parseInt(expanded.slice(5, 7), 16);
  // Rec. 709 luminance — > 0.6 means a light background, pick dark text.
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.6 ? "#1C2B2A" : "#FFFFFF";
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
