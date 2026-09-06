"use client";

import { useEffect, useState } from "react";

import { formatTime } from "@/lib/format";
import { useScrollSpy } from "@/lib/hooks";
import { useData, useTheme } from "@/lib/providers";

import { Logo } from "./Logo";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "schedule", label: "Schedule" },
  { id: "network", label: "Network" },
  { id: "operations", label: "Operations" },
];

export function TopNav() {
  const active = useScrollSpy(SECTIONS.map((s) => s.id));
  const { theme, toggle } = useTheme();
  const { data } = useData();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 transition-colors ${
        scrolled ? "border-b border-hairline bg-surface" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-3 md:px-8">
        <a href="#overview" className="flex items-center gap-2.5">
          <Logo size={26} />
          <span className={`text-base font-semibold tracking-tight ${scrolled ? "text-primary" : "text-white"}`}>
            Overpass
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {SECTIONS.map((section) => {
            const isActive = active === section.id;
            const base = scrolled ? "text-secondary" : "text-white/70";
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  isActive ? (scrolled ? "text-primary" : "text-white") : `${base} hover:text-primary`
                }`}
              >
                {section.label}
                {isActive && <span className="ml-2 inline-block h-1 w-1 rounded-full bg-accent align-middle" />}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {data && (
            <span
              className={`hidden items-center gap-1.5 font-mono text-xs sm:flex ${
                scrolled ? "text-secondary" : "text-white/70"
              }`}
            >
              <span className="pulse h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              {formatTime(data.meta.now)}
            </span>
          )}
          <button
            onClick={toggle}
            className={`rounded-lg border px-2.5 py-1 text-sm transition-colors ${
              scrolled ? "border-hairline text-secondary hover:text-primary" : "border-white/20 text-white/80 hover:text-white"
            }`}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>
      </div>
    </header>
  );
}
