import { ArrowRight, Check, CreditCard, FileText, Heart, Lock, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppPage } from "@/components/app/app-page";
import { Badge, Button, Card } from "@/components/ui-kit";

type Status = "not_started" | "in_progress" | "completed" | "paid" | "generated";

const DATA_TABLE: Record<string, string> = {
  will: "will_data",
  poa_health: "poa_health_data",
  poa_property: "poa_property_data",
  asset_list: "asset_list_data",
};

const META = [
  { type: "will", title: "Last Will & Testament", blurb: "Decide who inherits, who looks after your kids, and who runs things.", icon: <FileText size={28} />, bg: "var(--teal-100)", fg: "var(--teal-800)", premium: false, href: "/will" },
  { type: "poa_property", title: "Power of Attorney — Property", blurb: "Who handles your money if you're ever unable to.", icon: <CreditCard size={28} />, bg: "var(--coral-100)", fg: "var(--coral-700)", premium: true, href: "/poa-property" },
  { type: "poa_health", title: "Power of Attorney — Health", blurb: "Medical wishes and a trusted decision-maker.", icon: <Heart size={28} />, bg: "var(--sand-100)", fg: "var(--ink-800)", premium: true, href: "/poa-health" },
  { type: "asset_list", title: "Asset List", blurb: "A living document so your people know what you have.", icon: <Shield size={28} />, bg: "var(--teal-100)", fg: "var(--teal-800)", premium: true, href: "/assets" },
];

function StatusBadge({ status, locked }: { status: Status; locked: boolean }) {
  if (locked) return <Badge variant="locked" icon={<Lock size={12} />}>Locked</Badge>;
  if (status === "not_started") return <Badge variant="draft">Not started</Badge>;
  if (status === "in_progress") return <Badge variant="draft">In progress</Badge>;
  if (status === "completed") return <Badge variant="completed" icon={<Check size={12} />}>Ready to review</Badge>;
  return <Badge variant="paid" icon={<Check size={12} />}>{status === "generated" ? "Generated" : "Paid"}</Badge>;
}

function action(type: string, status: Status, locked: boolean) {
  if (locked) return { label: "Upgrade", href: "/billing" };
  if (type === "will") {
    if (status === "not_started") return { label: "Start", href: "/will" };
    if (status === "in_progress") return { label: "Continue", href: "/will" };
    if (status === "completed") return { label: "Review", href: "/review" };
    return { label: "View & download", href: "/documents/will" };
  }
  const base = META.find((m) => m.type === type)!.href;
  if (status === "not_started") return { label: "Start", href: base };
  if (status === "completed" || status === "paid" || status === "generated") return { label: "View & download", href: `/documents/${type}` };
  return { label: "Continue", href: base };
}

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: docs }] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", user!.id).maybeSingle(),
    supabase.from("documents").select("id, type, status").eq("user_id", user!.id).eq("is_current", true),
  ]);

  const isPremium = profile?.plan === "premium" || profile?.plan === "premium_x2";
  const byType = new Map<string, { id: string; status: string }>();
  (docs ?? []).forEach((d) => byType.set(d.type as string, { id: d.id as string, status: d.status as string }));

  // progress per existing doc
  const progress = new Map<string, number>();
  await Promise.all(
    [...byType.entries()].map(async ([type, d]) => {
      const { data: row } = await supabase
        .from(DATA_TABLE[type])
        .select("current_step, total_steps")
        .eq("document_id", d.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (row?.total_steps) progress.set(type, Math.round(((row.current_step ?? 1) / row.total_steps) * 100));
    }),
  );

  return (
    <AppPage breadcrumb="Documents" title="My documents" wide>
      <p className="t-body muted" style={{ marginTop: -8, marginBottom: 24 }}>
        Everything in one place. Your progress saves automatically — pick up any document where you left off.
      </p>

      <div className="grid g-4 docs-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        {META.map((m) => {
          const existing = byType.get(m.type);
          const rawStatus = existing?.status as string | undefined;
          const status: Status = !rawStatus ? "not_started" : rawStatus === "draft" ? "in_progress" : (rawStatus as Status);
          const locked = m.premium && !isPremium;
          const a = action(m.type, status, locked);
          const pct = progress.get(m.type);
          return (
            <Card key={m.type} className="stack g-3" style={{ height: "100%" }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: m.bg, color: m.fg, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{m.icon}</div>
                <StatusBadge status={status} locked={locked} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="t-h5">{m.title}</div>
                <div className="t-body-sm muted mt-1">{m.blurb}</div>
              </div>
              {!locked && status === "in_progress" && typeof pct === "number" && (
                <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
              )}
              <Button href={a.href} variant={locked ? "outline" : "primary"} size="sm" iconRight={locked ? undefined : <ArrowRight size={14} />} icon={locked ? <Lock size={14} /> : undefined} style={{ alignSelf: "flex-start" }}>
                {a.label}
              </Button>
            </Card>
          );
        })}
      </div>

      {!isPremium && (
        <Card className="row g-4 mt-6" style={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", background: "var(--coral-50)", borderColor: "var(--coral-200)" }}>
          <div>
            <div className="t-h5">Unlock the full set</div>
            <div className="t-body-sm muted">Premium adds both Powers of Attorney and your Asset List.</div>
          </div>
          <Button href="/billing">Upgrade</Button>
        </Card>
      )}

      <style>{`@media (max-width: 760px) { .docs-grid { grid-template-columns: 1fr !important; } }`}</style>
    </AppPage>
  );
}
