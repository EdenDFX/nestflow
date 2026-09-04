"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "@/lib/sounds/toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchWorkspaceAction } from "@/lib/search/actions";
import { OPEN_SEARCH_EVENT } from "@/lib/search/types";
import type { SearchResults } from "@/lib/search/types";
import { PriorityBadge, StatusBadge } from "@/components/tasks/status-badge";
import { personLabel } from "@/lib/people/label";
import { cn } from "@/lib/utils";

const EMPTY: SearchResults = { query: "", tasks: [], people: [] };

export function CommandPalette({
  defaultOpen = false,
}: {
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const isPalette =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const isSlash =
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey;
      const target = event.target;
      const typingInField =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (isPalette || (isSlash && !typingInField && !open)) {
        event.preventDefault();
        setOpen(true);
      }
    }

    function onOpenEvent() {
      setOpen(true);
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpenEvent);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => {
      startTransition(async () => {
        const next = await searchWorkspaceAction(query);
        setResults(next);
      });
    }, 180);
    return () => window.clearTimeout(handle);
  }, [open, query]);

  function close() {
    setOpen(false);
    setQuery("");
    setResults(EMPTY);
  }

  function goToTask(taskId: string) {
    close();
    router.push(`/app/tasks/${taskId}`);
  }

  async function copyNestId(nestId: string | null) {
    if (!nestId) {
      toast.error("This person has no Nest ID yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(`@${nestId}`);
      toast.success(`Copied @${nestId} for mentions.`);
    } catch {
      toast.error("Could not copy Nest ID.");
    }
  }

  const empty =
    query.trim().length > 0 &&
    results.tasks.length === 0 &&
    results.people.length === 0 &&
    !pending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
        else setOpen(true);
      }}
    >
      <DialogContent className="gap-3 p-3 sm:max-w-lg" showCloseButton>
        <DialogHeader className="px-1">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>
            Find tasks and people you can already see. Press Esc to close.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tasks and people"
          aria-label="Search tasks and people"
          autoComplete="off"
          autoFocus
        />
        <div className="nf-scroll max-h-80 space-y-3 overflow-y-auto px-1 pb-1">
          {query.trim().length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Type a title, Nest ID, or name.
            </p>
          ) : null}
          {pending && query.trim().length > 0 ? (
            <p className="text-xs text-muted-foreground">Searching…</p>
          ) : null}
          {empty ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No matches for “{results.query}”.
            </p>
          ) : null}

          {results.tasks.length > 0 ? (
            <section className="space-y-1">
              <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Tasks
              </h3>
              <ul>
                {results.tasks.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => goToTask(task.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted/70"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {task.title}
                      </span>
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {results.people.length > 0 ? (
            <section className="space-y-1">
              <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                People
              </h3>
              <ul>
                {results.people.map((person) => (
                  <li key={person.userId}>
                    <button
                      type="button"
                      onClick={() => void copyNestId(person.nestId)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted/70",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {personLabel(person)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {person.nestId ?? "Copy Nest ID"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
