import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadSettings } from "@/lib/admin/settings";
import { AppPage } from "@/components/app/app-page";
import { Badge, Card } from "@/components/ui-kit";
import { SettingsForm } from "@/components/admin/settings-form";

interface PricingRow {
  plan: string;
  amount: string;
  description: string;
}

const PRICING: PricingRow[] = [
  { plan: "essentials", amount: "$45 CAD", description: "Will only" },
  { plan: "premium", amount: "$95 CAD", description: "Will + POA Health + POA Property + Asset list" },
  { plan: "premium_x2", amount: "$150 CAD", description: "Premium for two (couples)" },
];

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminSettingsPage() {
  await requireAdmin();

  const settings = await loadSettings();

  const admin = createAdminClient();
  const { data: lastPayment } = await admin
    .from("payments")
    .select("created_at, status")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: lastEmail } = await admin
    .from("email_logs")
    .select("sent_at")
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <AppPage breadcrumb="Admin" title="Settings" wide>
      <p className="t-body muted" style={{ marginTop: -8, marginBottom: 16 }}>
        Operational config. Changes take effect immediately and are recorded in the audit log.
      </p>

      <div className="stack g-4">
        <Card padded>
          <h3 className="t-h4" style={{ marginTop: 0, marginBottom: 16 }}>General</h3>
          <SettingsForm initial={settings} />
        </Card>

        <Card padded>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 className="t-h4" style={{ margin: 0 }}>Pricing display</h3>
            <Badge variant="draft">Read-only</Badge>
          </div>
          <p className="t-caption muted" style={{ marginTop: 0 }}>
            Currently hardcoded in the app. Editing here requires Stripe price coordination — wired up
            with the real-Stripe chunk.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
            <thead>
              <tr style={{ background: "var(--muted)" }}>
                <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Plan</th>
                <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Price</th>
                <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Includes</th>
              </tr>
            </thead>
            <tbody>
              {PRICING.map((p) => (
                <tr key={p.plan} style={{ borderTop: "1px solid var(--border)" }}>
                  <td className="t-body-sm" style={{ padding: 12, fontWeight: 600 }}>{p.plan}</td>
                  <td className="t-body-sm" style={{ padding: 12 }}>{p.amount}</td>
                  <td className="t-body-sm" style={{ padding: 12 }}>{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card padded>
          <h3 className="t-h4" style={{ marginTop: 0, marginBottom: 12 }}>Integration health</h3>
          <div className="stack g-2">
            <div className="row g-2" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="t-body-sm" style={{ fontWeight: 600 }}>Stripe — last webhook</div>
                <div className="t-caption muted">Most recent payment event recorded.</div>
              </div>
              <div className="t-body-sm" style={{ textAlign: "right" }}>
                {fmtDate(lastPayment?.created_at as string | null)}
                {lastPayment?.status && (
                  <div className="t-caption muted">status: {lastPayment.status as string}</div>
                )}
              </div>
            </div>
            <hr className="hr" />
            <div className="row g-2" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="t-body-sm" style={{ fontWeight: 600 }}>SES — last email sent</div>
                <div className="t-caption muted">Most recent transactional send.</div>
              </div>
              <div className="t-body-sm" style={{ textAlign: "right" }}>
                {fmtDate(lastEmail?.sent_at as string | null)}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppPage>
  );
}
