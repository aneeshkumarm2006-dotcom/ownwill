"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, emailLayout } from "@/lib/email/send";

type Plan = "essentials" | "premium" | "premium_x2";

/**
 * TEST MODE — no Stripe. Marks the signed-in user as subscribed to `plan`.
 * Replace with the real Stripe webhook flow before production.
 */
export async function activatePlan(plan: Plan): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ plan, plan_purchased_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: null };
}

/**
 * TEST MODE — simulates the will purchase: set the plan and mark the current
 * will document as generated (so the Download flow unlocks). No payment taken.
 */
export async function completeWillPurchase(plan: Plan): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const now = new Date().toISOString();
  const { error: planErr } = await supabase
    .from("profiles")
    .update({ plan, plan_purchased_at: now })
    .eq("id", user.id);
  if (planErr) return { error: planErr.message };

  const { error: docErr } = await supabase
    .from("documents")
    .update({ status: "generated", completed_at: now, pdf_generated_at: now })
    .eq("user_id", user.id)
    .eq("type", "will")
    .eq("is_current", true);
  if (docErr) return { error: docErr.message };

  // Confirmation + signing instructions email (best-effort; no-op if SES unset).
  if (user.email) {
    const html = emailLayout("Your will is ready 🎉", `
      <p>Thanks for completing your will with OwnWill. Your document is generated and ready to download from your dashboard.</p>
      <p><strong>Next steps:</strong> print it on plain paper and sign it in front of two adult witnesses who aren't beneficiaries. In British Columbia you can sign electronically.</p>
      <p>You can edit and re-generate your will any time — updates are free for life.</p>
    `);
    try {
      await sendEmail({ to: user.email, subject: "Your OwnWill will is ready", html });
      await supabase.from("email_logs").insert({
        user_id: user.id, email_type: "signing_instructions", to_email: user.email, subject: "Your OwnWill will is ready", status: "sent",
      });
    } catch {
      // ignore email/logging failures in test mode
    }
  }

  revalidatePath("/", "layout");
  return { error: null };
}
