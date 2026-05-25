"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowRight,
  ChevronUp,
  CreditCard,
  FileText,
  CircleHelp,
  Home,
  LogOut,
  Moon,
  Sun,
  User,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { LeafMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui-kit";
import { cls } from "@/lib/cls";
import type { ShellUser } from "@/components/app/shell-context";

const ITEMS = [
  { label: "Dashboard", icon: <Home />, to: "/dashboard", match: ["/dashboard"] },
  { label: "My documents", icon: <FileText />, to: "/documents", match: ["/documents", "/will", "/review", "/payment", "/download", "/signing", "/poa-health", "/poa-property", "/assets"] },
  { label: "Profile", icon: <User />, to: "/profile", match: ["/profile"] },
  { label: "Billing", icon: <CreditCard />, to: "/billing", match: ["/billing"] },
  { label: "Support", icon: <CircleHelp />, to: "/help", match: ["/help"] },
];

const PLAN_LABEL: Record<ShellUser["plan"], string> = {
  none: "Free",
  essentials: "Essentials",
  premium: "Premium",
  premium_x2: "Premium ×2",
};

function NavItems({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="ow-side-nav">
      {ITEMS.map((it) => {
        const active = it.match.some((m) => pathname === m || pathname.startsWith(m + "/"));
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

function SidebarFooter({ user, onNavigate }: { user: ShellUser; onNavigate?: () => void }) {
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
      <Link href="/billing" onClick={onNavigate} className="ow-side-plan focusable" style={{ textDecoration: "none" }}>
        <Badge variant={user.plan === "none" ? "draft" : "completed"}>{PLAN_LABEL[user.plan]}</Badge>
        <span className="t-caption muted">{user.plan === "none" ? "Upgrade" : "Manage plan"}</span>
        <ArrowRight size={14} style={{ color: "var(--muted-foreground)" }} />
      </Link>
      <div style={{ position: "relative" }}>
        <button className="ow-side-user-btn focusable" onClick={() => setMenuOpen(!menuOpen)} aria-haspopup="menu" aria-expanded={menuOpen}>
          <span className="avatar" style={{ flex: "none" }}>{initials}</span>
          <span className="ow-side-user-meta">
            <span className="ow-side-user-name">{user.fullName || "You"}</span>
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
              <Link href="/profile" className="ow-side-menu-item" onClick={() => { setMenuOpen(false); onNavigate?.(); }}>
                <User size={16} /><span>Profile</span>
              </Link>
              <Link href="/billing" className="ow-side-menu-item" onClick={() => { setMenuOpen(false); onNavigate?.(); }}>
                <CreditCard size={16} /><span>Billing</span>
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

export function Sidebar({ user }: { user: ShellUser }) {
  const pathname = usePathname();
  return (
    <aside className="ow-sidebar" aria-label="Main navigation">
      <div className="ow-side-head">
        <Link href="/dashboard" className="ow-side-logo focusable" aria-label="OwnWill home">
          <LeafMark size={28} />
          <span className="ow-side-wordmark">OwnWill</span>
        </Link>
      </div>
      <NavItems pathname={pathname} />
      <SidebarFooter user={user} />
    </aside>
  );
}

export function MobileDrawer({
  user,
  open,
  onClose,
}: {
  user: ShellUser;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className={cls("ow-side-drawer-overlay", open && "is-open")} onClick={onClose}>
      <aside className="ow-sidebar ow-side-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="ow-side-head">
          <Link href="/dashboard" className="ow-side-logo" onClick={onClose}>
            <LeafMark size={28} />
            <span className="ow-side-wordmark">OwnWill</span>
          </Link>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close menu">
            <X size={16} />
          </button>
        </div>
        <NavItems pathname={pathname} onNavigate={onClose} />
        <SidebarFooter user={user} onNavigate={onClose} />
      </aside>
    </div>
  );
}
