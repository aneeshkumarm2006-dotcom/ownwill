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

  if (!accessKeyId || !secretAccessKey || !region) {
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

/** Simple branded HTML wrapper for emails. */
export function emailLayout(heading: string, bodyHtml: string): string {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1C2B2A">
    <div style="padding:24px 0"><strong style="font-size:18px;color:#0E4C49">🍃 OwnWill</strong></div>
    <h1 style="font-size:22px;margin:0 0 12px">${heading}</h1>
    <div style="font-size:15px;line-height:1.6;color:#3A4543">${bodyHtml}</div>
    <p style="font-size:12px;color:#7A847F;margin-top:32px">OwnWill is not a law firm and does not provide legal advice.</p>
  </div>`;
}
