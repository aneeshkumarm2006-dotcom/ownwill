"use client";

import { type ReactNode } from "react";
import { Menu } from "lucide-react";
import { useShell } from "@/components/app/shell-context";
import { cls } from "@/lib/cls";

/**
 * Page scaffold inside the app shell: slim topbar (title + actions) + a content
 * grid with an optional sticky right rail. `wide` opts out of centering
 * (dashboard); default pages are centered, `narrow` caps the body width.
 */
export function AppPage({
  title,
  breadcrumb,
  actions,
  rail,
  narrow,
  wide,
  bare,
  children,
}: {
  title: string;
  breadcrumb?: string;
  actions?: ReactNode;
  rail?: ReactNode;
  narrow?: boolean;
  wide?: boolean;
  bare?: boolean;
  children: ReactNode;
}) {
  const { openSidebar } = useShell();
  return (
    <div className={cls("ow-page", bare && "is-bare")}>
      <header className="ow-topbar">
        <div className="ow-topbar-inner">
          <button className="ow-topbar-burger focusable" onClick={openSidebar} aria-label="Open navigation">
            <Menu size={18} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            {breadcrumb && <div className="t-caption muted" style={{ marginBottom: 2 }}>{breadcrumb}</div>}
            <h1 className="ow-topbar-title" style={{ margin: 0 }}>{title}</h1>
          </div>
          {actions && <div className="row g-2">{actions}</div>}
        </div>
      </header>
      {bare ? (
        children
      ) : (
        <div className={cls("ow-page-grid", !!rail && "has-rail", narrow && "is-narrow", !wide && "is-centered")}>
          <div className="ow-page-body">{children}</div>
          {rail && <aside className="ow-page-rail">{rail}</aside>}
        </div>
      )}
    </div>
  );
}
