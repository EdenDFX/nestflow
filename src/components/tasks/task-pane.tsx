"use client";

import { useRouter } from "next/navigation";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
    <Sheet
      open
      onOpenChange={(next) => {
        if (!next) {
          router.back();
        }
      }}
    >
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border/80">
          <SheetTitle className="pr-8">{title}</SheetTitle>
          <SheetDescription>
            <a
              href={`/app/tasks/${taskId}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              Open full page
            </a>
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 py-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
