"use client";

import { SearchIcon } from "@/components/icons/search";
import { Button } from "@/components/ui/button";
import { openCommandPalette } from "@/lib/search/types";
import { cn } from "@/lib/utils";

type SearchTriggerProps = {
  className?: string;
};

export function SearchTrigger({ className }: SearchTriggerProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "h-8 gap-2 rounded-full px-2.5 text-muted-foreground sm:px-3",
        className,
      )}
      onClick={() => openCommandPalette()}
      aria-label="Search tasks and people"
    >
      <SearchIcon className="inline-flex sm:hidden" size={14} aria-hidden />
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
        ⌘K
      </kbd>
    </Button>
  );
}
