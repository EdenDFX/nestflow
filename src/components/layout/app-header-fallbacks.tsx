export function HeaderIslandFallback() {
  return (
    <div
      className="mx-auto flex h-9 w-[9.5rem] items-center justify-center overflow-hidden rounded-full border border-border/80 bg-card"
      aria-hidden
    >
      <div className="h-6 w-20 rounded-full bg-muted/60" />
    </div>
  );
}

export function HeaderBellFallback() {
  return <div className="size-8 shrink-0 rounded-full bg-muted/60" aria-hidden />;
}
