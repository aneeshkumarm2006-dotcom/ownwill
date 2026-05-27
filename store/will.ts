import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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

/**
 * Persisted to localStorage so a refresh mid-wizard doesn't lose the user's
 * in-progress answers before they hit Save. The server row is still the source
 * of truth — `hydrate` overwrites this on next load.
 */
export const useWillStore = create<WillState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: "ownwill:will-draft",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        documentId: state.documentId,
        willDataId: state.willDataId,
        data: state.data,
        currentStep: state.currentStep,
      }),
    },
  ),
);
