import { Icon, type IconName } from "./icons";

type Tone = "default" | "good" | "bad" | "accent";

const TONE_CLASS: Record<Tone, string> = {
  default: "text-primary",
  good: "text-good",
  bad: "text-bad",
  accent: "text-accent",
};

/** One headline number, with an icon and an optional secondary line. */
export function KpiTile({
  label,
  value,
  sub,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: IconName;
  tone?: Tone;
}) {
  return (
    <div className="rounded-card border border-hairline bg-surface p-5">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        {icon && (
          <span className="rounded-lg border border-hairline bg-inset p-1.5 text-accent">
            <Icon name={icon} className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className={`tabular mt-3 text-2xl font-semibold ${TONE_CLASS[tone]}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}
