// Shown instead of content while the data loads, or if it can't be loaded.

export function LoadingState() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-hidden>
      <div className="h-6 w-56 rounded bg-surface" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 rounded-card border border-hairline bg-surface" />
        ))}
      </div>
      <div className="h-80 rounded-card border border-hairline bg-surface" />
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-card border border-hairline bg-surface p-10 text-center">
      <p className="text-sm font-medium text-bad">Couldn&apos;t load the mission data</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{message}</p>
      <p className="mt-4 text-xs text-muted">
        Generate it with <code className="rounded bg-inset px-1 py-0.5">make export</code>.
      </p>
    </div>
  );
}
