"use client";

import { useClock } from "@/lib/hooks";
import { useData } from "@/lib/providers";

import { CountStat } from "./CountStat";
import { Starfield } from "./Starfield";

function utcClock(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

/** The full-bleed opening: live star field, a running UTC clock, headline stats. */
export function Hero() {
  const { data } = useData();
  const now = useClock();

  return (
    <section id="overview" className="relative overflow-hidden bg-[#0a0e14] text-white">
      <div className="stars absolute inset-0">
        <Starfield />
      </div>
      <div className="hero-glow pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-[1200px] px-5 pb-16 pt-28 md:px-8 md:pb-24 md:pt-36">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
          Overpass · Mission Control
        </div>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
          Every pass, on the right antenna.
        </h1>
        <p className="mt-5 max-w-xl text-base text-white/60">
          A scheduler for a low-Earth-orbit satellite network. It turns a queue of contact requests
          and a tangle of overlapping pass windows into a conflict-free plan — and shows it live.
        </p>

        <div className="mt-8 flex items-center gap-3 font-mono">
          <span className="pulse h-2 w-2 rounded-full bg-accent" aria-hidden />
          <span className="tabular text-2xl font-semibold tracking-wider text-white md:text-3xl">
            {utcClock(now)}
          </span>
          <span className="text-sm text-white/40">UTC</span>
        </div>

        <div className="mt-12 grid max-w-2xl grid-cols-2 gap-8 sm:grid-cols-4">
          <CountStat value={data?.meta.satellites ?? 0} label="Satellites" />
          <CountStat value={data?.meta.stations ?? 0} label="Stations" />
          <CountStat value={data?.metrics.scheduled ?? 0} label="Contacts booked" />
          <CountStat value={(data?.metrics.schedule_rate ?? 0) * 100} label="Scheduled" suffix="%" />
        </div>

        <a
          href="#schedule"
          className="mt-14 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
        >
          Explore the schedule <span aria-hidden>↓</span>
        </a>
      </div>
    </section>
  );
}
