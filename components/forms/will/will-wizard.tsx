"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AppPage } from "@/components/app/app-page";
import { Alert, Button, Card } from "@/components/ui-kit";
import { cls } from "@/lib/cls";
import { useSaveWill, useWillLoader } from "@/hooks/use-will";
import { useWillStore } from "@/store/will";
import { beneficiaryTotal, TOTAL_WILL_STEPS, type WillForm } from "@/types/will";
import { PersonalStep } from "@/components/forms/will/steps/personal";
import { ExecutorStep } from "@/components/forms/will/steps/executor";
import { BeneficiariesStep } from "@/components/forms/will/steps/beneficiaries";
import { ChildrenStep } from "@/components/forms/will/steps/children";
import { PetsStep } from "@/components/forms/will/steps/pets";
import { GiftsStep } from "@/components/forms/will/steps/gifts";
import { DonationsStep } from "@/components/forms/will/steps/donations";
import { WishesStep } from "@/components/forms/will/steps/wishes";
import { ReviewStep } from "@/components/forms/will/steps/review";

const STEPS: { title: string; description: string; tip: string; Component: () => React.ReactElement }[] = [
  { title: "About you", description: "Your personal details.", tip: "Use your full legal name exactly as it appears on government ID.", Component: PersonalStep },
  { title: "Your executor", description: "Who carries out your will.", tip: "Pick someone organized and trustworthy — and always name a backup.", Component: ExecutorStep },
  { title: "Beneficiaries", description: "Who inherits your estate.", tip: "Shares must add up to 100%. You can split between several people.", Component: BeneficiariesStep },
  { title: "Children & guardians", description: "Care for minor children.", tip: "If any child is under 18, you'll name a guardian to care for them.", Component: ChildrenStep },
  { title: "Pets", description: "Care for your pets.", tip: "You can leave a small fund to whoever cares for your pets.", Component: PetsStep },
  { title: "Specific gifts", description: "Particular items for particular people.", tip: "Great for heirlooms — a ring, a watch, a vehicle.", Component: GiftsStep },
  { title: "Charitable donations", description: "Gifts to organizations.", tip: "Leave a fixed amount or a percentage of your estate.", Component: DonationsStep },
  { title: "Final wishes", description: "Funeral wishes and business interests.", tip: "Optional, but helpful guidance for your executor and family.", Component: WishesStep },
  { title: "Review & finish", description: "Check everything before paying.", tip: "Click any step on the left to jump back and make changes.", Component: ReviewStep },
];

function validateStep(step: number, data: WillForm): string | null {
  if (step === 1) {
    if (!data.full_legal_name.trim()) return "Please enter your full legal name.";
    if (!data.province) return "Please select your province.";
  }
  if (step === 3) {
    if (data.beneficiaries.length === 0) {
      return "Add at least one beneficiary before continuing.";
    }
    if (beneficiaryTotal(data.beneficiaries) !== 100) {
      return "Beneficiary percentages must add up to 100%.";
    }
  }
  return null;
}

function validateAll(data: WillForm): string | null {
  for (let s = 1; s <= TOTAL_WILL_STEPS; s++) {
    const err = validateStep(s, data);
    if (err) return err;
  }
  return null;
}

export function WillWizard() {
  const router = useRouter();
  const { loaded, error } = useWillLoader();
  const currentStep = useWillStore((s) => s.currentStep);
  const save = useSaveWill();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  if (error) {
    return (
      <AppPage breadcrumb="My documents" title="Last Will & Testament" narrow>
        <Alert variant="error" title="Couldn't load your will">{error}</Alert>
      </AppPage>
    );
  }
  if (!loaded) {
    return (
      <AppPage breadcrumb="My documents" title="Last Will & Testament" narrow>
        <Card><div className="skeleton" style={{ height: 320 }} /></Card>
      </AppPage>
    );
  }

  const { title, description, tip, Component } = STEPS[currentStep - 1];
  const isFirst = currentStep === 1;
  const isReview = currentStep === TOTAL_WILL_STEPS;
  const progress = Math.round((currentStep / TOTAL_WILL_STEPS) * 100);

  async function persist(targetStep: number, complete: boolean) {
    useWillStore.getState().setStep(targetStep);
    try {
      await save.mutateAsync({ isComplete: complete });
      setSavedAt(Date.now());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save progress.");
    }
  }

  async function handleNext() {
    const err = validateStep(currentStep, useWillStore.getState().data);
    if (err) {
      toast.error(err);
      return;
    }
    await persist(currentStep + 1, false);
  }
  async function handleBack() {
    await persist(currentStep - 1, false);
  }
  async function goTo(step: number) {
    if (step < currentStep) await persist(step, false);
  }
  async function handleFinish() {
    const err = validateAll(useWillStore.getState().data);
    if (err) {
      toast.error(err);
      return;
    }
    await persist(currentStep, true);
    toast.success("Your will is complete.");
    router.push("/review");
  }

  const savedIndicator = save.isPending ? (
    <span className="t-caption muted">Saving…</span>
  ) : savedAt ? (
    <span className="t-caption muted row g-1"><Check size={12} /> Saved</span>
  ) : null;

  const rail = (
    <div className="stack g-4">
      <Card className="stack g-3">
        <div className="t-overline muted">Your progress</div>
        <ol className="ow-vstepper stack" style={{ listStyle: "none", padding: 0, margin: 0, gap: 2 }}>
          {STEPS.map((s, i) => {
            const n = i + 1;
            const done = n < currentStep;
            const current = n === currentStep;
            return (
              <li key={i}>
                <button
                  className={cls("ow-vstep", current && "is-current", done && "is-done")}
                  disabled={n >= currentStep}
                  onClick={() => goTo(n)}
                >
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
        <div className="t-body-sm" style={{ color: "var(--teal-900)" }}>{tip}</div>
      </Card>
    </div>
  );

  return (
    <AppPage breadcrumb="My documents" title="Last Will & Testament" actions={savedIndicator} rail={rail}>
      <div className="stack g-6">
        <div>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <span className="t-body-sm muted">Step {currentStep} of {TOTAL_WILL_STEPS}</span>
            <span className="t-body-sm" style={{ fontWeight: 600 }}>{progress}%</span>
          </div>
          <div className="progress"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>

        <Card className="card-pad">
          <div className="mb-6">
            <h2 className="t-h4">{title}</h2>
            <p className="t-body-sm muted mt-1">{description}</p>
          </div>
          <Component />
        </Card>

        <div className="row" style={{ justifyContent: "space-between" }}>
          <Button variant="outline" onClick={handleBack} disabled={isFirst || save.isPending} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          {isReview ? (
            <Button
              onClick={handleFinish}
              disabled={save.isPending}
              loading={save.isPending}
              iconRight={<ArrowRight size={16} />}
            >
              {save.isPending ? "Saving…" : "Finish & review"}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={save.isPending}
              loading={save.isPending}
              iconRight={<ArrowRight size={16} />}
            >
              {save.isPending ? "Saving…" : "Next"}
            </Button>
          )}
        </div>
      </div>
    </AppPage>
  );
}
