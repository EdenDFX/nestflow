import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

type GradientBarsProps = {
  numBars?: number;
  gradientFrom?: string;
  gradientTo?: string;
  animationDuration?: number;
  className?: string;
};

function calculateHeight(index: number, total: number) {
  if (total <= 1) {
    return 100;
  }

  const position = index / (total - 1);
  const maxHeight = 100;
  const minHeight = 30;
  const distanceFromCenter = Math.abs(position - 0.5);
  const heightPercentage = Math.pow(distanceFromCenter * 2, 1.2);

  return minHeight + (maxHeight - minHeight) * heightPercentage;
}

export function GradientBars({
  numBars = 15,
  gradientFrom = "rgb(255, 99, 0)",
  gradientTo = "transparent",
  animationDuration = 2,
  className = "",
}: GradientBarsProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        className,
      )}
    >
      <div className="flex h-full w-full [backface-visibility:hidden] [transform:translateZ(0)]">
        {Array.from({ length: numBars }).map((_, index) => {
          const height = calculateHeight(index, numBars);
          const initialScale = height / 100;

          return (
            <div
              key={index}
              className="gradient-bar box-border origin-bottom outline outline-transparent"
              style={
                {
                  flex: `1 0 calc(100% / ${numBars})`,
                  maxWidth: `calc(100% / ${numBars})`,
                  height: "100%",
                  background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`,
                  transform: `scaleY(${initialScale})`,
                  "--initial-scale": String(initialScale),
                  "--gradient-bar-duration": `${animationDuration}s`,
                  "--gradient-bar-delay": `${index * 0.1}s`,
                } as CSSProperties
              }
            />
          );
        })}
      </div>
    </div>
  );
}

type GradientBarsBackgroundProps = {
  numBars?: number;
  gradientFrom?: string;
  gradientTo?: string;
  animationDuration?: number;
  backgroundColor?: string;
  className?: string;
  children?: React.ReactNode;
};

export function GradientBarsBackground({
  numBars = 15,
  gradientFrom = "rgb(255, 99, 0)",
  gradientTo = "transparent",
  animationDuration = 2,
  backgroundColor = "rgb(10, 9, 8)",
  className,
  children,
}: GradientBarsBackgroundProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-full w-full flex-col items-center justify-center overflow-hidden",
        className,
      )}
      style={{ backgroundColor }}
    >
      <GradientBars
        numBars={numBars}
        gradientFrom={gradientFrom}
        gradientTo={gradientTo}
        animationDuration={animationDuration}
      />

      {children ? (
        <div className="relative z-10 flex h-full w-full items-center justify-center px-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export default GradientBarsBackground;
