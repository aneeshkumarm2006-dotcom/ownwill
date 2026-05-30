"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Briefcase, ShieldCheck, Trash2 } from "lucide-react";
import { Button, Card, Modal } from "@/components/ui-kit";
import { revokeOwnFirmAccess } from "@/lib/pro/actions";

interface Props {
  orgName: string;
  acceptedAt: string | null;
  events: { actorEmail: string; action: string; createdAt: string }[];
}

const ACTION_LABEL: Record<string, string> = {
  "pro.client.view": "viewed your record",
  "pro.client.edit": "edited your notes",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Customer-side panel that shows which firm is managing the account, the
 * one-click revoke button, and the recent staff-view history. Mounted on the
 * profile page only when the user has an active organization_clients row.
 */
export function FirmAccessCard({ orgName, acceptedAt, events }: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, start] = useTransition();

  function handleRevoke() {
    setConfirmOpen(false);
    start(async () => {
      const res = await revokeOwnFirmAccess();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${orgName} can no longer access your account.`);
      router.refresh();
    });
  }

  return (
    <>
      <Card className="stack g-4">
        <div className="row g-2">
          <Briefcase size={18} style={{ color: "var(--teal-700)" }} />
          <div className="t-h4" style={{ margin: 0 }}>Firm access</div>
        </div>
        <div className="stack g-2">
          <div className="row g-2" style={{ alignItems: "center" }}>
            <ShieldCheck size={16} style={{ color: "var(--success)" }} />
            <span className="t-body">
              <strong>{orgName}</strong> is currently managing your account.
            </span>
          </div>
          <span className="t-caption muted">
            Granted access on {fmtDate(acceptedAt)}.
          </span>
        </div>

        <p className="t-body-sm muted" style={{ margin: 0 }}>
          You stay in control. Your documents are yours — revoking access only stops the firm
          from seeing or editing them. The firm&apos;s audit trail of past actions is preserved.
        </p>

        <Button
          variant="destructive"
          icon={<Trash2 size={16} />}
          onClick={() => setConfirmOpen(true)}
          disabled={pending}
          style={{ alignSelf: "flex-start" }}
        >
          {pending ? "Removing…" : `Remove ${orgName} access`}
        </Button>

        {events.length > 0 && (
          <div className="stack g-2">
            <div className="t-h5" style={{ marginBottom: 0 }}>Recent staff activity</div>
            <p className="t-caption muted" style={{ margin: 0 }}>
              Every time someone at the firm opens your record, we log it here.
            </p>
            <ul className="stack g-1 t-body-sm" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {events.slice(0, 8).map((e, i) => (
                <li
                  key={`${e.createdAt}-${i}`}
                  className="row g-2"
                  style={{
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderTop: i === 0 ? "1px solid var(--border)" : "none",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span>
                    <strong>{e.actorEmail || "Firm staff"}</strong>{" "}
                    <span className="muted">{ACTION_LABEL[e.action] ?? e.action}</span>
                  </span>
                  <span className="t-caption muted" style={{ whiteSpace: "nowrap" }}>
                    {fmtDate(e.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Remove ${orgName} access?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevoke}>
              Yes, remove access
            </Button>
          </>
        }
      >
        <p className="t-body">
          <strong>{orgName}</strong> will no longer be able to view or edit your documents.
          Your will, POAs, and asset list stay exactly as they are. If you change your mind,
          the firm will need to send a new invitation.
        </p>
      </Modal>
    </>
  );
}
