"use client";

import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { formatTime } from "@/lib/format";
import { useData } from "@/lib/providers";

export default function FleetPage() {
  const { data, error } = useData();
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const nowMs = new Date(data.meta.now).getTime();
  const rows = data.satellites.map((satellite) => {
    const theirs = data.contacts
      .filter((c) => c.satellite_id === satellite.id)
      .sort((a, b) => (a.start < b.start ? -1 : 1));
    const upcoming = theirs.find((c) => new Date(c.start).getTime() >= nowMs);
    return { satellite, count: theirs.length, next: upcoming ? formatTime(upcoming.start) : "—" };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Fleet"
        title="Satellites"
        subtitle="Contacts booked per satellite across the horizon."
      />

      <Card title="Fleet activity">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-4 font-medium">Satellite</th>
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 text-right font-medium">Contacts</th>
                <th className="py-2 text-right font-medium">Next (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.satellite.id} className="border-b border-hairline last:border-0">
                  <td className="py-2 pr-4 font-mono text-primary">{row.satellite.id}</td>
                  <td className="py-2 pr-4 text-secondary">{row.satellite.name}</td>
                  <td className="tabular py-2 pr-4 text-right text-secondary">{row.count}</td>
                  <td className="tabular py-2 text-right font-mono text-accent">{row.next}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
