import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { emailLayout } from "@/lib/email/send";
import { AppPage } from "@/components/app/app-page";
import { Badge, Card } from "@/components/ui-kit";

interface Template {
  key: string;
  label: string;
  subject: string;
  trigger: string;
  render: () => string;
  sentBy: "ses" | "supabase";
}

const TEMPLATES: Template[] = [
  {
    key: "signing_instructions",
    label: "Signing instructions",
    subject: "Your OwnWill will is ready",
    trigger: "Sent after a customer pays. Logged with email_type = signing_instructions.",
    sentBy: "ses",
    render: () =>
      emailLayout(
        "Your will is ready 🎉",
        `<p>Thanks for completing your will with OwnWill. Your document is generated and ready to download from your dashboard.</p>
         <p><strong>Next steps:</strong> print it on plain paper and sign it in front of two adult witnesses who aren't beneficiaries. In British Columbia you can sign electronically.</p>
         <p>You can edit and re-generate your will any time — updates are free for life.</p>`,
      ),
  },
  {
    key: "verify_signup",
    label: "Verify email (signup)",
    subject: "Confirm your OwnWill email",
    trigger: "Triggered by Supabase Auth when a user signs up or via admin → Resend verification.",
    sentBy: "supabase",
    render: () => "", // not previewable here — managed in Supabase dashboard
  },
  {
    key: "password_reset",
    label: "Password reset",
    subject: "Reset your OwnWill password",
    trigger: "Triggered by Supabase Auth when a user requests reset or via admin → Send password reset.",
    sentBy: "supabase",
    render: () => "",
  },
];

export default async function AdminEmailTemplatePreviewsPage() {
  await requireAdmin();

  return (
    <AppPage breadcrumb="Admin / Emails" title="Template previews" wide>
      <div className="mb-4">
        <Link href="/admin/emails" className="t-caption muted" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <ArrowLeft size={14} /> Email log
        </Link>
      </div>

      <p className="t-body muted" style={{ marginBottom: 16 }}>
        Renders each transactional template as a recipient would see it. Supabase-Auth emails (verification,
        password reset) are configured in the Supabase dashboard and aren&apos;t previewable here.
      </p>

      <div className="stack g-4">
        {TEMPLATES.map((t) => {
          const isSupabase = t.sentBy === "supabase";
          const html = isSupabase ? "" : t.render();
          return (
            <Card key={t.key} padded>
              <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", alignItems: "flex-start", marginBottom: 12 }}>
                <div className="stack g-1">
                  <div className="row g-2" style={{ alignItems: "center" }}>
                    <h3 className="t-h4" style={{ margin: 0 }}>{t.label}</h3>
                    <Badge variant={isSupabase ? "draft" : "completed"}>
                      {isSupabase ? "Supabase Auth" : "SES (transactional)"}
                    </Badge>
                  </div>
                  <div className="t-body-sm"><strong>Subject:</strong> {t.subject}</div>
                  <div className="t-caption muted">{t.trigger}</div>
                </div>
                <code className="t-caption muted" style={{ fontFamily: "var(--font-mono, monospace)" }}>
                  email_type: {t.key}
                </code>
              </div>

              {isSupabase ? (
                <div className="t-body-sm muted" style={{ padding: "16px 0" }}>
                  Edit this template in your Supabase project: <strong>Authentication → Email templates</strong>.
                </div>
              ) : (
                <iframe
                  title={`Preview: ${t.label}`}
                  srcDoc={html}
                  sandbox=""
                  style={{
                    width: "100%",
                    height: 420,
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    background: "#fff",
                  }}
                />
              )}
            </Card>
          );
        })}
      </div>
    </AppPage>
  );
}
