"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateDoc, saveDoc, type DocData } from "@/lib/docs/data";
import { AppPage } from "@/components/app/app-page";
import { Alert, Button, Card } from "@/components/ui-kit";
import { cls } from "@/lib/cls";

export interface StepCtx {
  data: DocData;
  set: (key: string, value: unknown) => void;
  patch: (obj: DocData) => void;
}

export interface StepDef {
  title: string;
  description: string;
  tip: string;
  render: (ctx: StepCtx) => ReactNode;
}

export interface DocWizardConfig {
  type: string;
  table: string;
  title: string;
  breadcrumb?: string;
  defaults: DocData;
  steps: StepDef[]; // last step should be a review
  finishHref: string;
  validate?: (step: number, data: DocData) => string | null;
}

export function DocWizard({ config }: { config: DocWizardConfig }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DocData>(config.defaults);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const ids = useRef<{ documentId: string; dataId: string }>({ documentId: "", dataId: "" });
  const total = config.steps.length;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (active) setError("You must be signed in.");
          return;
        }
        const res = await getOrCreateDoc(supabase, {
          userId: user.id,
          type: config.type,
          table: config.table,
          defaults: config.defaults,
          totalSteps: total,
        });
        if (active) {
          ids.current = { documentId: res.documentId, dataId: res.dataId };
          setData(res.data);
          setCurrentStep(res.currentStep);
          setLoaded(true);
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load.");
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const set = (key: string, value: unknown) => setData((d) => ({ ...d, [key]: value }));
  const patch = (obj: DocData) => setData((d) => ({ ...d, ...obj }));

  async function persist(target: number, complete: boolean) {
    setCurrentStep(target);
    setSaving(true);
    try {
      await saveDoc(supabase, {
        table: config.table,
        dataId: ids.current.dataId,
        documentId: ids.current.documentId,
        data,
        currentStep: target,
        totalSteps: total,
        isComplete: complete,
      });
      setSavedAt(Date.now());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <AppPage breadcrumb={config.breadcrumb} title={config.title} narrow>
        <Alert variant="error" title="Couldn't load">{error}</Alert>
      </AppPage>
    );
  }
  if (!loaded) {
    return (
      <AppPage breadcrumb={config.breadcrumb} title={config.title} narrow>
        <Card><div className="skeleton" style={{ height: 320 }} /></Card>
      </AppPage>
    );
  }

  const step = config.steps[currentStep - 1];
  const isFirst = currentStep === 1;
  const isLast = currentStep === total;
  const progress = Math.round((currentStep / total) * 100);

  async function handleNext() {
    const err = config.validate?.(currentStep, data);
    if (err) {
      toast.error(err);
      return;
    }
    await persist(currentStep + 1, false);
  }
  async function handleBack() {
    await persist(currentStep - 1, false);
  }
  async function goTo(n: number) {
    if (n < currentStep) await persist(n, false);
  }
  async function handleFinish() {
    for (let s = 1; s <= total; s++) {
      const err = config.validate?.(s, data);
      if (err) {
        toast.error(err);
        return;
      }
    }
    await persist(currentStep, true);
    toast.success("Saved.");
    router.push(config.finishHref);
  }

  const savedIndicator = saving ? (
    <span className="t-caption muted">Saving…</span>
  ) : savedAt ? (
    <span className="t-caption muted row g-1"><Check size={12} /> Saved</span>
  ) : null;

  const rail = (
    <div className="stack g-4">
      <Card className="stack g-3">
        <div className="t-overline muted">Your progress</div>
        <ol className="ow-vstepper stack" style={{ listStyle: "none", padding: 0, margin: 0, gap: 2 }}>
          {config.steps.map((s, i) => {
            const n = i + 1;
            const done = n < currentStep;
            const current = n === currentStep;
            return (
              <li key={i}>
                <button className={cls("ow-vstep", current && "is-current", done && "is-done")} disabled={n >= currentStep} onClick={() => goTo(n)}>
                  <span className="ow-vstep-dot">{done ? <Check size={14} /> : n}</span>
                  <span>{s.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </Card>
      <Card className="stack g-2" style={{ background: "var(--teal-100)", borderColor: "var(--teal-200)" }}>
        <div className="t-h5" style={{ margin: 0, color: "var(--teal-900)" }}>Tip</div>
        <div className="t-body-sm" style={{ color: "var(--teal-900)" }}>{step.tip}</div>
      </Card>
    </div>
  );

  return (
    <AppPage breadcrumb={config.breadcrumb} title={config.title} actions={savedIndicator} rail={rail}>
      <div className="stack g-6">
        <div>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <span className="t-body-sm muted">Step {currentStep} of {total}</span>
            <span className="t-body-sm" style={{ fontWeight: 600 }}>{progress}%</span>
          </div>
          <div className="progress"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>

        <Card className="card-pad">
          <div className="mb-6">
            <h2 className="t-h4">{step.title}</h2>
            <p className="t-body-sm muted mt-1">{step.description}</p>
          </div>
          {step.render({ data, set, patch })}
        </Card>

        <div className="row" style={{ justifyContent: "space-between" }}>
          <Button variant="outline" onClick={handleBack} disabled={isFirst || saving} icon={<ArrowLeft size={16} />}>Back</Button>
          {isLast ? (
            <Button onClick={handleFinish} disabled={saving} iconRight={<ArrowRight size={16} />}>{saving ? "Saving…" : "Finish"}</Button>
          ) : (
            <Button onClick={handleNext} disabled={saving} iconRight={<ArrowRight size={16} />}>{saving ? "Saving…" : "Next"}</Button>
          )}
        </div>
      </div>
    </AppPage>
  );
}
