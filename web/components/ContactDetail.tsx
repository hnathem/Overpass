"use client";

import { formatDayTime } from "@/lib/format";
import { STATUS_META } from "@/lib/status";
import type { Contact } from "@/lib/types";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-hairline py-2 last:border-0">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <span className="tabular font-mono text-sm text-primary">{value}</span>
    </div>
  );
}

/** The panel beside the board: details for the selected contact. */
export function ContactDetail({ contact }: { contact: Contact | null }) {
  if (!contact) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-card border border-dashed border-hairline bg-surface p-6 text-center text-sm text-muted">
        Select a contact on the timeline to see its details.
      </div>
    );
  }

  const meta = STATUS_META[contact.status];
  return (
    <div className="rounded-card border border-hairline bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-lg font-semibold text-primary">{contact.satellite_id}</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary">
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden />
          {meta.label}
        </span>
      </div>
      <div className="mt-4">
        <Field label="Station" value={contact.station_id} />
        <Field label="Antenna" value={`A${contact.antenna}`} />
        <Field label="Window" value={`${formatDayTime(contact.start)}–${formatDayTime(contact.end).split(", ")[1]}`} />
        <Field label="Priority" value={contact.priority} />
        <Field label="Request" value={contact.request_id} />
      </div>
    </div>
  );
}
