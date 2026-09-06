/**
 * The Overpass logomark: a satellite on an orbit arcing over a horizon — an
 * "overpass". Cyan on a dark badge, so it reads on any surface.
 */
export function Logo({ size = 28 }: { size?: number }) {
  const gradientId = "overpass-logo-gradient";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" role="img" aria-label="Overpass">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0e7490" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      {/* the horizon */}
      <path d="M5 24a11 11 0 0 1 22 0" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" />
      {/* the orbit */}
      <ellipse
        cx="16"
        cy="15"
        rx="11"
        ry="5.4"
        transform="rotate(-22 16 15)"
        stroke="#ffffff"
        strokeWidth="1.6"
      />
      {/* the satellite on the orbit */}
      <circle cx="24.5" cy="9.6" r="2.1" fill="#ffffff" />
    </svg>
  );
}
