/* OwnWill — motion-graphic illustrations (subtle SVG loops; honour reduced-motion). */

export function PaperFold() {
  return (
    <svg viewBox="0 0 480 360" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="A will, signed and resting.">
      <defs>
        <linearGradient id="paper-g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--card)" />
          <stop offset="100%" stopColor="var(--sand-100)" />
        </linearGradient>
        <filter id="paper-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#14201f" floodOpacity=".10" />
        </filter>
      </defs>
      <ellipse cx="240" cy="320" rx="180" ry="14" fill="var(--sand-200)" opacity=".5" />
      <g className="mg-float-a">
        <path d="M70 70c0-22 14-36 36-36 2 0 4 2 4 4 0 22-14 36-36 36-2 0-4-2-4-4z" fill="var(--teal-200)" opacity=".55" />
      </g>
      <g className="mg-float-b">
        <path d="M390 240c0-14 9-22 22-22 1 0 2 1 2 2 0 14-9 22-22 22-1 0-2-1-2-2z" fill="var(--coral-200)" opacity=".6" />
      </g>
      <g className="mg-float-c">
        <path d="M420 60c0-10 6-16 16-16 1 0 2 1 2 2 0 10-6 16-16 16-1 0-2-1-2-2z" fill="var(--teal-300)" opacity=".5" />
      </g>
      <g transform="translate(180 70) rotate(-6)" filter="url(#paper-shadow)">
        <rect width="160" height="210" rx="10" fill="var(--sand-100)" stroke="var(--sand-300)" strokeWidth="1" />
        <rect x="20" y="28" width="80" height="6" rx="3" fill="var(--sand-300)" />
        <rect x="20" y="46" width="120" height="4" rx="2" fill="var(--sand-300)" />
        <rect x="20" y="58" width="100" height="4" rx="2" fill="var(--sand-300)" />
      </g>
      <g transform="translate(140 90)" filter="url(#paper-shadow)">
        <rect width="200" height="240" rx="12" fill="url(#paper-g)" stroke="var(--sand-300)" strokeWidth="1" />
        <rect x="22" y="28" width="80" height="10" rx="4" fill="var(--teal-800)" />
        <rect x="22" y="46" width="120" height="4" rx="2" fill="var(--sand-300)" />
        {[70, 84, 98, 116, 130, 144, 162, 176].map((y, i) => (
          <rect key={y} x="22" y={y} width={i % 3 === 2 ? 100 : 158} height="4" rx="2" fill="var(--sand-300)" />
        ))}
        <path d="M30 210 q15 -16 30 0 t30 0 t30 0 t30 0" fill="none" stroke="var(--coral-500)" strokeWidth="2" strokeLinecap="round" pathLength={100}
          style={{ strokeDasharray: 100, strokeDashoffset: 0, animation: "mg-sig 4s var(--ease-emph) infinite" }} />
        <circle cx="160" cy="208" r="14" fill="none" stroke="var(--teal-700)" strokeWidth="1.5" />
        <path d="M154 208 l4 4 8-8" fill="none" stroke="var(--teal-700)" strokeWidth="2" strokeLinecap="round" />
      </g>
      <style>{`
        @keyframes mg-sig { 0% { stroke-dashoffset: 100; } 60% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; opacity:.9; } }
        @keyframes mg-floatA { 0%,100% { transform: translate(0,0) rotate(0); } 50% { transform: translate(6px,-10px) rotate(8deg); } }
        @keyframes mg-floatB { 0%,100% { transform: translate(0,0) rotate(0); } 50% { transform: translate(-8px,-6px) rotate(-10deg); } }
        @keyframes mg-floatC { 0%,100% { transform: translate(0,0); } 50% { transform: translate(4px,8px); } }
        .mg-float-a { animation: mg-floatA 5s var(--ease-std) infinite; transform-origin: center; }
        .mg-float-b { animation: mg-floatB 6s var(--ease-std) infinite; transform-origin: center; }
        .mg-float-c { animation: mg-floatC 7s var(--ease-std) infinite; transform-origin: center; }
      `}</style>
    </svg>
  );
}

export function FamilyHome() {
  return (
    <svg viewBox="0 0 480 320" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="A warm house with a family.">
      <ellipse cx="240" cy="290" rx="180" ry="12" fill="var(--sand-200)" opacity=".5" />
      <g>
        <rect x="120" y="140" width="240" height="140" rx="10" fill="var(--card)" stroke="var(--sand-300)" />
        <path d="M100 150 L240 60 L380 150 Z" fill="var(--teal-800)" />
        <rect x="220" y="190" width="40" height="90" rx="4" fill="var(--coral-500)" />
        <rect x="150" y="180" width="50" height="50" rx="4" fill="var(--teal-100)" stroke="var(--teal-700)" />
        <rect x="280" y="180" width="50" height="50" rx="4" fill="var(--teal-100)" stroke="var(--teal-700)" />
        <rect x="300" y="80" width="22" height="40" fill="var(--teal-700)" />
        <g style={{ animation: "mg-smoke 4s var(--ease-std) infinite" }}>
          <circle cx="311" cy="74" r="6" fill="var(--sand-200)" opacity=".9" />
          <circle cx="320" cy="60" r="5" fill="var(--sand-200)" opacity=".7" />
          <circle cx="305" cy="48" r="4" fill="var(--sand-200)" opacity=".5" />
        </g>
      </g>
      <g transform="translate(370 200)">
        <circle r="10" fill="var(--coral-300)" />
        <rect x="-9" y="8" width="18" height="30" rx="6" fill="var(--coral-400)" />
      </g>
      <g transform="translate(395 215)">
        <circle r="7" fill="var(--teal-300)" />
        <rect x="-6" y="6" width="12" height="22" rx="4" fill="var(--teal-500)" />
      </g>
      <circle cx="80" cy="70" r="20" fill="var(--coral-300)" style={{ animation: "mg-sunpulse 4s var(--ease-std) infinite" }} />
      <style>{`
        @keyframes mg-smoke { 0%,100% { transform: translateY(0); opacity:.9 } 50% { transform: translateY(-8px); opacity:.7 } }
        @keyframes mg-sunpulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.07); } }
      `}</style>
    </svg>
  );
}

export function ChecklistFlow({ active = 0 }: { active?: number }) {
  return (
    <svg viewBox="0 0 280 200" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="A checklist filling in.">
      <rect x="20" y="20" width="240" height="160" rx="12" fill="var(--card)" stroke="var(--sand-300)" />
      {[0, 1, 2].map((i) => {
        const y = 50 + i * 44;
        const done = i <= active;
        return (
          <g key={i}>
            <rect x="38" y={y - 12} width="16" height="16" rx="4" fill={done ? "var(--primary)" : "transparent"} stroke="var(--sand-300)" />
            {done && <path d={`M42 ${y - 4} l4 4 8-8`} stroke="var(--primary-foreground)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
            <rect x="66" y={y - 8} width={140} height="8" rx="4" fill={done ? "var(--teal-100)" : "var(--sand-200)"} />
            {i === active && (
              <circle cx="226" cy={y - 4} r="4" fill="var(--coral-500)">
                <animate attributeName="r" values="3;5;3" dur="1.4s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function ShieldHands() {
  return (
    <svg viewBox="0 0 280 240" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Hands holding a shield.">
      <ellipse cx="140" cy="220" rx="100" ry="10" fill="var(--sand-200)" opacity=".5" />
      <g style={{ animation: "mg-bob 5s var(--ease-std) infinite", transformOrigin: "140px 110px" }}>
        <path d="M140 40 L80 60 V120 c0 40 30 70 60 80 30-10 60-40 60-80 V60 z" fill="var(--teal-100)" stroke="var(--teal-800)" strokeWidth="2" />
        <path d="M120 110 l14 14 28-28" fill="none" stroke="var(--teal-800)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={1}
          style={{ strokeDasharray: 1, strokeDashoffset: 0, animation: "mg-check 3s var(--ease-emph) infinite" }} />
      </g>
      <path d="M50 180 q20 -20 40 -10 v40 H50 z" fill="var(--coral-300)" />
      <path d="M230 180 q-20 -20 -40 -10 v40 H230 z" fill="var(--coral-300)" />
      <style>{`
        @keyframes mg-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes mg-check { 0% { stroke-dashoffset: 1; } 70% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; } }
      `}</style>
    </svg>
  );
}

export function QuillSign() {
  return (
    <svg viewBox="0 0 280 200" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="A quill signing.">
      <rect x="40" y="40" width="200" height="130" rx="10" fill="var(--card)" stroke="var(--sand-300)" />
      <rect x="58" y="60" width="100" height="8" rx="4" fill="var(--sand-300)" />
      <rect x="58" y="78" width="160" height="4" rx="2" fill="var(--sand-200)" />
      <rect x="58" y="92" width="140" height="4" rx="2" fill="var(--sand-200)" />
      <path d="M60 140 q15 -20 30 0 t30 0 t30 0 t30 0" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" pathLength={100}
        style={{ strokeDasharray: 100, animation: "mg-quill 4s var(--ease-emph) infinite" }} />
      <g style={{ animation: "mg-quillmove 4s var(--ease-emph) infinite", transformOrigin: "0 0" }}>
        <path d="M210 60 L260 20 L255 15 L205 55 z" fill="var(--coral-500)" />
        <line x1="210" y1="60" x2="195" y2="138" stroke="var(--ink-800)" strokeWidth="2" strokeLinecap="round" />
      </g>
      <style>{`
        @keyframes mg-quill { 0% { stroke-dashoffset: 100 } 70% { stroke-dashoffset: 0 } 100% { stroke-dashoffset: 0 } }
        @keyframes mg-quillmove { 0% { transform: translate(-150px, 0) } 70% { transform: translate(0,0) } 100% { transform: translate(0,0) } }
      `}</style>
    </svg>
  );
}

export function CelebrateConfetti() {
  const bits: [number, number, string][] = [
    [60, 40, "var(--coral-500)"], [220, 60, "var(--teal-500)"], [80, 170, "var(--teal-700)"],
    [210, 170, "var(--coral-400)"], [40, 100, "var(--coral-300)"], [240, 110, "var(--teal-300)"],
  ];
  return (
    <svg viewBox="0 0 280 200" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Confetti.">
      <circle cx="140" cy="120" r="40" fill="var(--teal-100)" />
      <path d="M120 120 l14 14 28-28" stroke="var(--teal-800)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {bits.map(([x, y, c], i) => (
        <rect key={i} x={x} y={y} width="8" height="8" rx="2" fill={c} style={{ animation: `mg-confetti${i % 3} ${2 + i * 0.2}s var(--ease-std) infinite`, transformOrigin: `${x + 4}px ${y + 4}px` }} />
      ))}
      <style>{`
        @keyframes mg-confetti0 { 0%,100% { transform: rotate(0) translateY(0) } 50% { transform: rotate(40deg) translateY(-6px) } }
        @keyframes mg-confetti1 { 0%,100% { transform: rotate(0) translateY(0) } 50% { transform: rotate(-40deg) translateY(4px) } }
        @keyframes mg-confetti2 { 0%,100% { transform: rotate(0) translateY(0) } 50% { transform: rotate(20deg) translateY(-8px) } }
      `}</style>
    </svg>
  );
}

export function MailboxIllo() {
  return (
    <svg viewBox="0 0 280 200" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Mailbox.">
      <ellipse cx="140" cy="180" rx="80" ry="6" fill="var(--sand-200)" opacity=".7" />
      <rect x="130" y="110" width="6" height="70" fill="var(--teal-800)" />
      <rect x="80" y="60" width="120" height="70" rx="10" fill="var(--coral-500)" />
      <rect x="90" y="100" width="100" height="20" rx="4" fill="var(--coral-700)" />
      <g style={{ animation: "mg-mailbob 3.5s var(--ease-std) infinite", transformOrigin: "140px 80px" }}>
        <rect x="100" y="40" width="80" height="50" rx="4" fill="var(--card)" stroke="var(--sand-300)" />
        <path d="M100 40 L140 75 L180 40" stroke="var(--sand-300)" fill="none" />
        <circle cx="140" cy="62" r="6" fill="var(--teal-800)" />
      </g>
      <style>{`@keyframes mg-mailbob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }`}</style>
    </svg>
  );
}

export function Compass() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Empty state compass.">
      <circle cx="100" cy="100" r="70" fill="var(--card)" stroke="var(--sand-300)" strokeWidth="2" />
      <circle cx="100" cy="100" r="56" fill="none" stroke="var(--sand-200)" strokeDasharray="3 5" />
      <g style={{ animation: "mg-needle 6s var(--ease-emph) infinite", transformOrigin: "100px 100px" }}>
        <polygon points="100,40 108,100 100,108 92,100" fill="var(--coral-500)" />
        <polygon points="100,160 108,100 100,92 92,100" fill="var(--teal-800)" />
      </g>
      <circle cx="100" cy="100" r="6" fill="var(--card)" stroke="var(--ink-700)" strokeWidth="2" />
      <style>{`@keyframes mg-needle { 0% { transform: rotate(0) } 50% { transform: rotate(40deg) } 100% { transform: rotate(0) } }`}</style>
    </svg>
  );
}

export function NotFoundGraphic() {
  return (
    <svg viewBox="0 0 480 200" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <g fontFamily="Inter, sans-serif" fontWeight="700" fontSize="140" textAnchor="middle">
        <text x="120" y="160" fill="var(--teal-800)">4</text>
        <text x="360" y="160" fill="var(--teal-800)">4</text>
      </g>
      <g style={{ animation: "mg-spin 8s linear infinite", transformOrigin: "240px 100px" }}>
        <path d="M210 100c0-22 14-36 36-36 2 0 4 2 4 4 0 22-14 36-36 36-2 0-4-2-4-4z" fill="var(--coral-500)" />
        <path d="M220 96c6-2 14-6 22-14" stroke="var(--card)" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      <style>{`@keyframes mg-spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }`}</style>
    </svg>
  );
}
