import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePro, canInviteClients } from "@/lib/pro/auth";
import { AppPage } from "@/components/app/app-page";
import { Card } from "@/components/ui-kit";
import { InviteClientsForm } from "@/components/pro/invite-clients-form";

export const metadata = { title: "Invite clients — OwnWill Pro" };

export default async function ProInviteClientsPage() {
  const user = await requirePro();

  if (!canInviteClients(user.role)) {
    return (
      <AppPage breadcrumb={`${user.organizationName} · Clients`} title="Invite clients" wide>
        <Card padded className="stack g-3">
          <h2 className="t-h4" style={{ margin: 0 }}>You don&apos;t have permission to invite clients</h2>
          <p className="t-body muted" style={{ margin: 0 }}>
            Viewers can read client records but can&apos;t send invitations. Ask an owner or
            admin on your team to send the invite.
          </p>
        </Card>
      </AppPage>
    );
  }

  return (
    <AppPage breadcrumb={`${user.organizationName} · Clients`} title="Invite clients" wide>
      <div className="mb-4">
        <Link
          href="/pro/clients"
          className="t-caption muted"
          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <ArrowLeft size={14} /> All clients
        </Link>
      </div>

      <div className="ow-page-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 280px", gap: 24 }}>
        <div>
          <InviteClientsForm orgName={user.organizationName} />
        </div>
        <aside className="stack g-4">
          <Card className="stack g-3">
            <div className="t-h5">How invitations work</div>
            <ul className="stack g-2 t-body-sm muted" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li>· Each client gets a personal email with an accept link.</li>
              <li>· Links expire after 14 days. You can resend any time.</li>
              <li>
                · A client only sees your firm in their dashboard after they
                accept. They can revoke at any time.
              </li>
              <li>
                · You can soft-revoke a client from their detail page — the audit
                trail is preserved.
              </li>
            </ul>
          </Card>
          <Card className="stack g-3" style={{ background: "var(--info-bg)", borderColor: "var(--teal-200)" }}>
            <div className="t-h5" style={{ margin: 0 }}>PIPEDA reminder</div>
            <p className="t-body-sm" style={{ margin: 0, color: "var(--ink-800)" }}>
              OwnWill never auto-links a client to your firm based on email
              match. The client must accept the invitation before their
              documents become visible to your team.
            </p>
          </Card>
        </aside>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .ow-page-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppPage>
  );
}
