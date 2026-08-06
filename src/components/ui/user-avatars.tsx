"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

export type UserAvatarItem = {
  id: string | number;
  name?: string;
  /** Optional photo URL; when missing, initials from `name` are shown. */
  image?: string | null;
};

export type UserAvatarsProps = {
  /** List of users with id, name, and image */
  users: UserAvatarItem[];
  /** Avatar size in px (default: 56) */
  size?: number | string;
  /** Extra classNames for container */
  className?: string;
  /** Max number of visible avatars before showing +X bubble (default: 7) */
  maxVisible?: number;
  /** Overlap percentage between avatars (default: 60) */
  overlap?: number;
  /** Hover scale factor (default: 1.2) */
  focusScale?: number;
  /** Display avatars from right to left (default: false) */
  isRightToLeft?: boolean;
  /** Only overlap avatars, no shifting on hover (default: false) */
  isOverlapOnly?: boolean;
  /** Tooltip placement (default: "bottom") */
  tooltipPlacement?: "top" | "bottom";
  /** Soft style for dark stepped / ink cards */
  inverted?: boolean;
};

function initialsFromName(name?: string) {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export function UserAvatars({
  users,
  size = 56,
  className,
  maxVisible = 7,
  isRightToLeft = false,
  isOverlapOnly = false,
  overlap = 60,
  focusScale = 1.2,
  tooltipPlacement = "bottom",
  inverted = false,
}: UserAvatarsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (users.length === 0) {
    return null;
  }

  const sizePx = Number(size);
  const slicedUsers = users.slice(0, Math.min(maxVisible + 1, users.length));
  const exceedMaxLength = users.length > maxVisible;

  const handleKeyEnter = (e: KeyboardEvent<HTMLDivElement>, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setHoveredIndex(index);
    }
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      {slicedUsers.map((user, index) => {
        const isHoveredOne = hoveredIndex === index;
        const isLengthBubble = exceedMaxLength && maxVisible === index;

        const diff = 1 - overlap / 100;
        const zIndex =
          isHoveredOne && isOverlapOnly
            ? slicedUsers.length
            : isRightToLeft
              ? slicedUsers.length - index
              : index;

        const shouldScale =
          isHoveredOne &&
          (!exceedMaxLength || slicedUsers.length - 1 !== index);

        const shouldShift =
          hoveredIndex !== null &&
          (isRightToLeft ? index < hoveredIndex : index > hoveredIndex) &&
          !isOverlapOnly;

        const baseGap = sizePx * (overlap / 100);
        const neededGap = (sizePx * (1 + focusScale)) / 2;
        const shift = Math.max(0, neededGap - baseGap);
        const fontSize = Math.max(9, Math.round(sizePx * 0.34));

        return (
          <motion.div
            key={user.id}
            role="img"
            aria-label={
              isLengthBubble
                ? `${users.length - maxVisible} more people`
                : user.name || "User avatar"
            }
            className="relative cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            style={{
              width: sizePx,
              height: sizePx,
              zIndex,
              marginLeft: index === 0 ? 0 : -sizePx * diff,
            }}
            tabIndex={0}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(index)}
            onBlur={() => setHoveredIndex(null)}
            onKeyDown={(e) => handleKeyEnter(e, index)}
            animate={{
              scale: shouldScale ? focusScale : 1,
              x: shouldShift ? shift * (isRightToLeft ? -1 : 1) : 0,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div
              className={cn(
                "h-full w-full overflow-hidden rounded-full border shadow-md",
                inverted ? "border-white/25" : "border-background",
              )}
            >
              {isLengthBubble ? (
                <div
                  className={cn(
                    "flex h-full w-full items-center justify-center font-semibold",
                    inverted
                      ? "bg-white/15 text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                  style={{ fontSize }}
                >
                  +{users.length - maxVisible}
                </div>
              ) : user.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote avatar URLs vary by provider
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className={cn(
                    "flex h-full w-full items-center justify-center font-semibold",
                    inverted
                      ? "bg-white/20 text-white"
                      : "bg-primary/15 text-primary",
                  )}
                  style={{ fontSize }}
                >
                  {initialsFromName(user.name)}
                </div>
              )}
            </div>

            <AnimatePresence>
              {shouldScale && user.name && !isLengthBubble ? (
                <motion.div
                  role="tooltip"
                  initial={{
                    opacity: 0,
                    y: tooltipPlacement === "bottom" ? 8 : -8,
                  }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    y: tooltipPlacement === "bottom" ? 8 : -8,
                  }}
                  transition={{ duration: 0.18 }}
                  className={cn(
                    "absolute left-1/2 z-50",
                    tooltipPlacement === "bottom"
                      ? "top-full mt-2"
                      : "bottom-full mb-2",
                  )}
                >
                  <div className="max-w-[10rem] -translate-x-1/2 truncate whitespace-nowrap rounded-md bg-[#0c0a09] px-2 py-1 text-xs text-white shadow-lg">
                    {user.name}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
