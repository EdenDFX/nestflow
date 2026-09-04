import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type SteppedCardProps = ComponentProps<"div"> & {
  cornerActions?: ReactNode;
  /** Width of the top-right notch for one or two circular actions. */
  actionSlots?: 1 | 2;
  tone?: SteppedCardTone;
};

export type SteppedCardTone =
  | "primary"
  | "ink"
  | "muted"
  | "todo"
  | "blocked"
  | "review"
  | "completed";

const toneClassName: Record<SteppedCardTone, string> = {
  primary:
    "bg-primary/12 text-foreground [--nf-step-cut:var(--background)] dark:bg-primary/18",
  ink: "bg-foreground/[0.06] text-foreground [--nf-step-cut:var(--background)] dark:bg-white/[0.06]",
  muted:
    "border border-border/80 bg-card text-card-foreground [--nf-step-cut:var(--background)]",
  todo:
    "border border-border/80 bg-secondary/80 text-foreground [--nf-step-cut:var(--background)] dark:bg-secondary/40",
  blocked:
    "bg-red-500/12 text-red-950 [--nf-step-cut:var(--background)] dark:bg-red-500/15 dark:text-red-100",
  review:
    "bg-amber-400/18 text-amber-950 [--nf-step-cut:var(--background)] dark:bg-amber-400/15 dark:text-amber-100",
  completed:
    "bg-success/15 text-success [--nf-step-cut:var(--background)] dark:bg-success/20 dark:text-success",
};

/** True when the tone uses a lightish face (dark text in light mode). */
export function isSteppedCardLightTone(_tone: SteppedCardTone): boolean {
  return true;
}

export function SteppedCard({
  children,
  className,
  cornerActions,
  actionSlots = 1,
  tone = "primary",
  ...props
}: SteppedCardProps) {
  return (
    <div className={cn("relative isolate", className)} {...props}>
      {cornerActions ? (
        <div className="absolute top-0 right-0 z-20 flex items-start gap-2">
          {cornerActions}
        </div>
      ) : null}

      <div
        className={cn(
          "nestflow-stepped relative flex h-full min-h-[12rem] flex-col justify-between gap-4 p-4 pe-5",
          actionSlots === 2 && "nestflow-stepped--2",
          toneClassName[tone],
        )}
      >
        {children}
      </div>
    </div>
  );
}

const actionClassName =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#1c1917] text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.55)] transition-colors hover:bg-[#292524] focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

export function SteppedCardAction({
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <button type="button" className={cn(actionClassName, className)} {...props} />
  );
}

export function SteppedCardActionLink({
  className,
  href,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  return (
    <Link href={href} className={cn(actionClassName, className)} {...props} />
  );
}
