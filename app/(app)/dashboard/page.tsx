import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Check,
  ChevronRight,
  CreditCard,
  FileText,
  Gift,
  Heart,
  Lock,
  Printer,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getManagedByOrg } from "@/lib/pro/customer";
import { AppPage } from "@/components/app/app-page";
import { Badge, Button, Card } from "@/components/ui-kit";
import { PaperFold } from "@/components/illustrations";

type DocStatus = "not_started" | "in_progress" | "completed" | "paid" | "generated";

function StatusBadge({ status, locked }: { status: DocStatus; locked?: boolean }) {
  if (locked) return <Badge variant="locked" icon={<Lock size={12} />}>Locked</Badge>;
  if (status === "not_started") return <Badge variant="draft">Not started</Badge>;
  if (status === "in_progress") return <Badge variant="draft">In progress</Badge>;
  if (status === "completed") return <Badge variant="completed" icon={<Check size={12} />}>Ready to review</Badge>;
  return <Badge variant="paid" icon={<Check size={12} />}>{status === "generated" ? "Generated" : "Paid"}</Badge>;
}

function FeaturedWill({ status, progress }: { status: DocStatus; progress: number }) {
  const isStarted = status !== "not_started";
  const isReady = status === "completed" || status === "paid" || status === "generated";
  const href = isReady ? (status === "generated" ? "/download" : "/review") : "/will";
  const label = !isStarted ? "Start my will" : isReady ? (status === "generated" ? "Download" : "Review") : "Continue";
  return (
    <Card className="featured-will" padded={false} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32, alignItems: "center", overflow: "hidden" }}>
      <div style={{ padding: 32 }}>
        <div className="row g-3" style={{ alignItems: "center", marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--teal-100)", color: "var(--teal-800)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={32} />
          </div>
          <div>
            <div className="t-overline muted">Your will</div>
            <div className="t-h3" style={{ marginTop: 2 }}>Last Will &amp; Testament</div>
          </div>
          <div style={{ marginLeft: "auto" }}><StatusBadge status={status} /></div>
        </div>
        <p className="t-body muted" style={{ maxWidth: "48ch" }}>
          {!isStarted
            ? "Decide who inherits, who looks after your kids, and who runs the show. About 20 minutes."
            : isReady
              ? "Your answers are in. Review your will and continue to payment when you're ready."
              : "You're partway through. Pick up where you left off — your answers are saved."}
        </p>
        {isStarted && !isReady && (
          <div className="mt-6">
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <span className="t-body-sm muted">Will progress</span>
              <span className="t-body-sm" style={{ fontWeight: 600 }}>{progress}%</span>
            </div>
            <div className="progress"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
        <div className="row g-3 mt-6" style={{ flexWrap: "wrap" }}>
          <Button href={href} iconRight={<ArrowRight size={16} />}>{label}</Button>
        </div>
      </div>
      <div className="featured-will-illo" style={{ background: "linear-gradient(135deg, var(--teal-100) 0%, var(--coral-100) 100%)", padding: 24, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 320 }}><PaperFold /></div>
      </div>
      <style>{`@media (max-width: 900px) { .featured-will { grid-template-columns: 1fr !important; } .featured-will-illo { display: none !important; } }`}</style>
    </Card>
  );
}

function SmallDocCard({
  title, blurb, icon, bg, fg, href, locked, label,
}: {
  title: string; blurb: string; icon: React.ReactNode; bg: string; fg: string; href: string; locked: boolean; label: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <Card interactive className="stack g-3" style={{ height: "100%" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, color: fg, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
          <StatusBadge status="not_started" locked={locked} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="t-h5">{title}</div>
          <div className="t-body-sm muted mt-1">{blurb}</div>
        </div>
        <span className="row g-1 t-body-sm" style={{ color: "var(--primary)", fontWeight: 600 }}>{label} <ArrowRight size={14} /></span>
      </Card>
    </Link>
  );
}

function AccountCard({ icon, title, sub, href }: { icon: React.ReactNode; title: string; sub: string; href: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}>
      <Card interactive className="row g-3" style={{ alignItems: "center", height: "100%" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--muted)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--ink-700)", flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t-h5">{title}</div>
          <div className="t-body-sm muted">{sub}</div>
        </div>
        <ChevronRight style={{ color: "var(--muted-foreground)", flexShrink: 0 }} size={18} />
      </Card>
    </Link>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: willDoc }, managedBy] = await Promise.all([
    supabase.from("profiles").select("plan, full_name").eq("id", user!.id).maybeSingle(),
    supabase.from("documents").select("id, status").eq("user_id", user!.id).eq("type", "will").eq("is_current", true).maybeSingle(),
    getManagedByOrg(user!.id),
  ]);

  let progress = 0;
  if (willDoc?.id) {
    const { data: wd } = await supabase.from("will_data").select("current_step, total_steps").eq("document_id", willDoc.id).maybeSingle();
    if (wd?.total_steps) progress = Math.round(((wd.current_step ?? 1) / wd.total_steps) * 100);
  }

  const rawStatus = willDoc?.status as string | undefined;
  const status: DocStatus = !rawStatus ? "not_started" : rawStatus === "draft" ? "in_progress" : (rawStatus as DocStatus);

  const plan = (profile?.plan as string) ?? "none";
  const hasPlan = plan !== "none";
  const isPremium = plan === "premium" || plan === "premium_x2";
  const fullName = (profile?.full_name as string) || (user?.user_metadata?.full_name as string) || user?.email || "friend";
  const firstName = fullName.split(/\s+/)[0].replace(/@.*/, "");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const rail = (
    <div className="stack g-4">
      {managedBy && (
        <Card className="stack g-3" style={{ background: "var(--teal-50)", borderColor: "var(--teal-200)" }}>
          <div className="row g-2">
            <Briefcase size={18} style={{ color: "var(--teal-700)" }} />
            <div className="t-h5" style={{ margin: 0 }}>Managed by {managedBy.name}</div>
          </div>
          <div className="t-body-sm" style={{ color: "var(--ink-800)" }}>
            Staff at {managedBy.name} can see your progress and help you finish. You
            stay in control of your documents.
          </div>
          <Button variant="outline" size="sm" href="/profile" style={{ alignSelf: "flex-start" }}>
            Manage access
          </Button>
        </Card>
      )}
      <Card className="stack g-3">
        <div className="row g-2"><Sparkles size={18} style={{ color: "var(--coral-500)" }} /><div className="t-h5" style={{ margin: 0 }}>Did you know?</div></div>
        <div className="t-body-sm muted">Six in ten Canadians don&apos;t have a will. Yours will be done in an afternoon.</div>
      </Card>
      <Card className="stack g-3">
        <div className="t-h5">Need help?</div>
        <div className="t-body-sm muted">We answer email within one business day, or chat 9am–7pm ET.</div>
        <Button variant="outline" size="sm" href="/help" style={{ alignSelf: "flex-start" }}>Open support</Button>
      </Card>
      <Card className="stack g-3" style={{ background: "var(--coral-50)", borderColor: "var(--coral-200)" }}>
        <div className="row g-2"><Gift size={18} style={{ color: "var(--coral-700)" }} /><div className="t-h5" style={{ margin: 0 }}>Give the gift</div></div>
        <div className="t-body-sm muted">Help a parent or partner finish theirs.</div>
        <Button variant="outline" size="sm" href="/gift" style={{ alignSelf: "flex-start" }}>Gift a plan</Button>
      </Card>
    </div>
  );

  return (
    <AppPage
      breadcrumb="Home"
      title={`${greeting}, ${firstName}.`}
      description="Pick up where you left off. Your progress saves automatically."
      actions={!hasPlan ? <Button variant="outline" size="sm" href="/billing" icon={<Sparkles size={16} />}>Upgrade</Button> : undefined}
      rail={rail}
      wide
    >
      <FeaturedWill status={status} progress={progress} />

      <section style={{ marginTop: 32 }}>
        <div className="row mb-4" style={{ justifyContent: "space-between" }}>
          <h2 className="t-overline muted" style={{ margin: 0 }}>Other documents</h2>
          {!isPremium && <Button variant="link" href="/billing" icon={<Lock size={14} />}>Unlock with Premium</Button>}
        </div>
        <div className="grid g-4 dash-three" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <SmallDocCard title="Power of Attorney — Property" blurb="Who handles money if you're ever unable to." icon={<CreditCard size={28} />} bg="var(--coral-100)" fg="var(--coral-700)" href={isPremium ? "/poa-property" : "/billing"} locked={!isPremium} label={!isPremium ? "Upgrade" : "Start"} />
          <SmallDocCard title="Power of Attorney — Health" blurb="Medical wishes and a trusted decision-maker." icon={<Heart size={28} />} bg="var(--sand-100)" fg="var(--ink-800)" href={isPremium ? "/poa-health" : "/billing"} locked={!isPremium} label={!isPremium ? "Upgrade" : "Start"} />
          <SmallDocCard title="Asset List" blurb="A living document so your people know what you have." icon={<Shield size={28} />} bg="var(--teal-100)" fg="var(--teal-800)" href={isPremium ? "/assets" : "/billing"} locked={!isPremium} label={!isPremium ? "Upgrade" : "Start"} />
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 className="t-overline muted mb-4">Account</h2>
        <div className="grid g-4 dash-three" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <AccountCard icon={<User />} title="Profile" sub="Name, address, province" href="/profile" />
          <AccountCard icon={<CreditCard />} title="Billing" sub={hasPlan ? "Manage your plan" : "Free — upgrade anytime"} href="/billing" />
          <AccountCard icon={<Printer />} title="Signing instructions" sub={status === "generated" ? "Ready to print & sign" : "Available after payment"} href="/signing" />
        </div>
      </section>

      <style>{`@media (max-width: 900px) { .dash-three { grid-template-columns: 1fr !important; } }`}</style>
    </AppPage>
  );
}
