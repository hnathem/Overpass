"use client";

import type { Contact, Station } from "@/lib/types";

const WIDTH = 360;
const HEIGHT = 180;

const project = (lat: number, lon: number) => ({
  x: ((lon + 180) / 360) * WIDTH,
  y: ((90 - lat) / 180) * HEIGHT,
});

const LONGITUDES = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
const LATITUDES = [-60, -30, 30, 60];

/**
 * An interactive coverage map. A graticule, a dot per station, and animated
 * signal arcs rising to a satellite for any station with a contact around now.
 * Hovering a station (here or in the list) focuses it and dims the rest.
 */
export function NetworkMap({
  stations,
  contacts,
  now,
  hovered,
  onHover,
}: {
  stations: Station[];
  contacts: Contact[];
  now: string;
  hovered: string | null;
  onHover: (stationId: string | null) => void;
}) {
  const nowMs = new Date(now).getTime();
  const soonMs = nowMs + 20 * 60_000;
  const active = new Set(
    contacts
      .filter((c) => {
        const start = new Date(c.start).getTime();
        const end = new Date(c.end).getTime();
        return (start <= nowMs && nowMs <= end) || (nowMs <= start && start <= soonMs);
      })
      .map((c) => c.station_id),
  );

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full rounded-lg border border-hairline bg-inset"
      role="img"
      aria-label="Ground station coverage map"
      onMouseLeave={() => onHover(null)}
    >
      {LONGITUDES.map((lon) => (
        <line key={`v${lon}`} x1={project(0, lon).x} y1={0} x2={project(0, lon).x} y2={HEIGHT} stroke="var(--grid)" strokeWidth={0.5} />
      ))}
      {LATITUDES.map((lat) => (
        <line key={`h${lat}`} x1={0} y1={project(lat, 0).y} x2={WIDTH} y2={project(lat, 0).y} stroke="var(--grid)" strokeWidth={0.5} />
      ))}
      <line x1={0} y1={HEIGHT / 2} x2={WIDTH} y2={HEIGHT / 2} stroke="var(--grid)" strokeWidth={1} />

      {stations.map((station) => {
        const { x, y } = project(station.latitude, station.longitude);
        const online = station.status === "online";
        const isActive = active.has(station.id) && online;
        const dimmed = hovered !== null && hovered !== station.id;
        const satY = Math.max(y - 34, 4);
        return (
          <g key={station.id} opacity={dimmed ? 0.3 : 1} style={{ transition: "opacity 0.2s" }}>
            {isActive && (
              <>
                <path
                  d={`M ${x} ${satY} Q ${x + 16} ${(satY + y) / 2} ${x} ${y}`}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={0.9}
                  className="signal-flow"
                />
                <circle cx={x} cy={satY} r={1.8} fill="var(--accent)" className="pulse" />
              </>
            )}
            {hovered === station.id && <circle cx={x} cy={y} r={7} fill="none" stroke="var(--accent)" strokeWidth={0.8} />}
            <circle cx={x} cy={y} r={2.6} fill={online ? "var(--accent)" : "var(--bad)"} />
            <text
              x={x + 4}
              y={y - 3}
              fontSize={5}
              fill="var(--text-secondary)"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {station.id.replace("GS-", "")}
            </text>
            {/* generous invisible hit target */}
            <circle
              cx={x}
              cy={y}
              r={9}
              fill="transparent"
              onMouseEnter={() => onHover(station.id)}
              style={{ cursor: "pointer" }}
            />
          </g>
        );
      })}
    </svg>
  );
}
