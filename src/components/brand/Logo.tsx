/**
 * Logo de Reparo: documento + lupa (redline sobre la última línea).
 * SVG idéntico al del header del prototipo y de la landing.
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
    >
      <rect x="5" y="5" width="19" height="27" rx="2" fill="#FBFAF6" stroke="#1B2A4A" strokeWidth="1.8" />
      <line x1="9" y1="11" x2="20" y2="11" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="9" y1="15.5" x2="20" y2="15.5" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="9" y1="20" x2="20" y2="20" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="9" y1="24.5" x2="18" y2="24.5" stroke="#B23A2E" strokeWidth="2" strokeLinecap="round" />
      <circle cx="25" cy="23" r="7" fill="#F1EEE4" fillOpacity="0.6" stroke="#1B2A4A" strokeWidth="2" />
      <line x1="30" y1="28" x2="35.5" y2="33.5" stroke="#1B2A4A" strokeWidth="2.4" strokeLinecap="round" />
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
