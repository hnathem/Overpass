"use client";

import { Hero } from "@/components/Hero";
import { NetworkSection } from "@/components/NetworkSection";
import { OperationsSection } from "@/components/OperationsSection";
import { ScheduleSection } from "@/components/ScheduleSection";
import { ErrorState } from "@/components/StateViews";
import { TopNav } from "@/components/TopNav";
import { useData } from "@/lib/providers";

export default function Page() {
  const { error } = useData();

  return (
    <>
      <TopNav />
      <Hero />
      {error ? (
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
          <ErrorState message={error} />
        </div>
      ) : (
        <>
          <ScheduleSection />
          <NetworkSection />
          <OperationsSection />
        </>
      )}
      <footer className="border-t border-hairline bg-plane">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-2 px-5 py-10 text-xs text-muted md:px-8">
          <span>Overpass · synthetic scenario · times in UTC</span>
          <span className="font-mono">priority-based contact scheduling</span>
        </div>
      </footer>
    </>
  );
}
