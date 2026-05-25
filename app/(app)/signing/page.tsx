"use client";

import { useState } from "react";
import { AlertTriangle, Download, Mail } from "lucide-react";
import { AppPage } from "@/components/app/app-page";
import { useShell } from "@/components/app/shell-context";
import { Alert, Badge, Button, Card } from "@/components/ui-kit";
import { PROVINCE_NAMES, type Province } from "@/types";

export default function SigningPage() {
  const { user } = useShell();
  const code = (user.province || "ON") as Province;
  const province = PROVINCE_NAMES[code] ?? "Ontario";
  const isBC = code === "BC";
  const isQC = code === "QC";
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setChecks((c) => ({ ...c, [k]: !c[k] }));

  const items = isBC
    ? [
        { k: "print", label: "Print or e-sign your will (BC allows electronic signing)" },
        { k: "witness", label: "Sign in front of two adult witnesses (in person or by video)" },
        { k: "non-bene", label: "Witnesses must not be beneficiaries or partners of beneficiaries" },
        { k: "store", label: "Store the signed copy somewhere safe and tell your executor where" },
      ]
    : isQC
      ? [
          { k: "print", label: "Print your will on plain paper" },
          { k: "witness", label: "Sign in front of two adult witnesses who are not beneficiaries" },
          { k: "notarize", label: "Consider visiting a notary for a notarial will (optional in QC)" },
          { k: "store", label: "Store the signed copy somewhere safe and tell your executor where" },
        ]
      : [
          { k: "print", label: "Print your will on plain paper" },
          { k: "witness", label: "Sign in front of two adult witnesses, all in the same room" },
          { k: "non-bene", label: "Witnesses must not be beneficiaries or partners of beneficiaries" },
          { k: "store", label: "Store the signed copy somewhere safe and tell your executor where" },
        ];

  const done = items.filter((i) => checks[i.k]).length;

  const rail = (
    <div className="stack g-4">
      <Card className="stack g-3">
        <div className="t-overline muted">Your province</div>
        <div className="t-h4" style={{ margin: 0 }}>{province}</div>
        <div className="t-body-sm muted">We&apos;ve tailored these steps to your province&apos;s rules.</div>
        {isBC && <Badge variant="completed">E-signing allowed</Badge>}
      </Card>
      <Card className="stack g-3">
        <div className="t-h5">Email yourself</div>
        <div className="t-body-sm muted">A copy of the checklist plus a printable PDF.</div>
        <Button variant="outline" size="sm" icon={<Mail size={14} />} style={{ alignSelf: "flex-start" }}>Send</Button>
      </Card>
      <Card className="stack g-3" style={{ background: "var(--warning-bg)", borderColor: "color-mix(in oklab, var(--warning) 30%, var(--border))" }}>
        <div className="row g-2"><AlertTriangle size={18} style={{ color: "var(--warning)" }} /><div className="t-h5" style={{ margin: 0 }}>Two-witness rule</div></div>
        <div className="t-body-sm">Witnesses must be 18+ and cannot inherit anything in your will (or be partners of beneficiaries).</div>
      </Card>
    </div>
  );

  return (
    <AppPage breadcrumb="Last Will & Testament" title="Make it official." actions={<Button variant="outline" size="sm" icon={<Download size={14} />}>Download PDF</Button>} rail={rail} narrow>
      <p className="t-body muted mb-6" style={{ maxWidth: "62ch" }}>
        Follow these steps carefully — they&apos;re what make your will legally valid in {province}.
      </p>

      {isBC && (
        <Alert variant="success" title="Good news, British Columbians" className="mb-6">
          BC is the only province that allows fully electronic wills. You may e-sign via the link we emailed you.
        </Alert>
      )}

      <Card className="stack g-3">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="t-h4">Checklist</div>
          <span className="t-body-sm muted">{done}/{items.length} done</span>
        </div>
        <div className="stack">
          {items.map((it) => (
            <label key={it.k} className="row g-3" style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
              <input type="checkbox" className="checkbox" checked={!!checks[it.k]} onChange={() => toggle(it.k)} style={{ marginTop: 2 }} />
              <span className={"t-body " + (checks[it.k] ? "muted" : "")} style={{ textDecoration: checks[it.k] ? "line-through" : "none", flex: 1 }}>{it.label}</span>
            </label>
          ))}
        </div>
      </Card>
    </AppPage>
  );
}
