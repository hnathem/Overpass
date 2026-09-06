import type { ReactNode } from "react";

// Line icons drawn in currentColor, so they take the color of the text beside
// them. Used for the nav and the KPI tiles.
export type IconName =
  | "control"
  | "schedule"
  | "stations"
  | "fleet"
  | "requests"
  | "check"
  | "alert"
  | "clock"
  | "signal"
  | "antenna"
  | "satellite";

const PATHS: Record<IconName, ReactNode> = {
  control: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </>
  ),
  schedule: (
    <>
      <line x1="3" y1="7" x2="16" y2="7" />
      <line x1="3" y1="12" x2="20" y2="12" />
      <line x1="3" y1="17" x2="12" y2="17" />
    </>
  ),
  stations: (
    <>
      <path d="M8 20l4-9 4 9" />
      <path d="M6.5 9a5 5 0 0 1 11 0" />
      <circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  fleet: (
    <>
      <circle cx="12" cy="12" r="3" />
      <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-25 12 12)" />
    </>
  ),
  requests: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 5-5.5" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <circle cx="12" cy="16.2" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  signal: (
    <>
      <path d="M4 20v-4" />
      <path d="M10 20v-8" />
      <path d="M16 20v-12" />
      <path d="M22 20V4" opacity="0.5" />
    </>
  ),
  antenna: (
    <>
      <path d="M8 20l4-9 4 9" />
      <path d="M6.5 9a5 5 0 0 1 11 0" />
    </>
  ),
  satellite: (
    <>
      <circle cx="12" cy="12" r="3" />
      <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-25 12 12)" />
    </>
  ),
};

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
