"use client";

import { useState } from "react";

import { formatTime } from "@/lib/format";
import { STATUS_META, STATUS_ORDER } from "@/lib/status";
import type { Contact, Station } from "@/lib/types";

function positionPct(iso: string, startMs: number, spanMs: number): number {
  return ((new Date(iso).getTime() - startMs) / spanMs) * 100;
}

/**
 * A Gantt-style timeline: one row per station antenna, time across the top, a
 * block per contact colored by status, and a pulsing "now" line. Hovering a
 * block shows its details above the chart, so there's no fiddly floating
 * tooltip to collide with anything.
 */
export function ScheduleTimeline({
  contacts,
  stations,
  start,
  end,
  now,
}: {
  contacts: Contact[];
  stations: Station[];
  start: string;
  end: string;
  now: string;
}) {
  const [hover, setHover] = useState<Contact | null>(null);

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

  // A tick every 3 hours across the horizon.
  const ticks: number[] = [];
  for (let t = startMs; t <= startMs + spanMs; t += 3 * 3_600_000) {
    ticks.push(t);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-h-[1.25rem] font-mono text-xs text-secondary">
          {hover
            ? `${hover.satellite_id} → ${hover.station_id} · A${hover.antenna} · ` +
              `${formatTime(hover.start)}–${formatTime(hover.end)} · ${hover.priority} · ` +
              STATUS_META[hover.status].label
            : "Hover a contact for details"}
        </div>
        <div className="flex items-center gap-3">
          {STATUS_ORDER.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 text-xs text-secondary">
              <span className={`h-2 w-2 rounded-sm ${STATUS_META[s].dot}`} aria-hidden />
              {STATUS_META[s].label}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* time axis */}
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

          {/* rows */}
          <div className="mt-1">
            {rows.map(({ station, antenna }) => {
              const list = byRow.get(`${station.id}-${antenna}`) ?? [];
              const offline = station.status === "offline";
              return (
                <div key={`${station.id}-${antenna}`} className="flex items-stretch">
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
                    {offline && (
                      <span className="absolute right-2 top-1.5 font-mono text-[10px] text-bad">offline</span>
                    )}
                    {list.map((contact) => {
                      const left = positionPct(contact.start, startMs, spanMs);
                      const width = Math.max(positionPct(contact.end, startMs, spanMs) - left, 0.4);
                      return (
                        <button
                          key={contact.request_id}
                          onMouseEnter={() => setHover(contact)}
                          onMouseLeave={() => setHover(null)}
                          title={`${contact.satellite_id} → ${contact.station_id} A${contact.antenna}`}
                          className="absolute bottom-1.5 top-1.5 rounded-sm border border-black/20"
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
    </div>
  );
}
