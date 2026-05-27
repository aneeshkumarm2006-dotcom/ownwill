// Shared client-side email validation. The pattern rejects obvious typos
// (no `@`, no domain, embedded whitespace) without being so strict that it
// blocks valid addresses. Supabase / SES enforces final correctness server-side.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}
