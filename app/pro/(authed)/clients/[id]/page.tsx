import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ScrollText } from "lucide-react";
import { requirePro, canEditClientDocs } from "@/lib/pro/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logClientView } from "@/lib/pro/actions";
import { AppPage } from "@/components/app/app-page";
import { Badge, Card } from "@/components/ui-kit";
import { ClientActions } from "@/components/pro/client-actions";

export const metadata = { title: "Client — OwnWill Pro" };

type ClientStatus = "invited" | "active" | "revoked";

const STATUS_BADGE: Record<ClientStatus, { variant: "draft" | "completed" | "locked"; label: string }> = {
  invited: { variant: "draft", label: "Invited" },
  active: { variant: "completed", label: "Active" },
  revoked: { variant: "locked", label: "Revoked" },
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

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProClientDetailPage({ params }: PageProps) {
  const user = await requirePro();
  const { id } = await params;

  const admin = createAdminClient();

  // The org-client linkage row scopes everything else; if it doesn't exist
  // for *this* org the user must not see the customer's data, even if they
  // know the UUID.
  const { data: link } = await admin
    .from("organization_clients")
    .select("status, accepted_at, invited_at, revoked_at, invited_email, notes, added_by")
    .eq("organization_id", user.organizationId)
    .eq("user_id", id)
    .maybeSingle();
  if (!link) notFound();

  const status = link.status as ClientStatus;

  // Fire-and-forget audit log of the view. We don't await it explicitly to
  // keep render snappy, but the server action runs to completion before the
  // RSC response flushes.
  await logClientView(id);

  const [{ data: profile }, { data: documents }, { data: auditRows }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, full_name, phone, province, city, address, postal_code, created_at")
      .eq("id", id)
      .maybeSingle(),
    admin
      .from("documents")
      .select(
        "id, type, status, province, version, pdf_url, pdf_generated_at, updated_at, created_at, is_current",
      )
      .eq("user_id", id)
      .order("updated_at", { ascending: false }),
    admin
      .from("admin_audit_log")
      .select("id, actor_email, action, metadata, created_at")
      .eq("target_type", "user")
      .eq("target_id", id)
      .like("action", "pro.%")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const meta = STATUS_BADGE[status];
  const email = (profile?.email as string) || (link.invited_email as string) || "";
  const fullName = (profile?.full_name as string) || "";
  const heading = fullName || email || "Client";
  const canEdit = canEditClientDocs(user.role);
  const canRevoke = user.role !== "viewer";

  return (
    <AppPage breadcrumb={`${user.organizationName} · Clients`} title={heading} wide>
      <div className="mb-4">
        <Link
          href="/pro/clients"
          className="t-caption muted"
          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <ArrowLeft size={14} /> All clients
        </Link>
      </div>

      <div className="stack g-4">
        <Card padded>
          <div
            className="row g-3"
            style={{ justifyContent: "space-between", flexWrap: "wrap", alignItems: "flex-start" }}
          >
            <div className="stack g-2">
              <div className="row g-2" style={{ flexWrap: "wrap" }}>
                <Badge variant={meta.variant}>{meta.label}</Badge>
                {status === "invited" && (
                  <span className="t-caption muted">
                    Invited {fmtDate(link.invited_at as string)}
                  </span>
                )}
                {status === "revoked" && (
                  <span className="t-caption muted">
                    Revoked {fmtDate(link.revoked_at as string)}
                  </span>
                )}
              </div>
              <div className="t-body">
                <strong>Email:</strong> {email || "—"}
              </div>
              {/*
                PIPEDA gate (§7.2): until the client accepts the invitation,
                their org sees only email + invite status. Phone/address and
                "customer since" details are withheld so an org can't
                deanonymize a pre-acceptance person from the staff side.
              */}
              {status === "invited" ? (
                <div className="t-caption muted">
                  The client hasn&rsquo;t accepted yet. Profile details unlock when
                  they sign up via the invitation link.
                </div>
              ) : (
                <>
                  <div className="t-body">
                    <strong>Phone:</strong> {(profile?.phone as string) || "—"}
                  </div>
                  <div className="t-body">
                    <strong>Address:</strong>{" "}
                    {[profile?.address, profile?.city, profile?.province, profile?.postal_code]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </div>
                  <div className="t-caption muted">
                    Customer since {fmtDate(profile?.created_at as string)}
                    {link.accepted_at
                      ? ` · Joined your firm ${fmtDate(link.accepted_at as string)}`
                      : ""}
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {status === "revoked" && (
          <Card padded className="stack g-2" style={{ background: "var(--muted)" }}>
            <div className="t-h5" style={{ margin: 0 }}>This client revoked your access</div>
            <p className="t-body-sm muted" style={{ margin: 0 }}>
              Documents and activity below are frozen at the point of revoke. To resume
              managing this client, send a new invitation from{" "}
              <Link href="/pro/clients/invite" className="link">Invite clients</Link>.
            </p>
          </Card>
        )}

        <Card padded>
          <h3 className="t-h4" style={{ marginTop: 0, marginBottom: 12 }}>
            Manage this client
          </h3>
          <ClientActions
            clientUserId={id}
            clientLabel={heading}
            initialNotes={(link.notes as string) || ""}
            status={status}
            canEdit={canEdit}
            canRevoke={canRevoke}
          />
        </Card>

        <Card padded={false}>
          <div className="row" style={{ justifyContent: "space-between", padding: "12px 16px" }}>
            <h3 className="t-h4" style={{ margin: 0 }}>Documents</h3>
            <span className="t-caption muted">{documents?.length ?? 0} total</span>
          </div>
          {!documents || documents.length === 0 ? (
            <div className="t-body-sm muted" style={{ padding: "0 16px 16px" }}>
              {status === "invited"
                ? "The client hasn't accepted the invitation yet."
                : "This client hasn't started any documents yet."}
            </div>
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
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d) => {
                    const dstatus = (d.status as string) ?? "draft";
                    const dmeta = DOC_STATUS_BADGE[dstatus] ?? DOC_STATUS_BADGE.draft;
                    return (
                      <tr key={d.id as string} style={{ borderTop: "1px solid var(--border)" }}>
                        <td className="t-body-sm" style={{ padding: 12, fontWeight: 600 }}>
                          {DOC_TYPE_LABEL[(d.type as string) ?? ""] ?? (d.type as string)}
                          {!d.is_current && (
                            <span className="t-caption muted" style={{ marginLeft: 6 }}>
                              (prev)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: 12 }}>
                          <Badge variant={dmeta.variant}>{dmeta.label}</Badge>
                        </td>
                        <td className="t-body-sm" style={{ padding: 12 }}>
                          {(d.province as string) || "—"}
                        </td>
                        <td className="t-body-sm" style={{ padding: 12 }}>{d.version as number}</td>
                        <td
                          className="t-caption"
                          style={{ padding: 12, whiteSpace: "nowrap" }}
                        >
                          {fmtDate(d.updated_at as string)}
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
            <div className="row g-2">
              <ScrollText size={16} />
              <h3 className="t-h4" style={{ margin: 0 }}>Activity</h3>
            </div>
            <span className="t-caption muted">{auditRows?.length ?? 0} events</span>
          </div>
          {!auditRows || auditRows.length === 0 ? (
            <div className="t-body-sm muted" style={{ padding: "0 16px 16px" }}>
              No recorded activity for this client yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                <thead>
                  <tr style={{ background: "var(--muted)" }}>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>When</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Who</th>
                    <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {auditRows.map((r) => (
                    <tr key={r.id as string} style={{ borderTop: "1px solid var(--border)" }}>
                      <td className="t-caption" style={{ padding: 12, whiteSpace: "nowrap" }}>
                        {fmtDate(r.created_at as string)}
                      </td>
                      <td className="t-body-sm" style={{ padding: 12 }}>
                        {(r.actor_email as string) || "—"}
                      </td>
                      <td style={{ padding: 12 }}>
                        <Badge variant="info">{r.action as string}</Badge>
                      </td>
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
