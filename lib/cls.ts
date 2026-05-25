/** Join truthy class names. Safe to call from server or client components. */
export const cls = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ");
