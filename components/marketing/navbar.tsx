"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { Button, cls } from "@/components/ui-kit";

const LINKS = [
  { label: "How it works", to: "/how-it-works" },
  { label: "Pricing", to: "/pricing" },
  { label: "Learn", to: "/learn" },
  { label: "Support", to: "/support" },
];

const OVER_HERO = ["/", "/how-it-works", "/pricing", "/about"];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const overHero = OVER_HERO.includes(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cls("navbar", scrolled ? "scrolled" : overHero ? "over-hero" : "scrolled")}>
      <div className="container max-marketing row" style={{ height: 72, justifyContent: "space-between" }}>
        <Link href="/" className="focusable" style={{ textDecoration: "none" }}>
          <Wordmark />
        </Link>
        <nav className="row g-6" style={{ marginLeft: 32 }}>
          <div className="row g-6 nav-links">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                href={l.to}
                className="focusable"
                style={{
                  color: pathname === l.to ? "var(--foreground)" : "var(--muted-foreground)",
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: 14,
                  padding: "8px 0",
                  borderBottom: pathname === l.to ? "2px solid var(--cta)" : "2px solid transparent",
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="row g-2 nav-actions">
            <Button variant="ghost" size="sm" href="/login">
              Log in
            </Button>
            <Button variant="primary" size="sm" href="/signup">
              Get started
            </Button>
          </div>
          <button className="btn btn-ghost btn-icon nav-burger" aria-label="Menu" onClick={() => setMobileOpen(true)}>
            <Menu />
          </button>
        </nav>
      </div>

      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, background: "var(--background)", zIndex: 60, padding: 24, animation: "ow-fade 240ms var(--ease-std)" }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 32 }}>
            <Wordmark />
            <button className="btn btn-ghost btn-icon" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X />
            </button>
          </div>
          <div className="stack g-4">
            {LINKS.map((l) => (
              <Link key={l.to} href={l.to} onClick={() => setMobileOpen(false)} className="t-h4" style={{ color: "var(--foreground)", textDecoration: "none" }}>
                {l.label}
              </Link>
            ))}
          </div>
          <div style={{ position: "fixed", left: 24, right: 24, bottom: 24 }} className="stack g-3">
            <Button variant="outline" size="lg" href="/login" onClick={() => setMobileOpen(false)}>
              Log in
            </Button>
            <Button size="lg" href="/signup" onClick={() => setMobileOpen(false)}>
              Get started
            </Button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 820px) { .nav-links, .nav-actions { display: none; } }
        @media (min-width: 821px) { .nav-burger { display: none; } }
      `}</style>
    </header>
  );
}
