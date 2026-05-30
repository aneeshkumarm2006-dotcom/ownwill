"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Briefcase,
  Check,
  ChevronUp,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Moon,
  ScrollText,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  UserCog,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { LeafMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui-kit";
import { cls } from "@/lib/cls";
import { switchOrganization } from "@/lib/pro/actions";
import type { ProUser } from "@/lib/pro/auth";

const NAV = [
  { label: "Dashboard", icon: <LayoutDashboard />, to: "/pro/dashboard", match: ["/pro/dashboard"] },
  { label: "Clients", icon: <Users />, to: "/pro/clients", match: ["/pro/clients"] },
  { label: "Team", icon: <UserCog />, to: "/pro/team", match: ["/pro/team"] },
  { label: "Billing", icon: <CreditCard />, to: "/pro/billing", match: ["/pro/billing"] },
  { label: "Audit log", icon: <ScrollText />, to: "/pro/audit", match: ["/pro/audit"] },
  { label: "Settings", icon: <Settings />, to: "/pro/settings", match: ["/pro/settings"] },
];

const ROLE_LABEL = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
} as const;

function isActive(pathname: string, match: string[]) {
  return match.some((m) => pathname === m || pathname.startsWith(m + "/"));
}

function NavItems({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="ow-side-nav">
      {NAV.map((it) => {
        const active = isActive(pathname, it.match);
        return (
          <Link
            key={it.to}
            href={it.to}
            onClick={onNavigate}
            className={cls("ow-side-item focusable", active && "is-active")}
            aria-current={active ? "page" : undefined}
          >
            <span className="ow-side-accent" aria-hidden="true" />
            <span className="ow-side-icon">{it.icon}</span>
            <span className="ow-side-label">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function OrgSwitcher({ user }: { user: ProUser }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // Single-org users see a static label instead of a clickable menu.
  if (user.otherOrgs.length === 0) {
    return (
      <div className="ow-side-plan" style={{ cursor: "default" }}>
        <Briefcase size={14} />
        <span className="t-body-sm" style={{ fontWeight: 600 }}>{user.organizationName}</span>
      </div>
    );
  }

  function pick(id: string) {
    setOpen(false);
    startTransition(() => {
      void switchOrganization(id);
    });
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        className="ow-side-plan focusable"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{ width: "100%" }}
      >
        <Briefcase size={14} />
        <span className="t-body-sm" style={{ fontWeight: 600, flex: 1, textAlign: "left" }}>
          {user.organizationName}
        </span>
        <ChevronUp size={12} style={{ color: "var(--muted-foreground)" }} />
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 30 }} onClick={() => setOpen(false)} />
          <div className="ow-side-menu card" role="menu" style={{ minWidth: 220 }}>
            <button
              className="ow-side-menu-item"
              onClick={() => pick(user.organizationId)}
              disabled={pending}
            >
              <Check size={14} />
              <span style={{ fontWeight: 600 }}>{user.organizationName}</span>
            </button>
            {user.otherOrgs.map((o) => (
              <button key={o.id} className="ow-side-menu-item" onClick={() => pick(o.id)} disabled={pending}>
                <Briefcase size={14} />
                <span>{o.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SidebarFooter({ user, onNavigate }: { user: ProUser; onNavigate?: () => void }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const isDark = resolvedTheme === "dark";
  const initials = (user.fullName || user.email || "?")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="ow-side-foot">
      <div className="ow-side-plan" style={{ cursor: "default" }}>
        <ShieldCheck size={14} />
        <Badge variant="completed">{ROLE_LABEL[user.role]}</Badge>
      </div>
      <div style={{ position: "relative" }}>
        <button
          className="ow-side-user-btn focusable"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="avatar" style={{ flex: "none" }}>{initials}</span>
          <span className="ow-side-user-meta">
            <span className="ow-side-user-name">{user.fullName || "Pro user"}</span>
            <span className="ow-side-user-email t-caption muted">{user.email}</span>
          </span>
          <ChevronUp size={14} style={{ color: "var(--muted-foreground)" }} />
        </button>
        {menuOpen && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 30 }} onClick={() => setMenuOpen(false)} />
            <div className="ow-side-menu card" role="menu">
              <button className="ow-side-menu-item" onClick={() => setTheme(isDark ? "light" : "dark")}>
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
                <span>{isDark ? "Light mode" : "Dark mode"}</span>
              </button>
              <Link
                href="/dashboard"
                className="ow-side-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  onNavigate?.();
                }}
              >
                <Users size={16} /><span>Back to my account</span>
              </Link>
              <hr className="hr" style={{ margin: "4px 0" }} />
              <button className="ow-side-menu-item" style={{ color: "var(--destructive)" }} onClick={signOut}>
                <LogOut size={16} /><span>Sign out</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ProSidebar({ user }: { user: ProUser }) {
  const pathname = usePathname();
  return (
    <aside className="ow-sidebar" aria-label="Pro navigation">
      <div className="ow-side-head">
        <Link href="/pro/dashboard" className="ow-side-logo focusable" aria-label="OwnWill Pro">
          <LeafMark size={28} />
          <span className="ow-side-wordmark">OwnWill</span>
          <Badge variant="new" style={{ marginLeft: 4 }}>Pro</Badge>
        </Link>
      </div>
      <div style={{ padding: "0 12px 12px" }}>
        <OrgSwitcher user={user} />
      </div>
      <NavItems pathname={pathname} />
      <SidebarFooter user={user} />
    </aside>
  );
}

export function ProMobileDrawer({
  user,
  open,
  onClose,
}: {
  user: ProUser;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className={cls("ow-side-drawer-overlay", open && "is-open")} onClick={onClose}>
      <aside className="ow-sidebar ow-side-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="ow-side-head">
          <Link href="/pro/dashboard" className="ow-side-logo" onClick={onClose}>
            <LeafMark size={28} />
            <span className="ow-side-wordmark">OwnWill</span>
            <Badge variant="new" style={{ marginLeft: 4 }}>Pro</Badge>
          </Link>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close menu">
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: "0 12px 12px" }}>
          <OrgSwitcher user={user} />
        </div>
        <NavItems pathname={pathname} onNavigate={onClose} />
        <SidebarFooter user={user} onNavigate={onClose} />
      </aside>
    </div>
  );
}
