import { create } from "zustand";
import type { Subscription, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
}

/** Client-side snapshot of the auth user. Source of truth remains Supabase. */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

let authSubscription: Subscription | null = null;
let authInitialized = false;

/**
 * Wire the store to Supabase's auth events so a token refresh, sign-in, or
 * sign-out done elsewhere on the page keeps the store in sync. Idempotent —
 * safe to call from multiple top-level effects.
 */
export function initAuthSync(): () => void {
  if (typeof window === "undefined") return () => {};
  if (authInitialized) return () => {};
  authInitialized = true;

  const supabase = createClient();
  supabase.auth.getUser().then(({ data }) => {
    useAuthStore.getState().setUser(data.user ?? null);
  });
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setUser(session?.user ?? null);
  });
  authSubscription = data.subscription;

  return () => {
    authSubscription?.unsubscribe();
    authSubscription = null;
    authInitialized = false;
  };
}
