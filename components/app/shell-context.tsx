"use client";

import { createContext, useContext } from "react";

export interface ShellUser {
  email: string;
  fullName: string;
  province: string;
  plan: "none" | "essentials" | "premium" | "premium_x2";
}

interface ShellContextValue {
  user: ShellUser;
  openSidebar: () => void;
}

export const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used within AppShell");
  return ctx;
}
