"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Lock, Shield, Sparkles } from "lucide-react";
import { AppPage } from "@/components/app/app-page";
import { useShell } from "@/components/app/shell-context";
import { Button, Card, Field, Input } from "@/components/ui-kit";
import { LeafMark } from "@/components/brand/logo";
import { completeWillPurchase } from "@/app/(app)/actions";

const PLANS: Record<string, { name: string; price: number }> = {
  essentials: { name: "Essentials", price: 129 },
  premium: { name: "Premium", price: 199 },
  premium_x2: { name: "Premium ×2", price: 299 },
};

const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})/g, "$1 ").trim();
const formatExp = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length <= 2 ? d : d.slice(0, 2) + "/" + d.slice(2);
};

export default function PaymentPage() {
  const router = useRouter();
  const { user } = useShell();
  const [plan, setPlan] = useState<string>(user.plan === "none" ? "premium" : user.plan);
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState(user.fullName);
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const chosen = PLANS[plan];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (card.replace(/\s/g, "").length < 16) errs.card = "Enter a valid card number.";
    if (exp.length < 5) errs.exp = "MM/YY please.";
    if (cvc.length < 3) errs.cvc = "3-digit CVC.";
    if (!name.trim()) errs.name = "Name on card.";
    if (!zip.trim()) errs.zip = "Postal code.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    // TEST MODE — no real charge. Activate the plan + mark the will generated.
    const { error } = await completeWillPurchase(plan as "essentials" | "premium" | "premium_x2");
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Payment successful — generating your will.");
    router.push("/download");
  }

  return (
    <AppPage breadcrumb="Last Will & Testament" title="Almost there." actions={<Button variant="outline" size="sm" href="/review" icon={<ArrowLeft size={14} />}>Back to review</Button>} bare>
      <div className="payment-split">
        <aside className="payment-trust">
          <div className="payment-trust-inner stack g-6">
            <div>
              <div className="t-overline" style={{ color: "var(--coral-300)" }}>Pay once. Updates for life.</div>
              <h2 className="t-h2 mt-2" style={{ color: "#F0FAF9", textWrap: "balance" }}>Your will, ready in moments.</h2>
            </div>
            <ul className="stack g-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[
                { icon: <Shield />, label: "30-day money-back guarantee", body: "If it's not right for you, we refund." },
                { icon: <Lock />, label: "Secured by Stripe", body: "We never see or store your card details." },
                { icon: <Sparkles />, label: "Free updates for life", body: "Life changes — your will should too." },
              ].map((t, i) => (
                <li key={i} className="row g-3" style={{ alignItems: "flex-start" }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#F0FAF9", flex: "none" }}>{t.icon}</span>
                  <span>
                    <div style={{ color: "#F0FAF9", fontWeight: 600, fontSize: 15 }}>{t.label}</div>
                    <div className="t-body-sm" style={{ color: "rgba(240,250,249,.7)" }}>{t.body}</div>
                  </span>
                </li>
              ))}
            </ul>
            <blockquote style={{ margin: 0, padding: 16, background: "rgba(255,255,255,.06)", borderLeft: "3px solid var(--coral-400)", borderRadius: "0 8px 8px 0" }}>
              <div className="t-body" style={{ color: "#F0FAF9", textWrap: "pretty" }}>&ldquo;I started three different times and never finished. With OwnWill, I did it in one afternoon.&rdquo;</div>
              <div className="t-caption mt-2" style={{ color: "rgba(240,250,249,.7)" }}>Maya R. — Toronto</div>
            </blockquote>
          </div>
          <div style={{ position: "absolute", right: -40, bottom: -40, opacity: 0.12 }}>
            <LeafMark size={260} color="#F0FAF9" accent="var(--coral-400)" />
          </div>
        </aside>

        <section className="payment-form">
          <div className="payment-form-inner stack g-6">
            <div className="grid g-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {Object.entries(PLANS).map(([id, p]) => (
                <button key={id} type="button" onClick={() => setPlan(id)} className="card focusable" style={{ padding: 16, textAlign: "left", borderWidth: plan === id ? 2 : 1, borderColor: plan === id ? "var(--primary)" : "var(--border)", cursor: "pointer", background: "var(--card)" }}>
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                    <span className="t-body-sm" style={{ fontWeight: 600 }}>{p.name}</span>
                    <input type="radio" className="radio" checked={plan === id} readOnly />
                  </div>
                  <div className="t-h4">${p.price}</div>
                  <div className="t-caption muted">CAD one-time</div>
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="stack g-4">
              <Card className="stack g-4">
                <div className="t-h4">Card details</div>
                <Field label="Card number" error={errors.card}>
                  <Input value={card} onChange={(e) => setCard(formatCard(e.target.value))} placeholder="1234 5678 9012 3456" leadingIcon={<CreditCard size={16} />} inputMode="numeric" />
                </Field>
                <div className="grid g-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <Field label="Expiry" error={errors.exp}>
                    <Input value={exp} onChange={(e) => setExp(formatExp(e.target.value))} placeholder="MM/YY" inputMode="numeric" />
                  </Field>
                  <Field label="CVC" error={errors.cvc}>
                    <Input value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" inputMode="numeric" />
                  </Field>
                </div>
                <Field label="Name on card" error={errors.name}>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Postal code" error={errors.zip}>
                  <Input value={zip} onChange={(e) => setZip(e.target.value.toUpperCase())} placeholder="M5V 2T6" />
                </Field>
              </Card>

              <Card className="stack g-3">
                <div className="t-h5">Order summary</div>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="t-body-sm">{chosen.name} plan</span>
                  <span className="t-body-sm">${chosen.price}.00</span>
                </div>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="t-body-sm muted">Free updates for life</span>
                  <span className="t-body-sm muted">$0</span>
                </div>
                <hr className="hr" />
                <div className="row" style={{ justifyContent: "space-between", fontWeight: 600, fontSize: 18 }}>
                  <span>Total</span>
                  <span>${chosen.price}.00 CAD</span>
                </div>
              </Card>

              <Button type="submit" size="lg" className="btn-block" loading={loading}>
                {loading ? "Processing…" : `Pay $${chosen.price}`}
              </Button>
              <div className="row g-2 t-caption muted" style={{ justifyContent: "center" }}>
                <Lock size={12} /> Secured by Stripe · By paying you agree to our Terms.
              </div>
            </form>
          </div>
        </section>
      </div>

      <style>{`
        .payment-split { display: grid; grid-template-columns: 1fr 1.2fr; min-height: calc(100vh - 64px); }
        .payment-trust { position: relative; overflow: hidden; background: linear-gradient(160deg, var(--teal-800) 0%, var(--teal-900) 100%); color: #F0FAF9; }
        .dark .payment-trust { background: linear-gradient(160deg, #0a2422 0%, #061211 100%); }
        .payment-trust-inner { padding: 48px; max-width: 540px; margin-left: auto; position: relative; z-index: 1; }
        .payment-form { background: var(--background); }
        .payment-form-inner { padding: 48px; max-width: 640px; }
        @media (max-width: 1100px) {
          .payment-split { grid-template-columns: 1fr; }
          .payment-trust-inner { max-width: none; padding: 32px; }
          .payment-form-inner { max-width: none; padding: 32px; margin: 0 auto; }
        }
      `}</style>
    </AppPage>
  );
}
