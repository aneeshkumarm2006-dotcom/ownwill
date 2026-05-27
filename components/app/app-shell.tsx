"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ShellContext, type ShellUser } from "@/components/app/shell-context";
import { Sidebar, MobileDrawer } from "@/components/app/sidebar";
import { initAuthSync } from "@/store/auth";

export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => initAuthSync(), []);

  return (
    <ShellContext.Provider value={{ user, openSidebar: () => setMobileOpen(true) }}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div className="ow-shell">
        <Sidebar user={user} />
        <main id="main-content" className="ow-shell-main">{children}</main>
      </div>
      <MobileDrawer user={user} open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </ShellContext.Provider>
  );
}
