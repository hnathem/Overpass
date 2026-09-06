"use client";

import { useState } from "react";

import { formatTime } from "@/lib/format";
import { useData } from "@/lib/providers";
import type { RequestRow, Satellite } from "@/lib/types";

import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

type Tab = "fleet" | "requests";
type RequestFilter = "all" | "scheduled" | "unscheduled";

function FleetTable({ rows }: { rows: { satellite: Satellite; count: number; next: string }[] }) {
  return (
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
  );
}

function RequestsTable({
  rows,
  filter,
  onFilter,
}: {
  rows: RequestRow[];
  filter: RequestFilter;
  onFilter: (value: RequestFilter) => void;
}) {
  const filters: RequestFilter[] = ["all", "scheduled", "unscheduled"];
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {filters.map((option) => (
          <button
            key={option}
            onClick={() => onFilter(option)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
              filter === option ? "bg-accent text-black" : "border border-hairline text-secondary hover:text-primary"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
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
    </div>
  );
}

export function OperationsSection() {
  const { data } = useData();
  const [tab, setTab] = useState<Tab>("fleet");
  const [requestFilter, setRequestFilter] = useState<RequestFilter>("all");
  if (!data) return null;

  const nowMs = new Date(data.meta.now).getTime();
  const fleet = data.satellites.map((satellite) => {
    const theirs = data.contacts
      .filter((c) => c.satellite_id === satellite.id)
      .sort((a, b) => (a.start < b.start ? -1 : 1));
    const upcoming = theirs.find((c) => new Date(c.start).getTime() >= nowMs);
    return { satellite, count: theirs.length, next: upcoming ? formatTime(upcoming.start) : "—" };
  });
  const requests = data.requests.filter((r) =>
    requestFilter === "all" ? true : requestFilter === "scheduled" ? r.scheduled : !r.scheduled,
  );

  return (
    <section id="operations" className="border-t border-hairline bg-plane">
      <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
        <Reveal>
          <SectionHeading
            index="03"
            title="Operations"
            subtitle="The fleet's booked activity, and how the request queue was resolved."
          />
        </Reveal>

        <Reveal>
          <div className="mb-4 flex w-fit items-center gap-0.5 rounded-lg border border-hairline p-0.5">
            {(["fleet", "requests"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setTab(option)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                  tab === option ? "bg-accent text-black" : "text-secondary hover:text-primary"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-card border border-hairline bg-surface p-5">
            {tab === "fleet" ? (
              <FleetTable rows={fleet} />
            ) : (
              <RequestsTable rows={requests} filter={requestFilter} onFilter={setRequestFilter} />
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
