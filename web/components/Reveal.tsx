"use client";

import type { ReactNode } from "react";

import { useInView } from "@/lib/hooks";

/** Wraps content so it rises into view as it's scrolled to. */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal ${inView ? "is-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}
