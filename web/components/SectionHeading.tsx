/** A numbered section header — the editorial rhythm that runs down the page. */
export function SectionHeading({
  index,
  title,
  subtitle,
}: {
  index: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 flex items-baseline gap-4">
      <span className="font-mono text-sm font-medium text-accent">{index}</span>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-primary md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 max-w-xl text-sm text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}
