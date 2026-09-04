"use client";

import { isSoundEnabled, playSound } from "react-sounds";
import type { SoundOptions } from "react-sounds";

import {
  APP_SOUND_CATALOG,
  type AppSoundCategory,
} from "@/lib/sounds/catalog";

export type HapticPattern = "light" | "medium" | "heavy" | "error" | "success";

const HAPTIC_MS: Record<HapticPattern, number | number[]> = {
  light: 8,
  medium: 16,
  heavy: 28,
  error: [12, 40, 18],
  success: [10, 30, 14],
};

/**
 * Play a NestFlow feedback sound. Safe to call from event handlers and
 * toast wrappers; no-ops when sounds are disabled or playback fails.
 */
export function playAppSound(
  category: AppSoundCategory,
  overrides?: SoundOptions,
): void {
  if (typeof window === "undefined") return;
  if (!isSoundEnabled()) return;

  const entry = APP_SOUND_CATALOG[category];
  void playSound(entry.name, { ...entry.options, ...overrides }).catch(() => {
    // Autoplays can fail before a user gesture; ignore.
  });
}

/**
 * Best-effort vibration for destructive and milestone feedback.
 * No-ops when the Vibration API is missing or the user prefers reduced motion.
 */
export function triggerHaptic(pattern: HapticPattern = "light"): void {
  if (typeof window === "undefined") return;
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  try {
    navigator.vibrate(HAPTIC_MS[pattern]);
  } catch {
    // Some browsers expose vibrate but reject calls.
  }
}
