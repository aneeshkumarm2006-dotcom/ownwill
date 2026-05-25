import { create } from "zustand";

interface WizardState {
  currentStep: number;
  totalSteps: number;
  setStep: (step: number) => void;
  next: () => void;
  prev: () => void;
  reset: (totalSteps?: number) => void;
}

/**
 * Local UI state for the multi-step wizard. The actual answers are persisted
 * directly to Supabase on every "Next" click — this store only tracks where
 * the user is in the flow.
 */
export const useWizardStore = create<WizardState>((set) => ({
  currentStep: 1,
  totalSteps: 1,
  setStep: (currentStep) => set({ currentStep }),
  next: () =>
    set((s) => ({ currentStep: Math.min(s.currentStep + 1, s.totalSteps) })),
  prev: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
  reset: (totalSteps = 1) => set({ currentStep: 1, totalSteps }),
}));
