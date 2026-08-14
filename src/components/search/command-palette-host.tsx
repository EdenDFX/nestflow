"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { OPEN_SEARCH_EVENT } from "@/lib/search/types";

const CommandPalette = dynamic(
  () =>
    import("@/components/search/command-palette").then(
      (mod) => mod.CommandPalette,
    ),
  { ssr: false },
);

export function CommandPaletteHost() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) {
      return;
    }

    function arm() {
      setLoaded(true);
    }

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

      if (isPalette || (isSlash && !typingInField)) {
        event.preventDefault();
        setLoaded(true);
      }
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, arm);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, arm);
    };
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <CommandPalette defaultOpen />;
}
