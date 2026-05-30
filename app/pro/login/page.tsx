import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProLoginForm } from "@/components/pro/pro-login-form";

export const metadata = { title: "Pro sign in — OwnWill" };

export default async function ProLoginPage() {
  // If already signed in *and* a member of at least one active org, skip the
  // login screen. We do the membership check here rather than redirecting on
  // any auth user, otherwise a customer-only user clicking /pro/login would
  // bounce to the dashboard and get redirected right back.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const admin = createAdminClient();
    const { data: memberships } = await admin
      .from("organization_members")
      .select("organization_id, organizations:organization_id ( status )")
      .eq("user_id", user.id)
      .limit(1)
      .returns<{ organization_id: string; organizations: { status: string } | null }[]>();
    const hasActive = (memberships ?? []).some(
      (m) => m.organizations?.status === "active",
    );
    if (hasActive) redirect("/pro/dashboard");
  }

  return (
    <Suspense>
      <ProLoginForm />
    </Suspense>
  );
}
