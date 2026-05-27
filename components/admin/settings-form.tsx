"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui-kit";
import { updateSetting } from "@/app/admin/(authed)/settings/actions";
import type { SettingsMap } from "@/lib/admin/settings";

export function SettingsForm({ initial }: { initial: SettingsMap }) {
  const router = useRouter();
  const [supportEmail, setSupportEmail] = useState(initial.support_email);
  const [legalDisclaimer, setLegalDisclaimer] = useState(initial.legal_disclaimer);
  const [maintenance, setMaintenance] = useState(initial.maintenance_mode);
  const [pending, start] = useTransition();

  function save<T>(key: "support_email" | "legal_disclaimer" | "maintenance_mode", value: T, label: string) {
    start(async () => {
      const r = await updateSetting({ key, value });
      if (r.error) toast.error(r.error);
      else {
        toast.success(`${label} saved.`);
        router.refresh();
      }
    });
  }

  return (
    <div className="stack g-4">
      <div className="stack g-2">
        <label className="field-label" htmlFor="support-email">Support email</label>
        <div className="row g-2" style={{ flexWrap: "wrap" }}>
          <input
            id="support-email"
            className="input"
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            style={{ flex: "1 1 280px", minWidth: 240 }}
            disabled={pending}
          />
          <Button
            icon={<Save size={16} />}
            disabled={pending || supportEmail === initial.support_email}
            onClick={() => save("support_email", supportEmail, "Support email")}
          >
            Save
          </Button>
        </div>
        <p className="t-caption muted">Shown on the support page and used as reply-to for system emails.</p>
      </div>

      <div className="stack g-2">
        <label className="field-label" htmlFor="legal-disclaimer">Legal disclaimer</label>
        <textarea
          id="legal-disclaimer"
          className="textarea"
          rows={4}
          value={legalDisclaimer}
          onChange={(e) => setLegalDisclaimer(e.target.value)}
          disabled={pending}
        />
        <div className="row g-2">
          <Button
            icon={<Save size={16} />}
            disabled={pending || legalDisclaimer === initial.legal_disclaimer}
            onClick={() => save("legal_disclaimer", legalDisclaimer, "Disclaimer")}
          >
            Save
          </Button>
          <span className="t-caption muted" style={{ alignSelf: "center" }}>
            {legalDisclaimer.length} / 4000 chars
          </span>
        </div>
        <p className="t-caption muted">Appears in document footers and the legal disclaimer page.</p>
      </div>

      <div className="stack g-2">
        <label className="field-label">Maintenance mode</label>
        <div className="row g-2" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <label className="row g-2" style={{ alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={maintenance}
              onChange={(e) => setMaintenance(e.target.checked)}
              disabled={pending}
            />
            <span className="t-body-sm">{maintenance ? "ON — customer routes blocked" : "OFF — site is live"}</span>
          </label>
          <Button
            icon={<Save size={16} />}
            disabled={pending || maintenance === initial.maintenance_mode}
            onClick={() => save("maintenance_mode", maintenance, "Maintenance mode")}
          >
            Save
          </Button>
        </div>
        <p className="t-caption muted">
          When ON, customer-facing pages show a maintenance banner. Admin remains accessible.
          (Flag is stored — proxy enforcement ships with the next hardening chunk.)
        </p>
      </div>
    </div>
  );
}
