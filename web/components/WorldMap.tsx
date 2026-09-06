"use client";

import type { Station } from "@/lib/types";

// A simple equirectangular map: a latitude/longitude graticule with a dot per
// station. Not a detailed coastline — a clean coverage grid, which is the
// ops-console look and needs no map data. Online sites pulse.
const WIDTH = 360;
const HEIGHT = 180;

const project = (lat: number, lon: number) => ({
  x: ((lon + 180) / 360) * WIDTH,
  y: ((90 - lat) / 180) * HEIGHT,
});

const LONGITUDES = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
const LATITUDES = [-60, -30, 30, 60];

export function WorldMap({ stations }: { stations: Station[] }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full rounded-lg border border-hairline bg-inset"
      role="img"
      aria-label="Ground station locations"
    >
      {LONGITUDES.map((lon) => (
        <line key={`v${lon}`} x1={project(0, lon).x} y1={0} x2={project(0, lon).x} y2={HEIGHT} stroke="var(--grid)" strokeWidth={0.5} />
      ))}
      {LATITUDES.map((lat) => (
        <line key={`h${lat}`} x1={0} y1={project(lat, 0).y} x2={WIDTH} y2={project(lat, 0).y} stroke="var(--grid)" strokeWidth={0.5} />
      ))}
      {/* equator, a touch stronger */}
      <line x1={0} y1={HEIGHT / 2} x2={WIDTH} y2={HEIGHT / 2} stroke="var(--grid)" strokeWidth={1} />

      {stations.map((station) => {
        const { x, y } = project(station.latitude, station.longitude);
        const online = station.status === "online";
        return (
          <g key={station.id}>
            {online && <circle cx={x} cy={y} r={5} fill="var(--accent)" opacity={0.25} className="pulse" />}
            <circle cx={x} cy={y} r={2.4} fill={online ? "var(--accent)" : "var(--bad)"} />
            <text
              x={x + 4}
              y={y - 3}
              fontSize={5}
              fill="var(--text-secondary)"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {station.id.replace("GS-", "")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
