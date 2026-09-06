"use client";

import { useCountUp } from "@/lib/hooks";

/** A headline number that counts up on first render, with a label beneath it. */
export function CountStat({
  value,
  label,
  suffix = "",
  decimals = 0,
}: {
  value: number;
  label: string;
  suffix?: string;
  decimals?: number;
}) {
  const animated = useCountUp(value);
  return (
    <div>
      <div className="tabular font-mono text-2xl font-semibold text-primary md:text-3xl">
        {animated.toFixed(decimals)}
        {suffix}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}
