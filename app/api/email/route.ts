import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { rateLimit } from "@/lib/rate-limit";
import { EmailRequestSchema } from "@/lib/validation/api";
import { apiOk, apiError } from "@/lib/api/response";

export const runtime = "nodejs";

const RATE_LIMIT_PER_USER = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;

/** Sends a transactional email to the signed-in user. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!user.email) return apiError("No email on account", 400);

  const limit = rateLimit(`email:${user.id}`, RATE_LIMIT_PER_USER, RATE_WINDOW_MS);
  if (!limit.ok) {
    return apiError("Too many requests. Try again later.", 429, {
      headers: { "Retry-After": String(limit.retryAfterSeconds) },
    });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = EmailRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid request", 400);
  }
  const { subject, html } = parsed.data;

  // Force the recipient to the signed-in user's verified email. The caller
  // cannot supply an arbitrary `to` — this route is for transactional mail
  // sent to the account holder, not a generic mailer.
  const result = await sendEmail({ to: user.email, subject, html });
  if (!result.ok && !result.skipped) {
    return apiError(result.error ?? "Email send failed", 502);
  }
  return apiOk({ sent: result.ok, skipped: result.skipped ?? false });
}
