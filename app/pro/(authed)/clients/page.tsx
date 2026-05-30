import Link from "next/link";
import { Download, Search, UserPlus } from "lucide-react";
import { requirePro, canInviteClients } from "@/lib/pro/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPage } from "@/components/app/app-page";
import { Badge, Button, Card } from "@/components/ui-kit";

export const metadata = { title: "Clients — OwnWill Pro" };

const PAGE_SIZE = 25;

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
  asset_list: "Assets",
};

const DOC_TYPES = ["will", "poa_health", "poa_property", "asset_list"] as const;

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

interface ClientRow {
  userId: string;
  email: string;
  fullName: string;
  province: string | null;
  status: ClientStatus;
  acceptedAt: string | null;
  invitedAt: string | null;
  docTypes: string[];
}

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    doc?: string;
    page?: string;
  }>;
}

export default async function ProClientsPage({ searchParams }: PageProps) {
  const user = await requirePro();
  const { q: rawQ, status: rawStatus, doc: rawDoc, page: rawPage } = await searchParams;
  const q = rawQ?.trim() || undefined;
  const status = rawStatus === "invited" || rawStatus === "active" || rawStatus === "revoked" ? rawStatus : undefined;
  const docType = (DOC_TYPES as readonly string[]).includes(rawDoc ?? "") ? rawDoc : undefined;
  const currentPage = Math.max(1, Number(rawPage) || 1);

  const admin = createAdminClient();
  const orgId = user.organizationId;

  // 1. Pull the linkage rows for this org. We do the filtering + pagination on
  //    this set (it's small per-org) and join through to profiles/documents
  //    only for the page we're showing.
  let linkQ = admin
    .from("organization_clients")
    .select("user_id, status, accepted_at, invited_at, invited_email", { count: "exact" })
    .eq("organization_id", orgId)
    .order("accepted_at", { ascending: false, nullsFirst: false })
    .order("invited_at", { ascending: false });

  if (status) linkQ = linkQ.eq("status", status);

  const { data: links, count: linksCount } = await linkQ;
  const linkRows = links ?? [];
  const userIds = linkRows.map((r) => r.user_id as string);

  // 2. Profile lookup (single round-trip for everyone on this org).
  const profileById = new Map<string, { email: string; full_name: string; province: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email, full_name, province")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      profileById.set(p.id as string, {
        email: (p.email as string) ?? "",
        full_name: (p.full_name as string) ?? "",
        province: (p.province as string) ?? null,
      });
    }
  }

  // 3. Document types per client (used for the doc-type filter + chips).
  const docsByUser = new Map<string, Set<string>>();
  if (userIds.length > 0) {
    const { data: docs } = await admin
      .from("documents")
      .select("user_id, type")
      .in("user_id", userIds)
      .eq("is_current", true);
    for (const d of docs ?? []) {
      const set = docsByUser.get(d.user_id as string) ?? new Set<string>();
      set.add(d.type as string);
      docsByUser.set(d.user_id as string, set);
    }
  }

  // 4. Apply post-fetch filters (search + doc-type). Both touch fields that
  //    live outside organization_clients, so we filter the joined set.
  let rows: ClientRow[] = linkRows.map((l) => {
    const profile = profileById.get(l.user_id as string);
    const docs = Array.from(docsByUser.get(l.user_id as string) ?? []);
    return {
      userId: l.user_id as string,
      email: profile?.email || (l.invited_email as string) || "",
      fullName: profile?.full_name || "",
      province: profile?.province ?? null,
      status: l.status as ClientStatus,
      acceptedAt: (l.accepted_at as string) ?? null,
      invitedAt: (l.invited_at as string) ?? null,
      docTypes: docs,
    };
  });

  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.email.toLowerCase().includes(needle) ||
        r.fullName.toLowerCase().includes(needle),
    );
  }
  if (docType) {
    rows = rows.filter((r) => r.docTypes.includes(docType));
  }

  const filteredTotal = rows.length;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const baseQS = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (status) u.set("status", status);
    if (docType) u.set("doc", docType);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `?${s}` : "";
  };

  const totalForOrg = linksCount ?? linkRows.length;
  const canInvite = canInviteClients(user.role);

  return (
    <AppPage
      breadcrumb={`${user.organizationName} · Pro`}
      title="Clients"
      wide
      actions={
        <div className="row g-2">
          <Button
            href="/pro/clients/export"
            variant="outline"
            icon={<Download size={16} />}
            // Anchor tag — browser handles the file download from the GET route.
            download
          >
            Export CSV
          </Button>
          {canInvite && (
            <Button href="/pro/clients/invite" icon={<UserPlus size={16} />}>
              Invite clients
            </Button>
          )}
        </div>
      }
    >
      <p className="t-body muted" style={{ marginTop: -8, marginBottom: 16 }}>
        {totalForOrg.toLocaleString()} {totalForOrg === 1 ? "client" : "clients"} on your firm
        {status ? ` · ${STATUS_BADGE[status].label}` : ""}
        {filteredTotal !== totalForOrg ? ` · ${filteredTotal} matching` : ""}.
      </p>

      <form className="row g-2 mb-4" style={{ flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 280px", minWidth: 220 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--ink-500)",
            }}
          />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search name or email…"
            className="input"
            style={{ paddingLeft: 40 }}
          />
        </div>
        <select name="status" defaultValue={status ?? ""} className="select" style={{ width: 160 }}>
          <option value="">All statuses</option>
          <option value="invited">Invited</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
        </select>
        <select name="doc" defaultValue={docType ?? ""} className="select" style={{ width: 180 }}>
          <option value="">All documents</option>
          <option value="will">Will</option>
          <option value="poa_health">POA — Health</option>
          <option value="poa_property">POA — Property</option>
          <option value="asset_list">Asset list</option>
        </select>
        <button type="submit" className="btn btn-outline">Filter</button>
        {(q || status || docType) && (
          <Link href="/pro/clients" className="btn btn-ghost">Clear</Link>
        )}
      </form>

      <Card padded={false} style={{ overflow: "hidden" }}>
        {pageRows.length === 0 ? (
          <div className="t-body-sm muted" style={{ padding: 24 }}>
            {totalForOrg === 0
              ? "No clients yet. Invite your first one to get started."
              : "No clients match your filters."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead>
                <tr style={{ background: "var(--muted)" }}>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Name</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Email</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Documents</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Status</th>
                  <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Linked</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => {
                  const meta = STATUS_BADGE[r.status];
                  const linked = r.acceptedAt || r.invitedAt;
                  return (
                    <tr key={r.userId} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: 0 }}>
                        <Link
                          href={`/pro/clients/${r.userId}`}
                          style={{
                            display: "block",
                            padding: 12,
                            textDecoration: "none",
                            color: "inherit",
                          }}
                        >
                          <span className="t-body-sm" style={{ fontWeight: 600 }}>
                            {r.fullName || "—"}
                          </span>
                          {r.province && (
                            <span className="t-caption muted" style={{ marginLeft: 6 }}>
                              {r.province}
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="t-body-sm" style={{ padding: 12 }}>{r.email || "—"}</td>
                      <td style={{ padding: 12 }}>
                        {r.docTypes.length === 0 ? (
                          <span className="t-caption muted">None yet</span>
                        ) : (
                          <div className="row g-1" style={{ flexWrap: "wrap" }}>
                            {r.docTypes.map((t) => (
                              <Badge key={t} variant="info">
                                {DOC_TYPE_LABEL[t] ?? t}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: 12 }}>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </td>
                      <td className="t-caption" style={{ padding: 12, whiteSpace: "nowrap" }}>
                        {fmtDate(linked)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="row mt-4" style={{ justifyContent: "space-between" }}>
          <span className="t-caption muted">
            Page {currentPage} of {totalPages}
          </span>
          <div className="row g-2">
            {currentPage > 1 && (
              <Link
                href={`/pro/clients${baseQS(currentPage - 1)}`}
                className="btn btn-outline btn-sm"
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/pro/clients${baseQS(currentPage + 1)}`}
                className="btn btn-outline btn-sm"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </AppPage>
  );
}
