import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProSignupAccountForm } from "@/components/pro/pro-signup-account-form";
import { ProSignupOrgForm } from "@/components/pro/pro-signup-org-form";

export const metadata = { title: "Create your firm — OwnWill Pro" };

export default async function ProSignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not signed in → Step 1 (account creation).
  if (!user) {
    return <ProSignupAccountForm />;
  }

  // Signed in + already on an active org → straight to the dashboard.
  // Phase 1 doesn't ship a "create another org" route; multi-org membership
  // happens via invitations for now.
  const admin = createAdminClient();
  const { data: memberships } = await admin
    .from("organization_members")
    .select("organization_id, organizations:organization_id ( status )")
    .eq("user_id", user.id)
    .returns<{ organization_id: string; organizations: { status: string } | null }[]>();
  const hasActive = (memberships ?? []).some(
    (m) => m.organizations?.status === "active",
  );
  if (hasActive) redirect("/pro/dashboard");

  // Pull a clean owner email for the billing-email prefill, falling back to
  // auth.users.email if the profile row hasn't backfilled yet.
  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();
  const ownerEmail = (profile?.email as string) || user.email || "";

  return <ProSignupOrgForm ownerEmail={ownerEmail} />;
}
