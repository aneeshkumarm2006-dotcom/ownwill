"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Info, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useShell } from "@/components/app/shell-context";
import { Button, Card, Field, Input, Textarea } from "@/components/ui-kit";
import { Dropdown } from "@/components/ui/dropdown";
import { PROVINCE_OPTIONS, type Province } from "@/types";

/**
 * Customer profile edit form. Wrapped by the server page so we can render
 * server-loaded sections (firm access, history) alongside without losing the
 * client-side state of the form itself.
 */
export function ProfileForm() {
  const { user } = useShell();
  const [name, setName] = useState(user.fullName);
  const [province, setProvince] = useState<string>(user.province);
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name, province, address })
        .eq("id", u.id);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    toast.success("Profile saved.");
  }

  return (
    <form onSubmit={save} className="stack g-4">
      <Card className="stack g-4">
        <div className="t-h4">Personal</div>
        <Field label="Full legal name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email" required>
          <Input type="email" value={user.email} readOnly />
        </Field>
        <Field label="Province" required hint="Your will follows your province's rules.">
          <Dropdown
            value={province}
            onChange={(v) => setProvince(v as Province)}
            options={PROVINCE_OPTIONS}
            placeholder="Choose…"
          />
        </Field>
        <Field label="Home address" hint="Used on your will. Stored encrypted.">
          <Textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={"123 Maple St, Apt 4\nToronto, ON M5V 2T6"}
          />
        </Field>
      </Card>
      <Card className="stack g-3">
        <div className="t-h4">Your data</div>
        <p className="t-body-sm muted">
          Export everything we hold about you — including which firm (if any)
          has access — or delete your account.
        </p>
        <div className="row g-3" style={{ flexWrap: "wrap" }}>
          <Button
            variant="outline"
            href="/api/account/export"
            icon={<Download size={16} />}
          >
            Export my data
          </Button>
          <Button
            variant="ghost"
            type="button"
            style={{ color: "var(--destructive)" }}
            icon={<Trash2 size={16} />}
          >
            Delete account
          </Button>
        </div>
      </Card>
      <Button type="submit" size="lg" loading={saving} style={{ alignSelf: "flex-start" }}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

export function ProfileRail() {
  return (
    <div className="stack g-4">
      <Card className="stack g-3">
        <div className="t-h5">Why we ask</div>
        <div className="t-body-sm muted">
          Your legal name appears on every document. Your province determines which signing
          rules we use.
        </div>
      </Card>
      <Card
        className="stack g-3"
        style={{ background: "var(--info-bg)", borderColor: "var(--teal-200)" }}
      >
        <div className="row g-2">
          <Info size={18} style={{ color: "var(--info)" }} />
          <div className="t-h5" style={{ margin: 0 }}>Encrypted</div>
        </div>
        <div className="t-body-sm" style={{ color: "var(--ink-800)" }}>
          Your data is encrypted at rest and in transit. You can export or delete it any time.
        </div>
      </Card>
    </div>
  );
}
