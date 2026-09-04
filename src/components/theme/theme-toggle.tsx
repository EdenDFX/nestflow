"use client";

import { useTheme } from "@wrksz/themes/client";
import { useEffect, useState } from "react";

import { MoonIcon } from "@/components/icons/moon";
import { SunIcon } from "@/components/icons/sun";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { playAppSound } from "@/lib/sounds/play";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label="Toggle color theme"
          onClick={() => {
            playAppSound(isDark ? "toggleOff" : "toggleOn");
            setTheme(isDark ? "light" : "dark");
          }}
        >
          <SunIcon
            className={cn(
              "inline-flex transition-all",
              isDark ? "scale-0 -rotate-90" : "scale-100 rotate-0",
            )}
          />
          <MoonIcon
            className={cn(
              "absolute inline-flex transition-all",
              isDark ? "scale-100 rotate-0" : "scale-0 rotate-90",
            )}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Toggle theme</TooltipContent>
    </Tooltip>
  );
}
