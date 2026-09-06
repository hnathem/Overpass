"use client";

import { formatTime } from "@/lib/format";
import { useData, useTheme } from "@/lib/providers";

import { Logo } from "./Logo";

export function Topbar() {
  const { theme, toggle } = useTheme();
  const { data } = useData();

  return (
    <header className="stars sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-hairline bg-surface px-5 py-3 md:px-8">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 md:hidden">
          <Logo size={22} />
          <span className="text-base font-semibold">Overpass</span>
        </span>
        {data && (
          <span className="flex items-center gap-2 font-mono text-xs text-secondary">
            <span className="pulse h-2 w-2 rounded-full bg-accent" aria-hidden />
            NOW {formatTime(data.meta.now)}
          </span>
        )}
      </div>
      <button
        onClick={toggle}
        className="rounded-lg border border-hairline px-3 py-1.5 text-sm text-secondary transition-colors hover:text-primary"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? "☀ Light" : "☾ Dark"}
      </button>
    </header>
  );
}
