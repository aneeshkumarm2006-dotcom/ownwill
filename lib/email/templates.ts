import {
  ctaButton,
  emailLayout,
  resolveEmailPalette,
  type EmailBranding,
} from "@/lib/email/send";

export interface EmailTemplate {
  subject: string;
  html: string;
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://ownwill.ca"
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface StaffInviteArgs {
  orgName: string;
  inviterName: string;
  inviterEmail: string;
  token: string;
  expiresAt: Date;
  /** Optional Pro org branding (logo + primary color) applied to the layout. */
  branding?: EmailBranding | null;
}

/**
 * Pro: staff invite. Sent when an org owner/admin adds a teammate by email.
 * The accept link points at /pro/invite/[token] which handles both staff and
 * client invites.
 */
export function proStaffInviteTemplate(args: StaffInviteArgs): EmailTemplate {
  const org = escapeHtml(args.orgName);
  const inviter = escapeHtml(args.inviterName || args.inviterEmail);
  const expires = args.expiresAt.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const acceptUrl = `${siteUrl()}/pro/invite/${encodeURIComponent(args.token)}`;
  const palette = resolveEmailPalette(args.branding);

  const subject = `${args.inviterName || "A teammate"} invited you to join ${args.orgName} on OwnWill`;
  const html = emailLayout(
    `You've been invited to ${org}`,
    `<p>${inviter} invited you to join <strong>${org}</strong> as a teammate on OwnWill Pro — the portal firms use to manage their clients' wills and POAs.</p>
     <p style="margin:28px 0">${ctaButton("Accept invitation", acceptUrl, palette)}</p>
     <p>Or copy this link into your browser:<br><span style="color:${palette.inkMuted};word-break:break-all">${acceptUrl}</span></p>
     <p style="color:#7A847F">This invitation expires on <strong>${expires}</strong>. If you weren't expecting it, you can safely ignore this email.</p>`,
    args.branding,
  );

  return { subject, html };
}

interface ClientInviteArgs {
  orgName: string;
  inviterName: string;
  inviterEmail: string;
  token: string;
  expiresAt: Date;
  /** Optional Pro org branding (logo + primary color) applied to the layout. */
  branding?: EmailBranding | null;
}

/**
 * Pro: client invite. Sent when an org invites an end-customer to have their
 * documents managed by the firm. Copy reassures the recipient that they
 * control access and can revoke it at any time (PIPEDA + trust requirement).
 */
export function proClientInviteTemplate(args: ClientInviteArgs): EmailTemplate {
  const org = escapeHtml(args.orgName);
  const inviter = escapeHtml(args.inviterName || args.inviterEmail);
  const expires = args.expiresAt.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const acceptUrl = `${siteUrl()}/pro/invite/${encodeURIComponent(args.token)}`;
  const palette = resolveEmailPalette(args.branding);

  const subject = `${args.orgName} invited you to start your will on OwnWill`;
  const html = emailLayout(
    `${org} invited you to OwnWill`,
    `<p>${inviter} from <strong>${org}</strong> invited you to start your will and powers of attorney on OwnWill, a plain-language Canadian wills service.</p>
     <p>If you accept, ${org} can help you complete your documents and see your progress. <strong>You stay in control:</strong> you can revoke their access at any time from your account settings, and your documents remain yours.</p>
     <p style="margin:28px 0">${ctaButton("Accept invitation", acceptUrl, palette)}</p>
     <p>Or copy this link into your browser:<br><span style="color:${palette.inkMuted};word-break:break-all">${acceptUrl}</span></p>
     <p style="color:#7A847F">This invitation expires on <strong>${expires}</strong>. If you weren't expecting it, you can safely ignore this email.</p>`,
    args.branding,
  );

  return { subject, html };
}
