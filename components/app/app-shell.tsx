"use client";

import { useState, type ReactNode } from "react";
import { ShellContext, type ShellUser } from "@/components/app/shell-context";
import { Sidebar, MobileDrawer } from "@/components/app/sidebar";

export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ShellContext.Provider value={{ user, openSidebar: () => setMobileOpen(true) }}>
      <div className="ow-shell">
        <Sidebar user={user} />
        <main className="ow-shell-main">{children}</main>
      </div>
      <MobileDrawer user={user} open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </ShellContext.Provider>
  );
}
