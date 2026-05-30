"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Upload, UserPlus } from "lucide-react";
import { Alert, Badge, Button, Card, Field, Input, Textarea } from "@/components/ui-kit";
import { inviteClient, inviteClientsBulk } from "@/lib/pro/actions";

type Tab = "single" | "bulk";

interface BulkRow {
  email: string;
  reason: string;
}

interface BulkSummary {
  sent: number;
  skipped: BulkRow[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Parses a CSV / newline-delimited blob of emails. Tolerant: handles commas,
 * semicolons, newlines, optional headers, and quoted cells. The bulk server
 * action does its own normalization + dedupe, so this client-side parse just
 * has to surface a clean list for the preview.
 */
function parseEmails(raw: string): string[] {
  if (!raw.trim()) return [];
  const tokens = raw
    .split(/[\s,;]+/)
    .map((t) => t.replace(/^"|"$/g, "").trim())
    .filter(Boolean);
  // Drop a leading "email" header if someone pasted a CSV with one.
  if (tokens.length > 0 && /^email(s)?$/i.test(tokens[0])) tokens.shift();
  return tokens;
}

export function InviteClientsForm({ orgName }: { orgName: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("single");

  // Single-invite state
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  // Bulk state
  const [csvText, setCsvText] = useState("");
  const [bulkSending, setBulkSending] = useState(false);
  const [summary, setSummary] = useState<BulkSummary | null>(null);

  const parsed = parseEmails(csvText);
  const validCount = parsed.filter((e) => EMAIL_RE.test(e)).length;
  const invalidCount = parsed.length - validCount;

  async function handleSingle(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      toast.error("Please enter a valid email.");
      return;
    }
    setSending(true);
    const res = await inviteClient({ email: clean });
    setSending(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(`Invitation sent to ${clean}.`);
    setEmail("");
    router.refresh();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large (max 2 MB).");
      e.target.value = "";
      return;
    }
    const text = await file.text();
    setCsvText(text);
    setSummary(null);
    e.target.value = "";
  }

  async function handleBulkSubmit() {
    if (parsed.length === 0) {
      toast.error("Add at least one email to send.");
      return;
    }
    setBulkSending(true);
    setSummary(null);
    const res = await inviteClientsBulk({ emails: parsed });
    setBulkSending(false);
    if (res.error || !res.data) {
      toast.error(res.error ?? "Bulk invite failed.");
      return;
    }
    setSummary(res.data);
    if (res.data.sent > 0) {
      toast.success(`Sent ${res.data.sent} invitation${res.data.sent === 1 ? "" : "s"}.`);
    } else {
      toast.message("No invites sent — see the summary for why.");
    }
    setCsvText("");
    router.refresh();
  }

  return (
    <div className="stack g-4">
      <div className="row g-1" role="tablist" aria-label="Invite mode">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "single"}
          className={`btn btn-sm ${tab === "single" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("single")}
        >
          One at a time
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "bulk"}
          className={`btn btn-sm ${tab === "bulk" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("bulk")}
        >
          CSV upload
        </button>
      </div>

      {tab === "single" ? (
        <Card padded className="stack g-4">
          <form onSubmit={handleSingle} className="stack g-4">
            <Field
              label="Client email"
              htmlFor="client-email"
              hint={`They'll get a link to start their will under ${orgName}. The link expires in 14 days.`}
            >
              <Input
                id="client-email"
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="client@example.com"
                leadingIcon={<Mail size={16} />}
                autoComplete="off"
              />
            </Field>
            <Button
              type="submit"
              icon={<UserPlus size={16} />}
              loading={sending}
              disabled={sending}
              style={{ alignSelf: "flex-start" }}
            >
              {sending ? "Sending…" : "Send invitation"}
            </Button>
          </form>
        </Card>
      ) : (
        <Card padded className="stack g-4">
          <div className="stack g-2">
            <span className="field-label">Upload a CSV or paste emails</span>
            <p className="t-body-sm muted" style={{ margin: 0 }}>
              One email per line, or comma-separated. A header row labeled &quot;email&quot; is
              accepted. We dedupe against pending invites and current clients before
              sending. Max 2 MB.
            </p>
            <div className="row g-2" style={{ flexWrap: "wrap" }}>
              <label className="btn btn-outline">
                <Upload size={16} />
                <span>Choose CSV file</span>
                <input
                  type="file"
                  accept=".csv,.txt,text/csv,text/plain"
                  onChange={handleFile}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>

          <Textarea
            value={csvText}
            onChange={(ev) => setCsvText(ev.target.value)}
            placeholder={"client1@example.com\nclient2@example.com\nclient3@example.com"}
            rows={8}
          />

          {parsed.length > 0 && (
            <div className="row g-2" style={{ flexWrap: "wrap" }}>
              <Badge variant="info">{validCount} valid</Badge>
              {invalidCount > 0 && <Badge variant="locked">{invalidCount} invalid</Badge>}
              <Badge variant="draft">{parsed.length} parsed</Badge>
            </div>
          )}

          <div className="row g-2">
            <Button
              icon={<UserPlus size={16} />}
              onClick={handleBulkSubmit}
              loading={bulkSending}
              disabled={bulkSending || validCount === 0}
            >
              {bulkSending
                ? "Sending…"
                : `Send ${validCount || ""} invitation${validCount === 1 ? "" : "s"}`.trim()}
            </Button>
            {csvText && (
              <Button variant="ghost" onClick={() => setCsvText("")} disabled={bulkSending}>
                Clear
              </Button>
            )}
          </div>

          {summary && (
            <Alert
              variant={summary.sent > 0 ? "success" : "warning"}
              title={`Sent ${summary.sent} · skipped ${summary.skipped.length}`}
            >
              {summary.skipped.length === 0 ? (
                <p style={{ margin: 0 }}>
                  All invitations were sent successfully.
                </p>
              ) : (
                <div className="stack g-2">
                  <p style={{ margin: 0 }}>The following rows were skipped:</p>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 20,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    {summary.skipped.map((r, i) => (
                      <li key={`${r.email}-${i}`}>
                        <code>{r.email}</code> — {r.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Alert>
          )}
        </Card>
      )}
    </div>
  );
}
