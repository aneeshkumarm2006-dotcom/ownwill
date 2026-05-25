"use client";

import { Check } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui-kit";
import { cls } from "@/lib/cls";

const PLANS = [
  { id: "essentials", name: "Essentials", price: 129, blurb: "Just the will.", features: ["Last Will & Testament", "Step-by-step wizard", "Free updates for life", "Email support"] },
  { id: "premium", name: "Premium", price: 199, popular: true, blurb: "Everything most families need.", features: ["Everything in Essentials", "Power of Attorney — Property", "Power of Attorney — Health", "Asset List", "Province-specific signing"] },
  { id: "premium_x2", name: "Premium ×2", price: 299, blurb: "Both partners, one price.", features: ["Premium for two adults", "Linked spouse profile", "Identical mirror wills if you wish", "Priority support"] },
];

export function PricingCards({ onChoose }: { onChoose?: (id: string) => void }) {
  return (
    <div className="grid pricing-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, alignItems: "stretch" }}>
      {PLANS.map((p) => (
        <Card key={p.id} className={cls("stack g-4", p.popular && "pop-card")}>
          {p.popular && <Badge variant="new" style={{ alignSelf: "flex-start" }}>Most popular</Badge>}
          <div>
            <div className="t-h4">{p.name}</div>
            <div className="t-body-sm muted">{p.blurb}</div>
          </div>
          <div className="row" style={{ alignItems: "baseline", gap: 6 }}>
            <span className="t-h2">${p.price}</span>
            <span className="t-body-sm muted">CAD one-time</span>
          </div>
          <ul className="stack g-2" style={{ listStyle: "none", padding: 0, margin: 0, flex: 1 }}>
            {p.features.map((f) => (
              <li key={f} className="row g-2 t-body-sm">
                <Check size={16} style={{ color: "var(--primary)", flex: "none" }} />
                {f}
              </li>
            ))}
          </ul>
          {onChoose ? (
            <Button variant={p.popular ? "primary" : "outline"} onClick={() => onChoose(p.id)}>
              Choose {p.name}
            </Button>
          ) : (
            <Button variant={p.popular ? "primary" : "outline"} href="/signup">
              Choose {p.name}
            </Button>
          )}
        </Card>
      ))}
      <style>{`@media (max-width: 900px) { .pricing-grid { grid-template-columns: 1fr !important; } .pop-card { transform: none !important; } }`}</style>
    </div>
  );
}
