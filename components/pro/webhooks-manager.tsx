"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  Copy,
  Plus,
  Power,
  RotateCw,
  Send,
  Trash2,
  Webhook,
  XCircle,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  Textarea,
} from "@/components/ui-kit";
import {
  createWebhook,
  deleteWebhook,
  rotateWebhookSecret,
  setWebhookStatus,
  testWebhook,
} from "@/lib/pro/integrations";

export interface WebhookRow {
  id: string;
  url: string;
  description: string | null;
  events: string[];
  status: "active" | "disabled";
  lastDeliveryAt: string | null;
  lastSuccessAt: string | null;
  consecutiveFailures: number;
  createdAt: string;
  secretMasked: string;
}

export interface DeliveryRow {
  id: string;
  webhookId: string;
  eventType: string;
  attempt: number;
  status: "success" | "failed" | "pending";
  httpStatus: number | null;
  error: string | null;
  deliveredAt: string;
}

const EVENT_OPTIONS = [
  { value: "document.completed", label: "Document completed (client finished a wizard)" },
  { value: "document.generated", label: "Document generated (a fresh PDF was rendered)" },
];

function fmtRel(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h ago`;
  return d.toLocaleDateString("en-CA");
}

export function WebhooksManager({
  rows,
  deliveries,
  canEdit,
}: {
  rows: WebhookRow[];
  deliveries: DeliveryRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [newSecret, setNewSecret] = useState<{ id: string; secret: string } | null>(null);

  function refresh() {
    router.refresh();
  }

  return (
    <div className="stack g-3">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="t-h5" style={{ margin: 0 }}>Endpoints</h3>
        {canEdit && (
          <Button icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
            New endpoint
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <Card padded>
          <p className="t-body-sm muted" style={{ margin: 0 }}>
            No endpoints yet. Add one to start receiving document events.
          </p>
        </Card>
      ) : (
        <div className="stack g-3">
          {rows.map((row) => (
            <WebhookCard
              key={row.id}
              row={row}
              canEdit={canEdit}
              recent={deliveries.filter((d) => d.webhookId === row.id).slice(0, 5)}
              onChange={refresh}
              onRotated={(secret) => setNewSecret({ id: row.id, secret })}
            />
          ))}
        </div>
      )}

      <CreateWebhookModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(secret, id) => {
          setShowCreate(false);
          setNewSecret({ id, secret });
          refresh();
        }}
      />

      <SecretRevealModal
        secret={newSecret?.secret ?? null}
        onClose={() => setNewSecret(null)}
      />
    </div>
  );
}

function WebhookCard({
  row,
  canEdit,
  recent,
  onChange,
  onRotated,
}: {
  row: WebhookRow;
  canEdit: boolean;
  recent: DeliveryRow[];
  onChange: () => void;
  onRotated: (secret: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const flaky = row.consecutiveFailures >= 3;

  function call(fn: () => Promise<{ error: string | null }>, successMsg?: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (successMsg) toast.success(successMsg);
      onChange();
    });
  }

  return (
    <Card className="stack g-3">
      <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div className="stack g-1" style={{ minWidth: 0, flex: 1 }}>
          <div className="row g-2" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <Webhook size={16} />
            <code style={{ wordBreak: "break-all" }}>{row.url}</code>
            <Badge variant={row.status === "active" ? "completed" : "locked"}>
              {row.status === "active" ? "Active" : "Disabled"}
            </Badge>
            {flaky && <Badge variant="locked">Failing</Badge>}
          </div>
          {row.description && (
            <span className="t-caption muted">{row.description}</span>
          )}
          <div className="row g-2" style={{ flexWrap: "wrap" }}>
            {row.events.map((e) => (
              <Badge key={e} variant="info">{e}</Badge>
            ))}
          </div>
          <span className="t-caption muted">
            Secret <code>{row.secretMasked}</code> · Last delivery {fmtRel(row.lastDeliveryAt)} ·
            Last success {fmtRel(row.lastSuccessAt)}
          </span>
        </div>

        {canEdit && (
          <div className="row g-2" style={{ flexWrap: "wrap", height: "fit-content" }}>
            <Button
              variant="outline"
              icon={<Send size={14} />}
              onClick={() =>
                startTransition(async () => {
                  const res = await testWebhook(row.id);
                  if (res.error) {
                    toast.error(res.error);
                    return;
                  }
                  const data = res.data!;
                  if (data.ok) toast.success(`Test delivered (${data.status}).`);
                  else toast.error(`Test failed: ${data.error ?? `HTTP ${data.status ?? "?"}`}`);
                  onChange();
                })
              }
              disabled={pending}
            >
              Test
            </Button>
            <Button
              variant="outline"
              icon={<Power size={14} />}
              onClick={() =>
                call(
                  () => setWebhookStatus(row.id, row.status === "active" ? "disabled" : "active"),
                  row.status === "active" ? "Disabled." : "Enabled.",
                )
              }
              disabled={pending}
            >
              {row.status === "active" ? "Disable" : "Enable"}
            </Button>
            <Button
              variant="outline"
              icon={<RotateCw size={14} />}
              onClick={() =>
                startTransition(async () => {
                  const res = await rotateWebhookSecret(row.id);
                  if (res.error) {
                    toast.error(res.error);
                    return;
                  }
                  onRotated(res.data!.secret);
                  onChange();
                })
              }
              disabled={pending}
            >
              Rotate secret
            </Button>
            <Button
              variant="destructive"
              icon={<Trash2 size={14} />}
              onClick={() => setConfirmDelete(true)}
              disabled={pending}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {recent.length > 0 && (
        <div>
          <span className="t-overline muted">Recent deliveries</span>
          <ul className="stack g-1" style={{ marginTop: 6, listStyle: "none", padding: 0 }}>
            {recent.map((d) => (
              <li key={d.id} className="row g-2" style={{ alignItems: "center", flexWrap: "wrap" }}>
                {d.status === "success" ? (
                  <CheckCircle2 size={14} style={{ color: "var(--success)" }} />
                ) : (
                  <XCircle size={14} style={{ color: "var(--destructive)" }} />
                )}
                <span className="t-caption">{d.eventType}</span>
                <span className="t-caption muted">
                  {d.httpStatus ? `HTTP ${d.httpStatus}` : d.error ? `error: ${d.error}` : ""}
                </span>
                {d.attempt > 1 && (
                  <span className="t-caption muted">attempt {d.attempt}</span>
                )}
                <span className="t-caption muted" style={{ marginLeft: "auto" }}>
                  {fmtRel(d.deliveredAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this webhook?"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmDelete(false);
                call(() => deleteWebhook(row.id), "Webhook removed.");
              }}
            >
              Yes, delete
            </Button>
          </>
        }
      >
        <p className="t-body">
          Future events stop firing immediately. Past delivery history is removed too.
        </p>
      </Modal>
    </Card>
  );
}

function CreateWebhookModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (secret: string, id: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [events, setEvents] = useState<string[]>(EVENT_OPTIONS.map((e) => e.value));
  const [busy, setBusy] = useState(false);

  function toggle(v: string) {
    setEvents((prev) => (prev.includes(v) ? prev.filter((p) => p !== v) : [...prev, v]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await createWebhook({
      url: url.trim(),
      description: description.trim() || undefined,
      events,
    });
    setBusy(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setUrl("");
    setDescription("");
    setEvents(EVENT_OPTIONS.map((e) => e.value));
    onCreated(res.data!.secret, res.data!.id);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a webhook endpoint"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={onSubmit} disabled={busy || url.trim() === ""} loading={busy}>
            {busy ? "Creating…" : "Create endpoint"}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="stack g-3">
        <Field label="Endpoint URL" htmlFor="hook-url" hint="HTTPS only. We'll POST signed JSON here.">
          <Input
            id="hook-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-app.example.com/webhooks/ownwill"
            required
          />
        </Field>
        <Field label="Description (optional)" htmlFor="hook-desc">
          <Textarea
            id="hook-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this endpoint does, who owns it."
            maxLength={200}
            rows={2}
          />
        </Field>
        <Field label="Events" htmlFor="hook-events">
          <div className="stack g-2">
            {EVENT_OPTIONS.map((e) => (
              <label key={e.value} className="row g-2" style={{ alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={events.includes(e.value)}
                  onChange={() => toggle(e.value)}
                />
                <span className="t-body-sm">
                  <code>{e.value}</code> — {e.label.split(" — ")[1] ?? e.label}
                </span>
              </label>
            ))}
          </div>
        </Field>
      </form>
    </Modal>
  );
}

function SecretRevealModal({
  secret,
  onClose,
}: {
  secret: string | null;
  onClose: () => void;
}) {
  function copy() {
    if (!secret) return;
    navigator.clipboard.writeText(secret).then(
      () => toast.success("Secret copied to clipboard."),
      () => toast.error("Could not copy — copy it manually."),
    );
  }

  return (
    <Modal
      open={!!secret}
      onClose={onClose}
      title="Save this signing secret"
      footer={
        <>
          <Button variant="outline" icon={<Copy size={14} />} onClick={copy}>Copy</Button>
          <Button onClick={onClose}>I&apos;ve saved it</Button>
        </>
      }
    >
      <Alert variant="warning" title="Shown only once">
        Store this in your application&apos;s secret manager now. You won&apos;t be able to view
        the plaintext again — only rotate to a fresh one.
      </Alert>
      {secret && (
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
          <code>{secret}</code>
        </pre>
      )}
    </Modal>
  );
}
