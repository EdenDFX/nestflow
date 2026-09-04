"use client";

import { LayoutGroup, motion, useReducedMotion } from "motion/react";

import { ADMIN_SPRING } from "@/components/admin/admin-shared";
import { cn } from "@/lib/utils";

export type AdminSectionTab = {
  id: string;
  label: string;
};

type AdminSectionTabsProps = {
  tabs: AdminSectionTab[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: "default" | "dashboard";
};

/** Pill segment control for admin overview sections. */
export function AdminSectionTabs({
  tabs,
  value,
  onChange,
  className,
  variant = "default",
}: AdminSectionTabsProps) {
  const dashboard = variant === "dashboard";
  const preferReduced = useReducedMotion();
  const spring = preferReduced ? { duration: 0.01 } : ADMIN_SPRING;

  return (
    <LayoutGroup id="admin-section-tabs">
      <div
        role="tablist"
        aria-label="Admin sections"
        className={cn(
          dashboard
            ? "admin-dashboard__section-tabs"
            : "inline-flex flex-wrap gap-1 rounded-full bg-muted/40 p-1",
          className,
        )}
      >
        {tabs.map((tab) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              className={cn(
                dashboard
                  ? cn(
                      "admin-dashboard__section-tab",
                      selected && "is-active",
                    )
                  : cn(
                      "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                      selected
                        ? "text-background"
                        : "text-muted-foreground hover:text-foreground",
                    ),
              )}
            >
              {selected ? (
                <motion.span
                  layoutId={
                    dashboard
                      ? "admin-dashboard-tab-pill"
                      : "admin-default-tab-pill"
                  }
                  className={
                    dashboard
                      ? "admin-dashboard__section-tab-pill"
                      : "absolute inset-0 -z-10 rounded-full bg-foreground shadow-sm"
                  }
                  transition={spring}
                />
              ) : null}
              <span className="relative z-[1]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
