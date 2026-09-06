import { STATUS_META } from "@/lib/status";
import type { ContactStatus } from "@/lib/types";

/** A colored dot plus a label — status is never carried by color alone. */
export function StatusBadge({ status }: { status: ContactStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary">
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden />
      {meta.label}
    </span>
  );
}
