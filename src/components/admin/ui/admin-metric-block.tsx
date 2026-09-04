"use client";

import { motion, useReducedMotion } from "motion/react";

import { ADMIN_SPRING } from "@/components/admin/admin-shared";
import { cn } from "@/lib/utils";

type AdminMetricTone =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "info";

type AdminMetricBlockProps = {
  label: string;
  value: number | string;
  tone?: AdminMetricTone;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

const toneClass: Record<AdminMetricTone, string> = {
  default: "",
  primary: "admin-dashboard__metric--primary",
  success: "admin-dashboard__metric--success",
  warning: "admin-dashboard__metric--warning",
  destructive: "admin-dashboard__metric--destructive",
  info: "admin-dashboard__metric--info",
};

/** Horizontal metric bar for the admin sidebar. */
export function AdminMetricBlock({
  label,
  value,
  tone = "default",
  active = false,
  onClick,
  className,
}: AdminMetricBlockProps) {
  const preferReduced = useReducedMotion();
  const interactive = Boolean(onClick);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={preferReduced || !interactive ? undefined : { scale: 0.97 }}
      transition={preferReduced ? { duration: 0.01 } : ADMIN_SPRING}
      className={cn(
        "admin-dashboard__metric",
        toneClass[tone],
        active && "is-active",
        !interactive && "cursor-default",
        className,
      )}
    >
      <span className="admin-dashboard__metric-value">{value}</span>
      <span className="admin-dashboard__metric-label">{label}</span>
    </motion.button>
  );
}
