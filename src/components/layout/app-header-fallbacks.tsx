export function HeaderIslandFallback() {
  return (
    <div
      className="flex h-10 min-w-0 flex-1 items-center overflow-hidden rounded-full border border-border/80 bg-card px-1.5 py-1 sm:px-2"
      aria-hidden
    >
      <div className="h-8 w-full rounded-full bg-muted/60" />
    </div>
  );
}

export function HeaderBellFallback() {
  return <div className="size-8 shrink-0 rounded-full bg-muted/60" aria-hidden />;
}
