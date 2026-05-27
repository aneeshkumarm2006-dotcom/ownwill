import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPage } from "@/components/app/app-page";
import { Badge, Card } from "@/components/ui-kit";
import { UserActions } from "@/components/admin/user-actions";

type Plan = "none" | "essentials" | "premium" | "premium_x2";

const PLAN_BADGE: Record<Plan, { variant: "draft" | "completed" | "paid" | "new"; label: string }> = {
  none: { variant: "draft", label: "Free" },
  essentials: { variant: "completed", label: "Essentials" },
  premium: { variant: "paid", label: "Premium" },
  premium_x2: { variant: "new", label: "Premium ×2" },
};

const DOC_TYPE_LABEL: Record<string, string> = {
  will: "Will",
  poa_health: "POA — Health",
  poa_property: "POA — Property",
  asset_list: "Asset list",
};

const DOC_STATUS_BADGE: Record<string, { variant: "draft" | "completed" | "paid" | "new"; label: string }> = {
  draft: { variant: "draft", label: "Draft" },
  completed: { variant: "completed", label: "Completed" },
  paid: { variant: "paid", label: "Paid" },
  generated: { variant: "new", label: "Generated" },
};

const ROLE_BADGE: Record<string, { variant: "draft" | "completed" | "new"; label: string }> = {
  customer: { variant: "draft", label: "Customer" },
  support: { variant: "completed", label: "Support" },
  admin: { variant: "new", label: "Admin" },
  super_admin: { variant: "new", label: "Super admin" },
};

function fmtMoney(amount: number | null | undefined, currency: string | null | undefined) {
  if (amount == null) return "—";
  const cur = (currency ?? "cad").toUpperCase();
  return `$${Number(amount).toFixed(2)} ${cur}`;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const admin = createAdminClient();

  const [{ data: profile }, { data: documents }, { data: payments }, { data: emails }, authRes] = await Promise.all([
    admin.from("profiles").select("*").eq("id", id).maybeSingle(),
    admin
      .from("documents")
      .select("id, type, status, province, version, pdf_url, pdf_generated_at, updated_at, created_at, is_current")
      .eq("user_id", id)
      .order("updated_at", { ascending: false }),
    admin
      .from("payments")
      .select("id, plan, amount, currency, status, stripe_payment_intent_id, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("email_logs")
      .select("id, email_type, to_email, subject, status, sent_at")
      .eq("user_id", id)
      .order("sent_at", { ascending: false })
      .limit(50),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.auth.admin as any).getUserById(id),
  ]);

  if (!profile) notFound();

  const authUser = authRes?.data?.user as
    | { banned_until?: string | null; last_sign_in_at?: string | null; email_confirmed_at?: string | null }
    | undefined;
  const suspended = !!(authUser?.banned_until && new Date(authUser.banned_until) > new Date());

  const plan = ((profile.plan as Plan) ?? "none") as Plan;
  const planMeta = PLAN_BADGE[plan];
  const role = (profile.role as string) ?? "customer";
  const roleMeta = ROLE_BADGE[role] ?? ROLE_BADGE.customer;
  const email = (profile.email as string) ?? "";
  const fullName = (profile.full_name as string) || "—";

  return (
    <AppPage breadcrumb="Admin / Users" title={fullName !== "—" ? fullName : email} wide>
      <div className="mb-4">
        <Link href="/admin/users" className="t-caption muted" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <ArrowLeft size={14} /> All users
        </Link>
      </div>

      <div className="stack g-4">
        <Card padded>
          <div className="row g-3" style={{ justifyContent: "space-between", flexWrap: "wrap", alignItems: "flex-start" }}>
            <div className="stack g-2">
              <div className="row g-2" style={{ flexWrap: "wrap" }}>
                <Badge variant={planMeta.variant}>{planMeta.label}</Badge>
                <Badge variant={roleMeta.variant}>{roleMeta.label}</Badge>
                {suspended && <Badge variant="draft">Suspended</Badge>}
                {!authUser?.email_confirmed_at && <Badge variant="draft">Email unverified</Badge>}
              </div>
              <div className="t-body"><strong>Email:</strong> {email}</div>
              <div className="t-body"><strong>Phone:</strong> {(profile.phone as string) || "—"}</div>
              <div className="t-body">
                <strong>Address:</strong>{" "}
                {[profile.address, profile.city, profile.province, profile.postal_code].filter(Boolean).join(", ") || "—"}
              </div>
              <div className="t-caption muted">
                Joined {fmtDate(profile.created_at as string)} · Last sign-in {fmtDate(authUser?.last_sign_in_at)}
              </div>
            </div>
          </div>
        </Card>

        <Card padded>
          <h3 className="t-h4" style={{ marginTop: 0, marginBottom: 12 }}>Admin actions</h3>
          <UserActions userId={id} email={email} currentPlan={plan} suspended={suspended} />
        </Card>

        <Card padded={false}>
          <div className="row" style={{ justifyContent: "space-between", padding: "12px 16px" }}>
            <h3 className="t-h4" style={{ margin: 0 }}>Documents</h3>
            <span className="t-caption muted">{documents?.length ?? 0} total</span>
          </div>
          {!documents || documents.length === 0 ? (
            <div className="t-body-sm muted" style={{ padding: "0 16px 16px" }}>No documents yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                <thead>
                  <tr style={{ background: "var(--muted)" }}>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Type</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Status</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Province</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>v</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Updated</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d) => {
                    const status = (d.status as string) ?? "draft";
                    const meta = DOC_STATUS_BADGE[status] ?? DOC_STATUS_BADGE.draft;
                    return (
                      <tr key={d.id as string} style={{ borderTop: "1px solid var(--border)" }}>
                        <td className="t-body-sm" style={{ padding: 12, fontWeight: 600 }}>
                          {DOC_TYPE_LABEL[(d.type as string) ?? ""] ?? (d.type as string)}
                          {!d.is_current && <span className="t-caption muted" style={{ marginLeft: 6 }}>(prev)</span>}
                        </td>
                        <td style={{ padding: 12 }}><Badge variant={meta.variant}>{meta.label}</Badge></td>
                        <td className="t-body-sm" style={{ padding: 12 }}>{(d.province as string) || "—"}</td>
                        <td className="t-body-sm" style={{ padding: 12 }}>{d.version as number}</td>
                        <td className="t-caption" style={{ padding: 12, whiteSpace: "nowrap" }}>{fmtDate(d.updated_at as string)}</td>
                        <td style={{ padding: 12 }}>
                          <Link href={`/admin/documents/${d.id}`} className="t-body-sm" style={{ fontWeight: 600 }}>Open</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card padded={false}>
          <div className="row" style={{ justifyContent: "space-between", padding: "12px 16px" }}>
            <h3 className="t-h4" style={{ margin: 0 }}>Payments</h3>
            <span className="t-caption muted">{payments?.length ?? 0} total</span>
          </div>
          {!payments || payments.length === 0 ? (
            <div className="t-body-sm muted" style={{ padding: "0 16px 16px" }}>No payments yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                <thead>
                  <tr style={{ background: "var(--muted)" }}>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Date</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Plan</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Amount</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Status</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Intent</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id as string} style={{ borderTop: "1px solid var(--border)" }}>
                      <td className="t-caption" style={{ padding: 12, whiteSpace: "nowrap" }}>{fmtDate(p.created_at as string)}</td>
                      <td className="t-body-sm" style={{ padding: 12 }}>{(p.plan as string) || "—"}</td>
                      <td className="t-body-sm" style={{ padding: 12 }}>{fmtMoney(p.amount as number | null, p.currency as string | null)}</td>
                      <td style={{ padding: 12 }}>
                        <Badge variant={(p.status as string) === "succeeded" ? "completed" : (p.status as string) === "refunded" ? "draft" : "new"}>
                          {(p.status as string) ?? "pending"}
                        </Badge>
                      </td>
                      <td className="t-caption" style={{ padding: 12, fontFamily: "var(--font-mono, monospace)" }}>
                        {(p.stripe_payment_intent_id as string) || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card padded={false}>
          <div className="row" style={{ justifyContent: "space-between", padding: "12px 16px" }}>
            <h3 className="t-h4" style={{ margin: 0 }}>Email log</h3>
            <span className="t-caption muted">{emails?.length ?? 0} total (last 50)</span>
          </div>
          {!emails || emails.length === 0 ? (
            <div className="t-body-sm muted" style={{ padding: "0 16px 16px" }}>No emails sent yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                <thead>
                  <tr style={{ background: "var(--muted)" }}>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Sent</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Type</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>To</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Subject</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((e) => (
                    <tr key={e.id as string} style={{ borderTop: "1px solid var(--border)" }}>
                      <td className="t-caption" style={{ padding: 12, whiteSpace: "nowrap" }}>{fmtDate(e.sent_at as string)}</td>
                      <td className="t-body-sm" style={{ padding: 12 }}>{(e.email_type as string) || "—"}</td>
                      <td className="t-body-sm" style={{ padding: 12 }}>{(e.to_email as string) || "—"}</td>
                      <td className="t-body-sm" style={{ padding: 12 }}>{(e.subject as string) || "—"}</td>
                      <td className="t-body-sm" style={{ padding: 12 }}>{(e.status as string) || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppPage>
  );
}
