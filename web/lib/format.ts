// Formatting helpers. Times are shown in UTC throughout — one timezone, like a
// real operations console, so there's never any ambiguity about when a contact
// happens.

export function formatTime(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes} UTC`;
}

export function formatDayTime(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${day}, ${hours}:${minutes}`;
}

export function formatPct(fraction: number, digits = 0): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}
