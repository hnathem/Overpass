"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "./icons";
import { Logo } from "./Logo";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Mission Control", icon: "control" },
  { href: "/schedule", label: "Schedule", icon: "schedule" },
  { href: "/stations", label: "Stations", icon: "stations" },
  { href: "/fleet", label: "Fleet", icon: "fleet" },
  { href: "/requests", label: "Requests", icon: "requests" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-surface md:flex">
      <div className="flex items-center gap-2.5 px-6 py-5">
        <Logo size={28} />
        <span className="text-lg font-semibold tracking-tight">Overpass</span>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-2">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg border-l-2 px-3 py-2 text-sm transition-colors ${
                active
                  ? "border-accent bg-inset font-medium text-primary"
                  : "border-transparent text-secondary hover:bg-inset hover:text-primary"
              }`}
            >
              <Icon name={item.icon} className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-6 py-4 font-mono text-xs text-muted">Synthetic scenario · UTC</div>
    </aside>
  );
}
