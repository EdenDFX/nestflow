import { cn } from "@/lib/utils";

type NestFlowMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  tone?: "brand" | "panel";
};

const sizeClasses = {
  sm: "size-8 rounded-lg text-sm",
  md: "size-11 rounded-xl text-base",
  lg: "size-16 rounded-2xl text-2xl",
} as const;

const toneClasses = {
  brand:
    "bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_rgba(255,99,0,0.55)] ring-1 ring-white/15",
  panel:
    "bg-[#1c1916] text-primary shadow-[0_12px_40px_-12px_rgba(255,99,0,0.65)] ring-1 ring-white/10",
} as const;

export function NestFlowMark({
  className,
  size = "md",
  tone = "brand",
}: NestFlowMarkProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center font-bold",
        sizeClasses[size],
        toneClasses[tone],
        className,
      )}
    >
      N
    </span>
  );
}
