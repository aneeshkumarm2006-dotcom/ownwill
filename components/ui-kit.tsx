"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type ReactNode,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Info,
  X,
} from "lucide-react";
import { cls } from "@/lib/cls";

export { cls };

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity=".25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

type ButtonVariant =
  | "primary" | "secondary" | "outline" | "ghost" | "cta" | "destructive" | "link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProps = Record<string, any>;

export function Button({
  variant = "primary",
  size = "default",
  href,
  icon,
  iconRight,
  loading,
  children,
  className,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: "default" | "sm" | "lg" | "icon";
  href?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  children?: ReactNode;
  className?: string;
} & AnyProps) {
  const sizeCls =
    size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : size === "icon" ? "btn-icon" : "";
  const classes = cls("btn", `btn-${variant}`, sizeCls, className);
  const content = (
    <>
      {loading && <Spinner />}
      {!loading && icon}
      {children}
      {!loading && iconRight}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <button className={classes} {...rest}>
      {content}
    </button>
  );
}

export function Card({
  children,
  className,
  padded = true,
  interactive,
  ...rest
}: {
  children?: ReactNode;
  className?: string;
  padded?: boolean;
  interactive?: boolean;
} & AnyProps) {
  return (
    <div className={cls("card", padded && "card-pad", interactive && "card-interactive", className)} {...rest}>
      {children}
    </div>
  );
}

export function Badge({
  variant = "draft",
  children,
  icon,
  className,
  ...rest
}: {
  variant?: "draft" | "completed" | "paid" | "locked" | "new" | "info" | "warning";
  children?: ReactNode;
  icon?: ReactNode;
  className?: string;
} & AnyProps) {
  return (
    <span className={cls("badge", `badge-${variant}`, className)} {...rest}>
      {icon}
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      {label && (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="muted" aria-hidden="true">
              {" "}*
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <span className="field-error">{error}</span>
      ) : (
        hint && <span className="field-hint">{hint}</span>
      )}
    </div>
  );
}

export function Input({
  error,
  leadingIcon,
  className,
  ...rest
}: { error?: boolean; leadingIcon?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  if (leadingIcon) {
    return (
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-500)" }}>
          {leadingIcon}
        </span>
        <input className={cls("input", className)} aria-invalid={error || undefined} style={{ paddingLeft: 40 }} {...rest} />
      </div>
    );
  }
  return <input className={cls("input", className)} aria-invalid={error || undefined} {...rest} />;
}

export function Select({ error, children, className, ...rest }: { error?: boolean } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cls("select", className)} aria-invalid={error || undefined} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ error, className, ...rest }: { error?: boolean } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cls("textarea", className)} aria-invalid={error || undefined} {...rest} />;
}

export function Alert({
  variant = "info",
  title,
  children,
  icon,
  onClose,
  className,
}: {
  variant?: "info" | "warning" | "error" | "success";
  title?: string;
  children?: ReactNode;
  icon?: ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  const color =
    variant === "warning" ? "var(--warning)" : variant === "error" ? "var(--destructive)" : variant === "success" ? "var(--success)" : "var(--info)";
  const defaultIcon =
    variant === "warning" || variant === "error" ? <AlertTriangle size={20} /> : variant === "success" ? <CheckCircle2 size={20} /> : <Info size={20} />;
  return (
    <div className={cls("alert", variant !== "info" && `alert-${variant}`, className)}>
      <div style={{ flex: "0 0 20px", color }}>{icon || defaultIcon}</div>
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 600, marginBottom: 2 }}>{title}</div>}
        <div className="t-body-sm">{children}</div>
      </div>
      {onClose && (
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Dismiss">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export function Progress({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      {label && (
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <span className="t-body-sm muted">{label}</span>
          <span className="t-body-sm" style={{ fontWeight: 600 }}>{pct}%</span>
        </div>
      )}
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: 640 }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12, alignItems: "flex-start" }}>
          <h3 className="t-h4" style={{ margin: 0 }}>{title}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div>{children}</div>
        {footer && <div className="row mt-6 g-3" style={{ justifyContent: "flex-end" }}>{footer}</div>}
      </div>
    </div>
  );
}

export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div>
      {items.map((it, i) => {
        const expanded = open === i;
        return (
          <div
            key={i}
            style={{
              borderTop: "1px solid var(--border)",
              borderBottom: i === items.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <button
              className="row focusable"
              onClick={() => setOpen(expanded ? null : i)}
              style={{ width: "100%", background: "transparent", border: "none", padding: "20px 0", justifyContent: "space-between", cursor: "pointer", color: "var(--foreground)", fontFamily: "inherit" }}
            >
              <span className="t-h5" style={{ textAlign: "left" }}>{it.q}</span>
              <span style={{ transition: "transform 200ms", transform: expanded ? "rotate(180deg)" : "none", color: "var(--muted-foreground)" }}>
                <ChevronDown />
              </span>
            </button>
            <div style={{ maxHeight: expanded ? 400 : 0, overflow: "hidden", transition: "max-height 240ms var(--ease-std), opacity 240ms", opacity: expanded ? 1 : 0 }}>
              <div className="t-body muted" style={{ paddingBottom: 20, maxWidth: "60ch" }}>{it.a}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
