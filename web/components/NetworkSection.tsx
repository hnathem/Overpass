"use client";

import { useState } from "react";

import { formatPct } from "@/lib/format";
import { useData } from "@/lib/providers";

import { NetworkMap } from "./NetworkMap";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

export function NetworkSection() {
  const { data } = useData();
  const [hovered, setHovered] = useState<string | null>(null);
  if (!data) return null;

  const utilizationById = new Map(data.metrics.by_station.map((s) => [s.station_id, s.utilization]));
  const contactsById = new Map<string, number>();
  for (const contact of data.contacts) {
    contactsById.set(contact.station_id, (contactsById.get(contact.station_id) ?? 0) + 1);
  }

  return (
    <section id="network" className="border-t border-hairline bg-plane">
      <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
        <Reveal>
          <SectionHeading
            index="02"
            title="Ground network"
            subtitle="Where the fleet talks to Earth. Live contacts trail a signal to their satellite; hover a station to focus it."
          />
        </Reveal>

        <Reveal>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
            <div className="rounded-card border border-hairline bg-surface p-5">
              <NetworkMap
                stations={data.stations}
                contacts={data.contacts}
                now={data.meta.now}
                hovered={hovered}
                onHover={setHovered}
              />
            </div>

            <div className="flex flex-col gap-2">
              {data.stations.map((station) => {
                const utilization = utilizationById.get(station.id) ?? 0;
                const online = station.status === "online";
                const focused = hovered === station.id;
                return (
                  <button
                    key={station.id}
                    onMouseEnter={() => setHovered(station.id)}
                    onMouseLeave={() => setHovered(null)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      focused ? "border-accent bg-inset" : "border-hairline hover:bg-inset"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-primary">{station.id}</span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-secondary">
                        <span className={`h-2 w-2 rounded-full ${online ? "bg-good" : "bg-bad"}`} aria-hidden />
                        {online ? "Online" : "Offline"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted">
                      <span>{station.name}</span>
                      <span className="tabular">
                        {contactsById.get(station.id) ?? 0} contacts · {formatPct(utilization, 1)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 w-full rounded-full bg-inset">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${Math.min(utilization * 100, 100)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
