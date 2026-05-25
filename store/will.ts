import { create } from "zustand";
import { type WillForm } from "@/types/will";
import { defaultWillForm } from "@/lib/will/data";

interface WillState {
  documentId: string | null;
  willDataId: string | null;
  data: WillForm;
  currentStep: number;
  loaded: boolean;

  hydrate: (args: {
    documentId: string;
    willDataId: string;
    data: WillForm;
    currentStep: number;
  }) => void;
  /** Merge a partial update into the form data. */
  patch: (patch: Partial<WillForm>) => void;
  setStep: (step: number) => void;
  reset: () => void;
}

export const useWillStore = create<WillState>((set) => ({
  documentId: null,
  willDataId: null,
  data: defaultWillForm(),
  currentStep: 1,
  loaded: false,

  hydrate: ({ documentId, willDataId, data, currentStep }) =>
    set({ documentId, willDataId, data, currentStep, loaded: true }),
  patch: (patch) => set((s) => ({ data: { ...s.data, ...patch } })),
  setStep: (currentStep) => set({ currentStep }),
  reset: () =>
    set({
      documentId: null,
      willDataId: null,
      data: defaultWillForm(),
      currentStep: 1,
      loaded: false,
    }),
}));
