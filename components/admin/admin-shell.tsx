"use client";

import { useState, type ReactNode } from "react";
import { ShellContext } from "@/components/app/shell-context";
import { AdminSidebar, AdminMobileDrawer } from "@/components/admin/admin-sidebar";
import type { AdminUser } from "@/lib/admin/auth";

export function AdminShell({ user, children }: { user: AdminUser; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Reuse the customer ShellContext shape so AppPage (topbar/grid) works as-is.
  const shellUser = {
    email: user.email,
    fullName: user.fullName,
    province: "",
    plan: "none" as const,
  };

  return (
    <ShellContext.Provider value={{ user: shellUser, openSidebar: () => setMobileOpen(true) }}>
      <div className="ow-shell">
        <AdminSidebar user={user} />
        <main className="ow-shell-main">{children}</main>
      </div>
      <AdminMobileDrawer user={user} open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </ShellContext.Provider>
  );
}
