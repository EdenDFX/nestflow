"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { DynamicIslandView } from "@/components/ui/dynamic-island";

export type IslandRoom = "resting" | "grown" | "dominant";

function roomForView(view: DynamicIslandView): IslandRoom {
  switch (view) {
    case "timer":
    case "notification":
      return "dominant";
    case "strip":
      return "grown";
    case "idle":
    case "action":
      return "resting";
    default: {
      const _exhaustive: never = view;
      return _exhaustive;
    }
  }
}

type IslandChromeContextValue = {
  view: DynamicIslandView;
  room: IslandRoom;
  setView: (view: DynamicIslandView) => void;
};

const IslandChromeContext = createContext<IslandChromeContextValue | null>(
  null,
);

export function IslandChromeProvider({ children }: { children: ReactNode }) {
  const [view, setViewState] = useState<DynamicIslandView>("idle");

  const setView = useCallback((next: DynamicIslandView) => {
    setViewState((current) => (current === next ? current : next));
  }, []);

  const value = useMemo(
    () => ({
      view,
      room: roomForView(view),
      setView,
    }),
    [view, setView],
  );

  return (
    <IslandChromeContext.Provider value={value}>
      {children}
    </IslandChromeContext.Provider>
  );
}

export function useIslandChrome() {
  const context = useContext(IslandChromeContext);
  if (!context) {
    throw new Error("useIslandChrome must be used within IslandChromeProvider");
  }
  return context;
}

/** Safe for WorkspaceIsland when provider is present. */
export function useIslandChromeReporter() {
  return useContext(IslandChromeContext);
}
