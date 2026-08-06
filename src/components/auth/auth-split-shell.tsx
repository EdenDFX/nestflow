"use client";

import { useEffect, useState } from "react";

import { AuthLoginForm } from "@/components/auth/auth-login-form";
import { NestFlowMark } from "@/components/auth/nestflow-mark";
import { GradientBars } from "@/components/ui/gradient-bars-background";
import { cn } from "@/lib/utils";

const INTRO_WORDS = ["Plan.", "Assign.", "Deliver."] as const;
const WORD_FADE_MS = 2000;
const WORD_HOLD_MS = 400;
const WORD_OUT_MS = 500;

type Phase =
  | { kind: "intro"; index: number; visible: boolean }
  | { kind: "login" };

function prefersReducedMotion() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initialPhase(): Phase {
  if (prefersReducedMotion()) {
    return { kind: "login" };
  }
  return { kind: "intro", index: 0, visible: false };
}

export function AuthSplitShell({ banner }: { banner?: string }) {
  const [phase, setPhase] = useState<Phase>(initialPhase);

  useEffect(() => {
    if (phase.kind === "login") {
      return;
    }

    let cancelled = false;
    const timers: number[] = [];

    const runWord = (index: number) => {
      if (cancelled) {
        return;
      }

      setPhase({ kind: "intro", index, visible: false });

      timers.push(
        window.setTimeout(() => {
          if (!cancelled) {
            setPhase({ kind: "intro", index, visible: true });
          }
        }, 40),
      );

      timers.push(
        window.setTimeout(() => {
          if (!cancelled) {
            setPhase({ kind: "intro", index, visible: false });
          }
        }, 40 + WORD_FADE_MS + WORD_HOLD_MS),
      );

      timers.push(
        window.setTimeout(() => {
          if (cancelled) {
            return;
          }
          const next = index + 1;
          if (next < INTRO_WORDS.length) {
            runWord(next);
            return;
          }
          setPhase({ kind: "login" });
        }, 40 + WORD_FADE_MS + WORD_HOLD_MS + WORD_OUT_MS),
      );
    };

    runWord(0);

    return () => {
      cancelled = true;
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
    // Intro sequence starts once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only sequence
  }, []);

  return (
    <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-[#0a0908] text-white">
      <GradientBars
        numBars={15}
        gradientFrom="rgba(255, 99, 0, 0.85)"
        gradientTo="transparent"
        animationDuration={2.2}
        className="opacity-90"
      />

      {phase.kind === "intro" ? (
        <div className="relative z-10 flex flex-1 items-center justify-center px-6">
          <p
            key={INTRO_WORDS[phase.index]}
            className={cn(
              "font-heading text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl",
              "transition-opacity ease-in-out",
              phase.visible ? "opacity-100" : "opacity-0",
            )}
            style={{
              transitionDuration: phase.visible
                ? `${WORD_FADE_MS}ms`
                : `${WORD_OUT_MS}ms`,
            }}
          >
            {INTRO_WORDS[phase.index]}
          </p>
        </div>
      ) : (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-12 sm:px-6">
          <div className="w-full max-w-[380px] space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-1000">
            <div className="flex flex-col items-center space-y-5 text-center">
              <NestFlowMark
                size="lg"
                tone="panel"
                className="size-[3.25rem] rounded-[1.05rem] text-xl"
              />
              <div className="space-y-2">
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-[2rem]">
                  Welcome back.
                </h1>
                <p className="text-sm text-white/70 text-pretty">
                  Invite-only access. Need an account?{" "}
                  <span className="font-medium text-white">
                    Ask your Nest by Eden admin.
                  </span>
                </p>
              </div>
            </div>

            <AuthLoginForm />

            {banner ? (
              <p
                role="alert"
                className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-200"
              >
                {banner}
              </p>
            ) : null}

            <p className="text-center text-xs leading-relaxed text-white/60 text-pretty">
              By continuing, you acknowledge NestFlow is an internal Nest by Eden
              workspace. Access is invite-only.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
