"use client";

import { useState } from "react";

import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { formatTime } from "@/lib/format";
import { useData } from "@/lib/providers";

type Filter = "all" | "scheduled" | "unscheduled";

export default function RequestsPage() {
  const { data, error } = useData();
  const [show, setShow] = useState<Filter>("all");
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const rows = data.requests.filter((r) =>
    show === "all" ? true : show === "scheduled" ? r.scheduled : !r.scheduled,
  );

  const filters: Filter[] = ["all", "scheduled", "unscheduled"];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Requests"
        title="Contact requests"
        subtitle="Every request, and whether it made the schedule."
      />

      <Card
        title={`${rows.length} requests`}
        right={
          <div className="flex items-center gap-0.5 rounded-lg border border-hairline p-0.5">
            {filters.map((option) => (
              <button
                key={option}
                onClick={() => setShow(option)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  show === option ? "bg-accent text-black" : "text-secondary hover:text-primary"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-4 font-medium">Request</th>
                <th className="py-2 pr-4 font-medium">Satellite</th>
                <th className="py-2 pr-4 font-medium">Priority</th>
                <th className="py-2 pr-4 text-right font-medium">Duration</th>
                <th className="py-2 pr-4 font-medium">Outcome</th>
                <th className="py-2 font-medium">Where / why</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-hairline align-top last:border-0">
                  <td className="py-2 pr-4 font-mono text-primary">{r.id}</td>
                  <td className="py-2 pr-4 font-mono text-secondary">{r.satellite_id}</td>
                  <td className="py-2 pr-4 text-secondary">{r.priority}</td>
                  <td className="tabular py-2 pr-4 text-right text-secondary">{r.duration_min} min</td>
                  <td className="py-2 pr-4">
                    {r.scheduled ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-good">
                        <span className="h-2 w-2 rounded-full bg-good" aria-hidden />
                        Scheduled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-bad">
                        <span className="h-2 w-2 rounded-full bg-bad" aria-hidden />
                        Bumped
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-xs text-muted">
                    {r.scheduled ? (
                      <span className="font-mono">
                        {r.station_id} · {r.start ? formatTime(r.start) : ""}
                      </span>
                    ) : (
                      r.reason
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
