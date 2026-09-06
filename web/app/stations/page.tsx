"use client";

import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { WorldMap } from "@/components/WorldMap";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { formatPct } from "@/lib/format";
import { useData } from "@/lib/providers";

export default function StationsPage() {
  const { data, error } = useData();
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const utilizationById = new Map(data.metrics.by_station.map((s) => [s.station_id, s.utilization]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Ground network"
        title="Ground stations"
        subtitle="Where the fleet talks to Earth, and how busy each site is."
      />

      <Card title="Global coverage" subtitle="Station locations · live sites pulse">
        <WorldMap stations={data.stations} />
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.stations.map((station) => {
          const utilization = utilizationById.get(station.id) ?? 0;
          const online = station.status === "online";
          return (
            <div key={station.id} className="rounded-card border border-hairline bg-surface p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-primary">{station.id}</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-secondary">
                  <span className={`h-2 w-2 rounded-full ${online ? "bg-good" : "bg-bad"}`} aria-hidden />
                  {online ? "Online" : "Offline"}
                </span>
              </div>
              <div className="mt-1 text-sm text-secondary">{station.name}</div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted">
                <span>
                  {station.antennas} antenna{station.antennas > 1 ? "s" : ""}
                </span>
                <span className="tabular">{formatPct(utilization, 1)} used</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-inset">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.min(utilization * 100, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
