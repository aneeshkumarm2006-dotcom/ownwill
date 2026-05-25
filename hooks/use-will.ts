"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateWill, saveWill } from "@/lib/will/data";
import { useWillStore } from "@/store/will";

/** Loads (or creates) the user's will into the store once, on mount. */
export function useWillLoader() {
  const [supabase] = useState(() => createClient());
  const hydrate = useWillStore((s) => s.hydrate);
  const loaded = useWillStore((s) => s.loaded);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loaded) return;
    let active = true;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (active) setError("You must be signed in.");
          return;
        }
        const result = await getOrCreateWill(supabase, user.id);
        if (active) {
          hydrate({
            documentId: result.documentId,
            willDataId: result.willDataId,
            data: result.form,
            currentStep: result.currentStep,
          });
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Failed to load your will.");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [supabase, hydrate, loaded]);

  return { loaded, error };
}

/** Persists the current store state to Supabase. */
export function useSaveWill() {
  const [supabase] = useState(() => createClient());
  return useMutation({
    mutationFn: async ({ isComplete }: { isComplete: boolean }) => {
      const { documentId, willDataId, data, currentStep } =
        useWillStore.getState();
      if (!documentId || !willDataId) throw new Error("Will not loaded yet.");
      await saveWill(supabase, {
        documentId,
        willDataId,
        form: data,
        currentStep,
        isComplete,
      });
    },
  });
}
