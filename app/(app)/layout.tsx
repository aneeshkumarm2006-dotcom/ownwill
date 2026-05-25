import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app/app-shell";
import type { ShellUser } from "@/components/app/shell-context";

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
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      province,
    });
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
