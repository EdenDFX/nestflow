"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AdminWizardStep = {
  id: string;
  label: string;
};

type AdminDrawerWizardProps = {
  steps: AdminWizardStep[];
  currentStep: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer: ReactNode;
  className?: string;
};

/** Shared step header and footer for admin drawer flows. */
export function AdminDrawerWizard({
  steps,
  currentStep,
  title,
  description,
  children,
  footer,
  className,
}: AdminDrawerWizardProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-4", className)}>
      <div className="space-y-3 border-b border-border/70 pb-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <ol className="flex flex-wrap gap-2">
          {steps.map((step, index) => {
            const done = index < currentIndex;
            const active = step.id === currentStep;
            return (
              <li
                key={step.id}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  active && "bg-primary text-primary-foreground",
                  done && !active && "bg-muted text-foreground",
                  !done && !active && "bg-muted/40 text-muted-foreground",
                )}
              >
                {index + 1}. {step.label}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/70 pt-4">
        {footer}
      </div>
    </div>
  );
}
