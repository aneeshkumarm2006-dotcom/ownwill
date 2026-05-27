/** OwnWill leaf wordmark — soft drop-leaf with a coral signature vein. */

import { memo } from "react";

export function LeafMark({
  size = 28,
  color,
  accent,
}: {
  size?: number;
  color?: string;
  accent?: string;
}) {
  const c = color || "var(--primary)";
  const a = accent || "var(--cta)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="leaf"
    >
      <path
        d="M6 22c0-9 6-15 16-16 1 0 2 1 2 2 0 10-7 16-16 16-1 0-2-1-2-2z"
        fill={c}
      />
      <path
        d="M9 21c4-1 8-3 11-6 1.6-1.6 3-3.6 4-6"
        stroke={a}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M6 22c-1 2-1.5 4-1.5 6"
        stroke={c}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity=".7"
      />
    </svg>
  );
}

function WordmarkBase({
  size = 22,
  mono = false,
}: {
  size?: number;
  mono?: boolean;
}) {
  return (
    <span className="wordmark" style={{ fontSize: size }}>
      <LeafMark
        size={size + 4}
        color={mono ? "currentColor" : undefined}
        accent={mono ? "currentColor" : undefined}
      />
      OwnWill
    </span>
  );
}

export const Wordmark = memo(WordmarkBase);
