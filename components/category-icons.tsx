/* Line icons for the six top-level categories (matched by category id). */

const s = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICONS: Record<string, React.ReactNode> = {
  // ლაქ-საღებავები — paint roller
  paints: (
    <svg viewBox="0 0 24 24" {...s}>
      <rect x="3" y="4" width="13" height="6" rx="1.5" />
      <path d="M16 7h3a1.5 1.5 0 0 1 1.5 1.5V12a1.5 1.5 0 0 1-1.5 1.5h-6.5a1.5 1.5 0 0 0-1.5 1.5V16" />
      <rect x="9.5" y="16" width="3" height="5" rx="1" />
    </svg>
  ),
  // ინსტრუმენტები — wrench
  tools: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M15 6.5a3.5 3.5 0 0 0-4.6 4.3L4 17.2 6.8 20l6.4-6.4a3.5 3.5 0 0 0 4.3-4.6l-2.1 2.1-2.3-.6-.6-2.3 2.1-2.1z" />
    </svg>
  ),
  // ჰიდროიზოლაცია — droplet + shield
  waterproofing: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M12 3s6 6.3 6 10.5a6 6 0 0 1-12 0C6 9.3 12 3 12 3z" />
      <path d="M9.5 13a2.5 2.5 0 0 0 2.5 2.5" />
    </svg>
  ),
  // აეროზოლები — spray can
  aerosols: (
    <svg viewBox="0 0 24 24" {...s}>
      <rect x="8" y="8" width="8" height="13" rx="1.5" />
      <path d="M10 8V5.5h4V8M10.5 4h3" />
      <path d="M18 5h.01M20 6.5h.01M18.5 8h.01" />
    </svg>
  ),
  // წებოები & სკოჩები — tape roll
  "glues-tapes": (
    <svg viewBox="0 0 24 24" {...s}>
      <circle cx="11" cy="12" r="7.5" />
      <circle cx="11" cy="12" r="3" />
      <path d="M18 12h3v3h-8" />
    </svg>
  ),
  // ქაფ-სილიკონები — cartridge / caulk gun
  "foam-silicone": (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M4 9h11l5-3v9l-5-3H4z" />
      <path d="M4 9v6" />
      <path d="M20 7l1.5-1.5" />
    </svg>
  ),
};

export function CategoryIcon({ id }: { id: string }) {
  return (
    ICONS[id] || (
      <svg viewBox="0 0 24 24" {...s}>
        <rect x="4" y="4" width="16" height="16" rx="3" />
      </svg>
    )
  );
}
