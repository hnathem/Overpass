"use client";

import { formatTime } from "@/lib/format";
import { STATUS_META } from "@/lib/status";
import type { Contact, Station } from "@/lib/types";

function positionPct(iso: string, startMs: number, spanMs: number): number {
  return ((new Date(iso).getTime() - startMs) / spanMs) * 100;
}

/**
 * The interactive Gantt board: one row per station antenna, a block per
 * contact colored by status, a pulsing "now" line. Hovering a row focuses that
 * station (the rest dim); clicking a block selects it (the caller shows the
 * detail). Selection and focus are driven from above so other views can react.
 */
export function ScheduleBoard({
  contacts,
  stations,
  start,
  end,
  now,
  selectedId,
  onSelect,
  focusStation,
  onHoverStation,
}: {
  contacts: Contact[];
  stations: Station[];
  start: string;
  end: string;
  now: string;
  selectedId: string | null;
  onSelect: (contact: Contact) => void;
  focusStation: string | null;
  onHoverStation: (stationId: string | null) => void;
}) {
  const startMs = new Date(start).getTime();
  const spanMs = new Date(end).getTime() - startMs;
  const nowPct = positionPct(now, startMs, spanMs);

  const rows: { station: Station; antenna: number }[] = [];
  for (const station of stations) {
    for (let antenna = 0; antenna < station.antennas; antenna += 1) {
      rows.push({ station, antenna });
    }
  }

  const byRow = new Map<string, Contact[]>();
  for (const contact of contacts) {
    const key = `${contact.station_id}-${contact.antenna}`;
    (byRow.get(key) ?? byRow.set(key, []).get(key)!).push(contact);
  }

  const ticks: number[] = [];
  for (let t = startMs; t <= startMs + spanMs; t += 3 * 3_600_000) ticks.push(t);

  return (
    <div className="overflow-x-auto" onMouseLeave={() => onHoverStation(null)}>
      <div className="min-w-[820px]">
        <div className="flex">
          <div className="w-32 shrink-0" />
          <div className="relative h-5 flex-1">
            {ticks.map((t) => (
              <span
                key={t}
                className="absolute -translate-x-1/2 font-mono text-[10px] text-muted"
                style={{ left: `${positionPct(new Date(t).toISOString(), startMs, spanMs)}%` }}
              >
                {formatTime(new Date(t).toISOString())}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-1">
          {rows.map(({ station, antenna }) => {
            const list = byRow.get(`${station.id}-${antenna}`) ?? [];
            const dimmed = focusStation !== null && focusStation !== station.id;
            return (
              <div
                key={`${station.id}-${antenna}`}
                className={`flex items-stretch transition-opacity ${dimmed ? "opacity-30" : "opacity-100"}`}
                onMouseEnter={() => onHoverStation(station.id)}
              >
                <div className="w-32 shrink-0 py-1 pr-2 font-mono text-[11px] text-secondary">
                  {station.id}
                  <span className="text-muted"> · A{antenna}</span>
                </div>
                <div className="relative h-8 flex-1 border-t border-hairline">
                  {nowPct >= 0 && nowPct <= 100 && (
                    <div
                      className="pulse absolute bottom-0 top-0 w-px bg-accent"
                      style={{ left: `${nowPct}%` }}
                      aria-hidden
                    />
                  )}
                  {list.map((contact) => {
                    const left = positionPct(contact.start, startMs, spanMs);
                    const width = Math.max(positionPct(contact.end, startMs, spanMs) - left, 0.5);
                    const selected = contact.request_id === selectedId;
                    return (
                      <button
                        key={contact.request_id}
                        onClick={() => onSelect(contact)}
                        title={`${contact.satellite_id} → ${contact.station_id} A${contact.antenna}`}
                        className={`absolute bottom-1.5 top-1.5 rounded-sm transition-shadow ${
                          selected ? "z-10 ring-2 ring-primary" : "ring-1 ring-black/20"
                        }`}
                        style={{ left: `${left}%`, width: `${width}%`, background: STATUS_META[contact.status].fill }}
                        aria-label={`${contact.satellite_id} contact at ${contact.station_id}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
