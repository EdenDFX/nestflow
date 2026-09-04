import { cn } from "@/lib/utils";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-lg bg-muted/70", className)}
      aria-hidden
    />
  );
}

export function TaskDetailSkeleton() {
  return (
    <div
      className="space-y-4"
      aria-busy="true"
      aria-label="Loading task"
    >
      <div className="flex flex-wrap gap-2">
        <SkeletonBlock className="h-6 w-20 rounded-full" />
        <SkeletonBlock className="h-6 w-24 rounded-full" />
        <SkeletonBlock className="h-6 w-28 rounded-full" />
      </div>
      <SkeletonBlock className="h-36 rounded-xl" />
      <SkeletonBlock className="h-28 rounded-xl" />
      <SkeletonBlock className="h-24 rounded-xl" />
      <SkeletonBlock className="h-32 rounded-xl" />
    </div>
  );
}
