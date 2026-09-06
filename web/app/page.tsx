"use client";

import { Card } from "@/components/Card";
import { KpiTile } from "@/components/KpiTile";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { formatPct, formatTime } from "@/lib/format";
import { useData } from "@/lib/providers";

function OutcomeRow({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-secondary">{label}</span>
      <span className={`tabular font-semibold ${tone}`}>{value}</span>
    </li>
  );
}

export default function MissionControlPage() {
  const { data, error } = useData();
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const { metrics, contacts, stations, meta } = data;
  const completed = metrics.by_status.completed ?? 0;
  const failed = metrics.by_status.failed ?? 0;
  const scheduled = metrics.by_status.scheduled ?? 0;
  const onlineStations = stations.filter((s) => s.status === "online").length;
  const avgUtilization =
    metrics.by_station.reduce((total, s) => total + s.utilization, 0) / (metrics.by_station.length || 1);

  const nowMs = new Date(meta.now).getTime();
  const upcoming = contacts
    .filter((c) => new Date(c.start).getTime() >= nowMs)
    .sort((a, b) => (a.start < b.start ? -1 : 1))
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Mission Control"
        title="Network at a glance"
        subtitle="Contacts, station load, and what's coming up next."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          label="Requests scheduled"
          value={formatPct(metrics.schedule_rate)}
          sub={`${metrics.scheduled} of ${metrics.total_requests}`}
          icon="check"
        />
        <KpiTile label="Completed" value={String(completed)} tone="good" icon="check" />
        <KpiTile label="Failed" value={String(failed)} tone="bad" icon="alert" />
        <KpiTile label="Stations online" value={`${onlineStations}/${stations.length}`} icon="stations" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Upcoming contacts" subtitle="Next scheduled, in UTC" className="lg:col-span-2">
          {upcoming.length ? (
            <ul className="divide-y divide-hairline">
              {upcoming.map((c) => (
                <li key={c.request_id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="w-16 font-mono text-xs text-accent">{formatTime(c.start)}</span>
                  <span className="font-mono text-secondary">{c.satellite_id}</span>
                  <span className="text-muted">
                    → {c.station_id} · A{c.antenna}
                  </span>
                  <span className="ml-auto">
                    <StatusBadge status={c.status} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No upcoming contacts.</p>
          )}
        </Card>

        <Card title="Contact outcomes" subtitle="Across the horizon">
          <ul className="flex flex-col gap-3 text-sm">
            <OutcomeRow label="Completed" value={completed} tone="text-good" />
            <OutcomeRow label="Scheduled" value={scheduled} tone="text-accent" />
            <OutcomeRow label="Failed" value={failed} tone="text-bad" />
            <OutcomeRow label="Unscheduled requests" value={metrics.unscheduled} tone="text-muted" />
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Avg utilization" value={formatPct(avgUtilization, 1)} icon="signal" />
        <KpiTile label="Total contacts" value={String(contacts.length)} icon="antenna" />
        <KpiTile label="Satellites" value={String(meta.satellites)} icon="satellite" />
        <KpiTile label="Pass windows" value={String(meta.passes)} icon="schedule" />
      </div>
    </div>
  );
}
