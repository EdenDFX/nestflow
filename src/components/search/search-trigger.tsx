"use client";

import { Button } from "@/components/ui/button";
import { openCommandPalette } from "@/lib/search/types";

export function SearchTrigger() {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-8 gap-2 rounded-full px-3 text-muted-foreground"
      onClick={() => openCommandPalette()}
      aria-label="Search tasks and people"
    >
      Search
      <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
        ⌘K
      </kbd>
    </Button>
  );
}
