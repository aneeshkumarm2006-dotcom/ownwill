import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptInvitation } from "@/lib/pro/actions";
import { isMaintenanceMode } from "@/lib/admin/maintenance";
import { loadSettings } from "@/lib/admin/settings";
import { AppShell } from "@/components/app/app-shell";
import { Alert } from "@/components/ui-kit";
import { MaintenanceScreen } from "@/components/app/maintenance-screen";
import type { ShellUser } from "@/components/app/shell-context";

const PENDING_INVITE_COOKIE = "ow_pending_invite";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth: the proxy guards these routes too.
  if (!user) {
    redirect("/login");
  }

  // Maintenance gate (§7.5). The /login route lives outside (app), so a
  // signed-out visitor can still reach the sign-in screen while the rest of
  // the customer surface is blocked.
  if (await isMaintenanceMode()) {
    const { support_email } = await loadSettings();
    return <MaintenanceScreen variant="customer" supportEmail={support_email} />;
  }

  // Consume a pending Pro invite if one was stashed before signup. We do this
  // here (rather than in middleware) so the accept happens exactly once on
  // the first authenticated render after sign-in. acceptInvitation handles
  // re-entry safely (it no-ops on already-consumed tokens), so a race where
  // the cookie outlives the accept won't double-write.
  const cookieStore = await cookies();
  const pendingInvite = cookieStore.get(PENDING_INVITE_COOKIE)?.value;
  if (pendingInvite) {
    cookieStore.set(PENDING_INVITE_COOKIE, "", { path: "/", maxAge: 0 });
    const accepted = await acceptInvitation(pendingInvite);
    // Staff invites should land the user in /pro, not the customer shell.
    if (!accepted.error && accepted.data?.kind === "staff") {
      redirect("/pro/dashboard");
    }
  }

  let plan: ShellUser["plan"] = "none";
  let fullName = (user.user_metadata?.full_name as string | undefined) ?? "";
  let province = (user.user_metadata?.province as string | undefined) ?? "";

  let { data: profile } = await supabase
    .from("profiles")
    .select("plan, full_name, province")
    .eq("id", user.id)
    .maybeSingle();

  // Self-heal: create the profile if it's missing (e.g. user predates the
  // signup trigger). The FK from documents -> profiles needs this to exist.
  if (!profile) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      province,
    });
    if (insertError) {
      return (
        <main style={{ maxWidth: 560, margin: "80px auto", padding: 24 }}>
          <Alert variant="error" title="We couldn't set up your account">
            Something went wrong creating your profile. Please refresh, or sign
            out and back in. If the problem persists, contact support.
          </Alert>
        </main>
      );
    }
    const { data: created } = await supabase
      .from("profiles")
      .select("plan, full_name, province")
      .eq("id", user.id)
      .maybeSingle();
    profile = created;
  }

  if (profile) {
    if (profile.plan) plan = profile.plan as ShellUser["plan"];
    if (profile.full_name) fullName = profile.full_name as string;
    if (profile.province) province = profile.province as string;
  }

  const shellUser: ShellUser = { email: user.email ?? "", fullName, province, plan };

  return <AppShell user={shellUser}>{children}</AppShell>;
}
