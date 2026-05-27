import Link from "next/link";
import { ArrowRight, CreditCard, FileText, ScrollText, Users } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPage } from "@/components/app/app-page";
import { Badge, Button, Card } from "@/components/ui-kit";

function fmtMoney(cents: number) {
  return `$${(cents / 1).toFixed(2)}`;
}

function startOf(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

async function loadKpis() {
  const admin = createAdminClient();
  const since7 = startOf(7);
  const since30 = startOf(30);

  const [
    usersTotal, usersWeek,
    docsTotal, docsGenerated,
    paymentsSucceeded30, paymentsAllTimeSum,
    recentSignups, recentDocs,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since7),
    admin.from("documents").select("id", { count: "exact", head: true }),
    admin.from("documents").select("id", { count: "exact", head: true }).eq("status", "generated"),
    admin.from("payments").select("amount").eq("status", "succeeded").gte("created_at", since30),
    admin.from("payments").select("amount").eq("status", "succeeded"),
    admin.from("profiles").select("id, email, full_name, created_at, plan").order("created_at", { ascending: false }).limit(5),
    admin.from("documents").select("id, type, status, updated_at, user_id").order("updated_at", { ascending: false }).limit(5),
  ]);

  const revenue30 = (paymentsSucceeded30.data ?? []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const revenueAll = (paymentsAllTimeSum.data ?? []).reduce((s, r) => s + (Number(r.amount) || 0), 0);

  return {
    usersTotal: usersTotal.count ?? 0,
    usersWeek: usersWeek.count ?? 0,
    docsTotal: docsTotal.count ?? 0,
    docsGenerated: docsGenerated.count ?? 0,
    revenue30,
    revenueAll,
    recentSignups: recentSignups.data ?? [],
    recentDocs: recentDocs.data ?? [],
  };
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="stack g-2">
      <div className="t-overline muted">{label}</div>
      <div className="t-h2" style={{ margin: 0 }}>{value}</div>
      {sub && <div className="t-caption muted">{sub}</div>}
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const k = await loadKpis();

  return (
    <AppPage breadcrumb="Admin" title={`Welcome, ${user.fullName.split(/\s+/)[0] || "Staff"}.`} wide>
      <p className="t-body muted" style={{ marginTop: -8, marginBottom: 24 }}>
        Operational snapshot of OwnWill — refreshed on every load.
      </p>

      <div className="grid g-4 kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label="Total users" value={k.usersTotal} sub={`+${k.usersWeek} this week`} />
        <Kpi label="Documents" value={k.docsTotal} sub={`${k.docsGenerated} generated`} />
        <Kpi label="Revenue (30d)" value={fmtMoney(k.revenue30)} sub="paid status" />
        <Kpi label="Revenue (all-time)" value={fmtMoney(k.revenueAll)} sub="paid status" />
      </div>

      <div className="grid g-4 mt-6 split-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card className="stack g-3">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="row g-2"><Users size={18} /><h3 className="t-h5" style={{ margin: 0 }}>Recent signups</h3></div>
            <Button variant="link" href="/admin/users" iconRight={<ArrowRight size={14} />}>All users</Button>
          </div>
          {k.recentSignups.length === 0 ? (
            <p className="t-body-sm muted">No signups yet.</p>
          ) : (
            <ul className="stack g-2" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {k.recentSignups.map((p) => (
                <li key={p.id as string} className="row" style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div className="t-body-sm" style={{ fontWeight: 600 }}>{(p.full_name as string) || "—"}</div>
                    <div className="t-caption muted">{p.email as string}</div>
                  </div>
                  <Badge variant={p.plan === "none" ? "draft" : "completed"}>{(p.plan as string) ?? "none"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="stack g-3">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="row g-2"><FileText size={18} /><h3 className="t-h5" style={{ margin: 0 }}>Recent document activity</h3></div>
            <Button variant="link" href="/admin/documents" iconRight={<ArrowRight size={14} />}>All documents</Button>
          </div>
          {k.recentDocs.length === 0 ? (
            <p className="t-body-sm muted">No document activity yet.</p>
          ) : (
            <ul className="stack g-2" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {k.recentDocs.map((d) => (
                <li key={d.id as string} className="row" style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div className="t-body-sm" style={{ fontWeight: 600 }}>{(d.type as string).replace("_", " ")}</div>
                    <div className="t-caption muted">{new Date(d.updated_at as string).toLocaleString("en-CA")}</div>
                  </div>
                  <Badge variant={d.status === "generated" ? "paid" : d.status === "completed" ? "completed" : "draft"}>{d.status as string}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid g-4 mt-6 split-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Link href="/admin/payments" style={{ textDecoration: "none", color: "inherit" }}>
          <Card interactive className="row g-3" style={{ alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--coral-100)", color: "var(--coral-700)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><CreditCard /></div>
            <div style={{ flex: 1 }}>
              <div className="t-h5">Payments</div>
              <div className="t-body-sm muted">Review, refund, comp plans</div>
            </div>
            <ArrowRight size={18} style={{ color: "var(--muted-foreground)" }} />
          </Card>
        </Link>
        <Link href="/admin/audit" style={{ textDecoration: "none", color: "inherit" }}>
          <Card interactive className="row g-3" style={{ alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--teal-100)", color: "var(--teal-800)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><ScrollText /></div>
            <div style={{ flex: 1 }}>
              <div className="t-h5">Audit log</div>
              <div className="t-body-sm muted">Every admin action, append-only</div>
            </div>
            <ArrowRight size={18} style={{ color: "var(--muted-foreground)" }} />
          </Card>
        </Link>
      </div>

      <style>{`
        @media (max-width: 900px) { .kpi-grid { grid-template-columns: 1fr 1fr !important; } .split-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 520px) { .kpi-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </AppPage>
  );
}
