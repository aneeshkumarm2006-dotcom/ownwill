import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminRole = "support" | "admin" | "super_admin";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
}

const ADMIN_ROLES: AdminRole[] = ["support", "admin", "super_admin"];

/**
 * Server-only: verifies the current request is from a signed-in staff member,
 * returns their identity, and redirects otherwise. Call from /admin server
 * components (layout + pages + actions).
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role as AdminRole | "customer" | undefined) ?? "customer";
  if (!profile || !ADMIN_ROLES.includes(role as AdminRole)) {
    redirect("/dashboard");
  }

  return {
    id: profile.id as string,
    email: (profile.email as string) ?? user.email ?? "",
    fullName: (profile.full_name as string) ?? "",
    role: role as AdminRole,
  };
}

export const canManageStaff = (role: AdminRole) => role === "super_admin";
