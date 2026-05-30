"use client";

import { useState, type ReactNode } from "react";
import { ShellContext } from "@/components/app/shell-context";
import { ProSidebar, ProMobileDrawer } from "@/components/pro/pro-sidebar";
import type { ProUser } from "@/lib/pro/auth";

export function ProShell({ user, children }: { user: ProUser; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Reuse the customer ShellContext shape so AppPage (topbar / grid) renders
  // identically inside the Pro authed layout.
  const shellUser = {
    email: user.email,
    fullName: user.fullName,
    province: "",
    plan: "none" as const,
  };

  return (
    <ShellContext.Provider value={{ user: shellUser, openSidebar: () => setMobileOpen(true) }}>
      <div className="ow-shell">
        <ProSidebar user={user} />
        <main className="ow-shell-main">{children}</main>
      </div>
      <ProMobileDrawer user={user} open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </ShellContext.Provider>
  );
}
