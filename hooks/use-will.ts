"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateWill, saveWill } from "@/lib/will/data";
import { useWillStore } from "@/store/will";

/**
 * Map a Supabase / Postgres error code to a friendly message. Falls back to the
 * raw error message (or a generic line) when the code is unknown.
 */
function describeLoadError(e: unknown): string {
  const err = e as { code?: string; message?: string } | null;
  switch (err?.code) {
    case "PGRST301":
    case "401":
      return "Your session has expired. Please sign in again.";
    case "42501":
      return "You don't have permission to access this will.";
    case "23503":
      return "Your account is missing some setup. Refresh the page or sign in again.";
    case "PGRST116":
      return "We couldn't find your will. Please try again.";
    case "23505":
      return "A conflicting will already exists for this account.";
    case "FETCH_ERROR":
    case "NETWORK_ERROR":
      return "Couldn't reach the server. Check your connection and try again.";
  }
  if (err?.message) return err.message;
  return "Failed to load your will.";
}

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
          setError(describeLoadError(e));
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
