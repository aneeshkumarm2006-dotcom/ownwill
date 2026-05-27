"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronUp,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Moon,
  ScrollText,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { LeafMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui-kit";
import { cls } from "@/lib/cls";
import type { AdminUser } from "@/lib/admin/auth";

const ITEMS = [
  { label: "Dashboard", icon: <LayoutDashboard />, to: "/admin", match: ["/admin"], exact: true },
  { label: "Users", icon: <Users />, to: "/admin/users", match: ["/admin/users"] },
  { label: "Documents", icon: <FileText />, to: "/admin/documents", match: ["/admin/documents"] },
  { label: "Payments", icon: <CreditCard />, to: "/admin/payments", match: ["/admin/payments"] },
  { label: "Emails", icon: <Mail />, to: "/admin/emails", match: ["/admin/emails"] },
  { label: "Templates", icon: <FileText />, to: "/admin/templates", match: ["/admin/templates"] },
  { label: "Audit log", icon: <ScrollText />, to: "/admin/audit", match: ["/admin/audit"] },
  { label: "Settings", icon: <Settings />, to: "/admin/settings", match: ["/admin/settings"] },
];

const STAFF_ITEM = { label: "Staff", icon: <ShieldCheck />, to: "/admin/staff", match: ["/admin/staff"] };

const ROLE_LABEL = { support: "Support", admin: "Admin", super_admin: "Super admin" } as const;

function isActive(pathname: string, match: string[], exact?: boolean) {
  if (exact) return match.includes(pathname);
  return match.some((m) => pathname === m || pathname.startsWith(m + "/"));
}

function NavItems({ user, pathname, onNavigate }: { user: AdminUser; pathname: string; onNavigate?: () => void }) {
  const items = user.role === "super_admin" ? [...ITEMS.slice(0, 6), STAFF_ITEM, ...ITEMS.slice(6)] : ITEMS;
  return (
    <nav className="ow-side-nav">
      {items.map((it) => {
        const active = isActive(pathname, it.match, (it as { exact?: boolean }).exact);
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

function SidebarFooter({ user, onNavigate }: { user: AdminUser; onNavigate?: () => void }) {
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
        <Badge variant="completed">{ROLE_LABEL[user.role]}</Badge>
        <span className="t-caption muted">Staff</span>
      </div>
      <div style={{ position: "relative" }}>
        <button className="ow-side-user-btn focusable" onClick={() => setMenuOpen(!menuOpen)} aria-haspopup="menu" aria-expanded={menuOpen}>
          <span className="avatar" style={{ flex: "none" }}>{initials}</span>
          <span className="ow-side-user-meta">
            <span className="ow-side-user-name">{user.fullName || "Staff"}</span>
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
              <Link href="/dashboard" className="ow-side-menu-item" onClick={() => { setMenuOpen(false); onNavigate?.(); }}>
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

export function AdminSidebar({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  return (
    <aside className="ow-sidebar" aria-label="Admin navigation">
      <div className="ow-side-head">
        <Link href="/admin" className="ow-side-logo focusable" aria-label="OwnWill admin">
          <LeafMark size={28} />
          <span className="ow-side-wordmark">OwnWill</span>
          <Badge variant="new" style={{ marginLeft: 4 }}>Staff</Badge>
        </Link>
      </div>
      <NavItems user={user} pathname={pathname} />
      <SidebarFooter user={user} />
    </aside>
  );
}

export function AdminMobileDrawer({
  user,
  open,
  onClose,
}: {
  user: AdminUser;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className={cls("ow-side-drawer-overlay", open && "is-open")} onClick={onClose}>
      <aside className="ow-sidebar ow-side-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="ow-side-head">
          <Link href="/admin" className="ow-side-logo" onClick={onClose}>
            <LeafMark size={28} />
            <span className="ow-side-wordmark">OwnWill</span>
            <Badge variant="new" style={{ marginLeft: 4 }}>Staff</Badge>
          </Link>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close menu">
            <X size={16} />
          </button>
        </div>
        <NavItems user={user} pathname={pathname} onNavigate={onClose} />
        <SidebarFooter user={user} onNavigate={onClose} />
      </aside>
    </div>
  );
}
