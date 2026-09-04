import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminSummaryCardProps = {
  children: ReactNode;
  className?: string;
};

/** Soft highlight card for sidebar week summary. */
export function AdminSummaryCard({ children, className }: AdminSummaryCardProps) {
  return (
    <div className={cn("admin-dashboard__summary", className)}>{children}</div>
  );
}
