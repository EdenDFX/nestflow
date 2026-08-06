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
  primary: "bg-primary text-[#1c1917] [--nf-step-cut:var(--background)]",
  ink: "bg-[#1c1917] text-white [--nf-step-cut:var(--background)] dark:bg-[#0c0a09]",
  muted:
    "border border-border/80 bg-card text-card-foreground [--nf-step-cut:var(--background)]",
  // Status surfaces for task cards
  todo: "bg-emerald-500 text-white [--nf-step-cut:var(--background)]",
  blocked: "bg-red-600 text-white [--nf-step-cut:var(--background)]",
  review: "bg-amber-400 text-[#1c1917] [--nf-step-cut:var(--background)]",
  completed:
    "border border-border/70 bg-muted/70 text-muted-foreground opacity-80 [--nf-step-cut:var(--background)]",
};

/** True when the tone uses a lightish face (dark text). */
export function isSteppedCardLightTone(tone: SteppedCardTone): boolean {
  return (
    tone === "primary" ||
    tone === "muted" ||
    tone === "review" ||
    tone === "completed"
  );
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
