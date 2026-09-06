"use client";

import { useState } from "react";

import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { ScheduleTimeline } from "@/components/ScheduleTimeline";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { STATUS_META, STATUS_ORDER } from "@/lib/status";
import { useData } from "@/lib/providers";
import type { ContactStatus } from "@/lib/types";

type Filter = ContactStatus | "all";

export default function SchedulePage() {
  const { data, error } = useData();
  const [filter, setFilter] = useState<Filter>("all");
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const contacts = filter === "all" ? data.contacts : data.contacts.filter((c) => c.status === filter);

  const filters: Filter[] = ["all", ...STATUS_ORDER];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Schedule"
        title="Contact timeline"
        subtitle="Every booked contact, by station antenna, over the planning horizon."
      />

      <Card
        title="Antenna schedule"
        subtitle="One row per antenna · times in UTC"
        right={
          <div className="flex items-center gap-0.5 rounded-lg border border-hairline p-0.5">
            {filters.map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  filter === option ? "bg-accent text-black" : "text-secondary hover:text-primary"
                }`}
              >
                {option === "all" ? "All" : STATUS_META[option].label}
              </button>
            ))}
          </div>
        }
      >
        <ScheduleTimeline
          contacts={contacts}
          stations={data.stations}
          start={data.meta.start}
          end={data.meta.end}
          now={data.meta.now}
        />
      </Card>
    </div>
  );
}
