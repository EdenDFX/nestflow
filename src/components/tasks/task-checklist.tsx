"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addChecklistItemAction,
  removeChecklistItemAction,
  toggleChecklistItemAction,
} from "@/lib/tasks/collaboration-actions";
import type { ChecklistItem } from "@/lib/tasks/collaboration-types";
import { cn } from "@/lib/utils";

export function TaskChecklist({
  taskId,
  items,
}: {
  taskId: string;
  items: ChecklistItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const doneCount = items.filter((item) => item.isDone).length;

  function addItem(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      const result = await addChecklistItemAction({ taskId, title });
      if (!result.ok) {
        toast.error(result.error ?? "Could not add item.");
        return;
      }
      setTitle("");
      router.refresh();
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Checklist</h2>
        <span className="text-xs text-muted-foreground">
          {doneCount}/{items.length} done
        </span>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2"
          >
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await toggleChecklistItemAction({
                    itemId: item.id,
                    taskId,
                    isDone: !item.isDone,
                  });
                  if (!result.ok) {
                    toast.error(result.error ?? "Could not update item.");
                    return;
                  }
                  router.refresh();
                })
              }
              className={cn(
                "flex size-6 items-center justify-center rounded-md border",
                item.isDone
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border",
              )}
              aria-label={item.isDone ? "Mark incomplete" : "Mark complete"}
            >
              {item.isDone ? <Check className="size-3.5" /> : null}
            </button>
            <span
              className={cn(
                "flex-1 text-sm",
                item.isDone && "text-muted-foreground line-through",
              )}
            >
              {item.title}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await removeChecklistItemAction({
                    itemId: item.id,
                    taskId,
                  });
                  if (!result.ok) {
                    toast.error(result.error ?? "Could not remove item.");
                    return;
                  }
                  router.refresh();
                })
              }
              aria-label="Remove checklist item"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </li>
        ))}
      </ul>

      <form onSubmit={addItem} className="flex gap-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add checklist item"
          disabled={pending}
        />
        <Button type="submit" disabled={pending || !title.trim()}>
          <Plus className="size-4" />
          Add
        </Button>
      </form>
    </section>
  );
}
