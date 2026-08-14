import { cn } from "@/lib/utils";

function Block({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-lg bg-muted/70", className)}
      aria-hidden
    />
  );
}

export function PageHeaderLoading({
  withAction = true,
}: {
  withAction?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <Block className="h-9 w-48" />
        <Block className="h-4 w-80 max-w-full" />
      </div>
      {withAction ? <Block className="h-9 w-32" /> : null}
    </div>
  );
}

export function DashboardLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading">
      <PageHeaderLoading />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {["a", "b", "c", "d"].map((key) => (
          <Block key={key} className="min-h-[12rem] rounded-[1.75rem]" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {["e", "f", "g", "h"].map((key) => (
          <Block key={key} className="min-h-[12rem] rounded-[1.75rem]" />
        ))}
      </div>
    </div>
  );
}

export function WorkLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <PageHeaderLoading />
      <div className="flex gap-2">
        <Block className="h-8 w-16 rounded-lg" />
        <Block className="h-8 w-14 rounded-lg" />
        <Block className="h-8 w-20 rounded-lg" />
      </div>
      <Block className="h-[28rem] rounded-2xl" />
    </div>
  );
}

export function ListLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <PageHeaderLoading />
      <Block className="h-10 w-64 max-w-full" />
      <Block className="h-[28rem] rounded-xl" />
    </div>
  );
}

export function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="flex gap-2">
        <Block className="h-8 w-16 rounded-lg" />
        <Block className="h-8 w-20 rounded-lg" />
      </div>
      <Block className="h-28 rounded-2xl" />
      <Block className="h-[24rem] rounded-xl" />
    </div>
  );
}
