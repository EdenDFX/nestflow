"use client";

import { useRouter } from "next/navigation";

import { TaskPaneShell } from "@/components/tasks/task-pane";
import { Spinner } from "@/components/ui/spinner";

export function TaskPaneLoading() {
  const router = useRouter();

  return (
    <TaskPaneShell title="Loading task…" onClose={() => router.back()}>
      <div
        className="flex min-h-48 items-center justify-center py-12"
        aria-busy="true"
        aria-label="Loading task"
      >
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    </TaskPaneShell>
  );
}
