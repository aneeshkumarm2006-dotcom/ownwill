import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export default async function AdminLoginPage() {
  // If already signed in as staff, skip the login screen.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = (profile?.role as string) ?? "customer";
    if (role === "support" || role === "admin" || role === "super_admin") {
      redirect("/admin");
    }
  }

  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
