import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface Props {
  /** "customer" routes link back to /, "pro" routes link back to /pro/login. */
  variant: "customer" | "pro";
  supportEmail?: string;
}

/**
 * Server-rendered fullscreen takeover used when `app_settings.maintenance_mode`
 * is true. The customer (app) and Pro (authed) layouts return this in place of
 * the regular shell so signed-in users see status messaging instead of a
 * potentially broken app surface.
 */
export function MaintenanceScreen({ variant, supportEmail }: Props) {
  const homeHref = variant === "pro" ? "/pro/login" : "/";
  const homeLabel = variant === "pro" ? "Back to Pro sign-in" : "Back to homepage";
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "48px 24px",
        background: "var(--background)",
      }}
    >
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "var(--warning-bg, var(--muted))",
            color: "var(--warning)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
          aria-hidden="true"
        >
          <AlertTriangle size={32} />
        </div>
        <h1 className="t-h2" style={{ margin: "0 0 12px" }}>
          OwnWill is in maintenance
        </h1>
        <p className="t-body muted" style={{ margin: "0 0 28px" }}>
          We&rsquo;re briefly offline for scheduled work. Your data is safe —
          please check back shortly. {variant === "pro"
            ? "Pro sign-in stays available so your team can see this status message."
            : null}
        </p>
        <div
          className="row g-3"
          style={{ justifyContent: "center", flexWrap: "wrap" }}
        >
          <Link
            href={homeHref}
            className="t-body-sm"
            style={{
              padding: "10px 18px",
              border: "1px solid var(--border)",
              borderRadius: 8,
              textDecoration: "none",
              color: "var(--foreground)",
            }}
          >
            {homeLabel}
          </Link>
          {supportEmail && (
            <a
              href={`mailto:${supportEmail}`}
              className="t-body-sm"
              style={{
                padding: "10px 18px",
                border: "1px solid var(--primary)",
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              Contact {supportEmail}
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
