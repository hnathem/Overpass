"use client";

import { useState } from "react";

import { STATUS_META, STATUS_ORDER } from "@/lib/status";
import { useData } from "@/lib/providers";
import type { Contact, ContactStatus } from "@/lib/types";

import { ContactDetail } from "./ContactDetail";
import { Reveal } from "./Reveal";
import { ScheduleBoard } from "./ScheduleBoard";
import { SectionHeading } from "./SectionHeading";

type Filter = "all" | ContactStatus;

export function ScheduleSection() {
  const { data } = useData();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusStation, setFocusStation] = useState<string | null>(null);
  if (!data) return null;

  const contacts = filter === "all" ? data.contacts : data.contacts.filter((c) => c.status === filter);
  const selected: Contact | null = data.contacts.find((c) => c.request_id === selectedId) ?? null;
  const filters: Filter[] = ["all", ...STATUS_ORDER];

  return (
    <section id="schedule" className="border-t border-hairline bg-plane">
      <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
        <Reveal>
          <SectionHeading
            index="01"
            title="Contact schedule"
            subtitle="Every booked contact, by station antenna, over the planning horizon. Hover a row to focus a station; click a block for details."
          />
        </Reveal>

        <Reveal>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {filters.map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === option
                    ? "bg-accent text-black"
                    : "border border-hairline text-secondary hover:text-primary"
                }`}
              >
                {option === "all" ? "All contacts" : STATUS_META[option].label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-card border border-hairline bg-surface p-5">
              <ScheduleBoard
                contacts={contacts}
                stations={data.stations}
                start={data.meta.start}
                end={data.meta.end}
                now={data.meta.now}
                selectedId={selectedId}
                onSelect={(c) => setSelectedId(c.request_id)}
                focusStation={focusStation}
                onHoverStation={setFocusStation}
              />
            </div>
            <ContactDetail contact={selected} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
