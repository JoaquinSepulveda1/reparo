/**
 * Logo de Reparo: documento + lupa (redline sobre la última línea).
 * Usa `currentColor` para el trazo principal → funciona en claro y oscuro.
 * El acento rojo se mantiene fijo (firma de marca).
 */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-ink"
    >
      <rect
        x="5"
        y="5"
        width="19"
        height="27"
        rx="2"
        fill="var(--paper-raised)"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <line x1="9" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
      <line x1="9" y1="15.5" x2="20" y2="15.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
      <line x1="9" y1="20" x2="20" y2="20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
      <line x1="9" y1="24.5" x2="18" y2="24.5" stroke="var(--redline)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="25" cy="23" r="7" fill="var(--paper)" fillOpacity="0.55" stroke="currentColor" strokeWidth="2" />
      <line x1="30" y1="28" x2="35.5" y2="33.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ size = 24 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2 font-serif text-[20px] font-semibold text-ink">
      <Logo size={size} />
      Reparo
    </span>
  );
}
