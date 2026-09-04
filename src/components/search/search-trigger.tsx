"use client";

import { useCallback, useState } from "react";

import { SearchIcon } from "@/components/icons/search";
import { Button } from "@/components/ui/button";
import { GooeyInput } from "@/components/ui/gooey-input";
import { openCommandPalette } from "@/lib/search/types";
import { cn } from "@/lib/utils";

type SearchTriggerProps = {
  className?: string;
};

export function SearchTrigger({ className }: SearchTriggerProps) {
  const [gooeyKey, setGooeyKey] = useState(0);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      return;
    }
    openCommandPalette();
    window.setTimeout(() => {
      setGooeyKey((current) => current + 1);
    }, 180);
  }, []);

  return (
    <div className={cn("flex items-center", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 rounded-full lg:hidden"
        onClick={() => openCommandPalette()}
        aria-label="Search tasks and people"
      >
        <SearchIcon className="inline-flex" size={14} aria-hidden />
      </Button>

      <GooeyInput
        key={gooeyKey}
        placeholder="Search"
        collapsedWidth={118}
        expandedWidth={168}
        expandedOffset={36}
        gooeyBlur={4}
        onOpenChange={handleOpenChange}
        className="hidden lg:flex"
        classNames={{
          trigger:
            "h-9 overflow-hidden bg-muted/80 text-foreground ring-border/50 hover:bg-muted",
          bubbleSurface: "bg-muted/80 text-foreground ring-border/50",
          input:
            "min-w-0 truncate text-foreground placeholder:text-muted-foreground disabled:placeholder:text-muted-foreground",
        }}
      />
    </div>
  );
}
