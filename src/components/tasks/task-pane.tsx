"use client";

import { useRouter } from "next/navigation";

import {
  Drawer,
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from "@/components/ui/drawer";

export function TaskPaneShell({
  title,
  taskId,
  children,
  onClose,
}: {
  title: string;
  taskId?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const fullPageLink = taskId ? (
    <a
      href={`/app/tasks/${taskId}`}
      className="text-foreground underline-offset-4 hover:underline"
    >
      Open full page
    </a>
  ) : (
    <span className="text-muted-foreground">Fetching task details…</span>
  );

  return (
    <Drawer
      open
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
      position="center"
    >
      <DrawerPopup
        showCloseButton
        className="flex max-h-[min(90dvh,calc(100%-2rem))] min-h-0 w-full max-w-2xl flex-col overflow-hidden"
      >
        <DrawerHeader className="shrink-0 border-b border-border/80 text-center sm:text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{fullPageLink}</DrawerDescription>
        </DrawerHeader>
        <DrawerPanel
          scrollable={false}
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-auto pb-6"
        >
          {children}
        </DrawerPanel>
      </DrawerPopup>
    </Drawer>
  );
}

export function TaskPane({
  taskId,
  title,
  children,
}: {
  taskId: string;
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <TaskPaneShell
      taskId={taskId}
      title={title}
      onClose={() => router.back()}
    >
      {children}
    </TaskPaneShell>
  );
}
