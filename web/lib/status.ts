import type { ContactStatus } from "./types";

// One place that maps a contact status to its label and color classes, so the
// legend, badges, and timeline all agree. Color is always shown with a label,
// never on its own.
export const STATUS_META: Record<ContactStatus, { label: string; dot: string; text: string; fill: string }> = {
  completed: { label: "Completed", dot: "bg-good", text: "text-good", fill: "var(--good)" },
  scheduled: { label: "Scheduled", dot: "bg-accent", text: "text-accent", fill: "var(--accent)" },
  failed: { label: "Failed", dot: "bg-bad", text: "text-bad", fill: "var(--bad)" },
};

export const STATUS_ORDER: ContactStatus[] = ["completed", "scheduled", "failed"];
