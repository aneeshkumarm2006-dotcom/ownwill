"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Key, Plus, Trash2 } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
} from "@/components/ui-kit";
import { createApiKey, revokeApiKey } from "@/lib/pro/integrations";

export interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

function fmtRel(iso: string | null): string {
  if (!iso) return "Never used";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h ago`;
  return d.toLocaleDateString("en-CA");
}

export function ApiKeysManager({
  rows,
  canEdit,
}: {
  rows: ApiKeyRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<ApiKeyRow | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="stack g-3">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="t-h5" style={{ margin: 0 }}>Keys</h3>
        {canEdit && (
          <Button icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
            New API key
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <Card padded>
          <p className="t-body-sm muted" style={{ margin: 0 }}>
            No keys yet. Generate one to start pulling client data into your CRM.
          </p>
        </Card>
      ) : (
        <Card padded={false} style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--muted)" }}>
                <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Name</th>
                <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Token</th>
                <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Scopes</th>
                <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Last used</th>
                <th className="t-body-sm" style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const revoked = !!r.revokedAt;
                return (
                  <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: 12 }}>
                      <div className="row g-2" style={{ alignItems: "center" }}>
                        <Key size={14} />
                        <span className="t-body-sm" style={{ fontWeight: 600 }}>{r.name}</span>
                      </div>
                      <span className="t-caption muted">Created {fmtDate(r.createdAt)}</span>
                    </td>
                    <td className="t-body-sm" style={{ padding: 12 }}>
                      <code>{r.prefix}…</code>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div className="row g-1" style={{ flexWrap: "wrap" }}>
                        {r.scopes.map((s) => <Badge key={s} variant="info">{s}</Badge>)}
                      </div>
                    </td>
                    <td className="t-caption" style={{ padding: 12 }}>{fmtRel(r.lastUsedAt)}</td>
                    <td style={{ padding: 12 }}>
                      <Badge variant={revoked ? "locked" : "completed"}>
                        {revoked ? "Revoked" : "Active"}
                      </Badge>
                    </td>
                    <td style={{ padding: 12 }}>
                      {canEdit && !revoked && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Trash2 size={12} />}
                          onClick={() => setConfirmRevoke(r)}
                          disabled={pending}
                        >
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <CreateKeyModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(plaintext) => {
          setShowCreate(false);
          setNewKey(plaintext);
          router.refresh();
        }}
      />

      <KeyRevealModal token={newKey} onClose={() => setNewKey(null)} />

      <Modal
        open={!!confirmRevoke}
        onClose={() => setConfirmRevoke(null)}
        title="Revoke this API key?"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmRevoke(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                const target = confirmRevoke;
                setConfirmRevoke(null);
                if (!target) return;
                startTransition(async () => {
                  const res = await revokeApiKey(target.id);
                  if (res.error) {
                    toast.error(res.error);
                    return;
                  }
                  toast.success("Key revoked.");
                  router.refresh();
                });
              }}
            >
              Yes, revoke
            </Button>
          </>
        }
      >
        <p className="t-body">
          Any integration using <code>{confirmRevoke?.prefix}…</code> will stop working immediately.
        </p>
      </Modal>
    </div>
  );
}

function CreateKeyModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (plaintext: string) => void;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await createApiKey(name.trim());
    setBusy(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setName("");
    onCreated(res.data!.plaintext);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create an API key"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={onSubmit} disabled={busy || name.trim().length === 0} loading={busy}>
            {busy ? "Generating…" : "Generate key"}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="stack g-3">
        <Field label="Name" htmlFor="key-name" hint="What you'll see in the list — typically the system that uses it (CRM, internal app)." >
          <Input
            id="key-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="HubSpot sync"
            maxLength={80}
            required
          />
        </Field>
        <p className="t-caption muted" style={{ margin: 0 }}>
          Keys get the <code>read</code> scope — they can list clients and documents but never mutate
          your org. Rotate by revoking and creating a fresh key.
        </p>
      </form>
    </Modal>
  );
}

function KeyRevealModal({
  token,
  onClose,
}: {
  token: string | null;
  onClose: () => void;
}) {
  function copy() {
    if (!token) return;
    navigator.clipboard.writeText(token).then(
      () => toast.success("Key copied to clipboard."),
      () => toast.error("Could not copy — copy it manually."),
    );
  }

  return (
    <Modal
      open={!!token}
      onClose={onClose}
      title="Save this API key now"
      footer={
        <>
          <Button variant="outline" icon={<Copy size={14} />} onClick={copy}>Copy</Button>
          <Button onClick={onClose}>I&apos;ve saved it</Button>
        </>
      }
    >
      <Alert variant="warning" title="Shown only once">
        Store it in your secrets manager now. You won&apos;t be able to view the plaintext again —
        if it&apos;s lost, revoke and create a new one.
      </Alert>
      {token && (
        <pre
          style={{
            marginTop: 12,
            padding: 12,
            background: "var(--muted)",
            borderRadius: 6,
            wordBreak: "break-all",
            whiteSpace: "pre-wrap",
          }}
        >
          <code>{token}</code>
        </pre>
      )}
    </Modal>
  );
}
