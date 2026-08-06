"use client";

import { useActionState, useState } from "react";

import { Input } from "@/components/ui/input";
import { signInAction, type SignInState } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

const fieldClassName =
  "h-12 rounded-xl border-white/25 bg-white/[0.08] px-4 text-sm text-white placeholder:text-white/55 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] focus-visible:border-[#FF6300]/70 focus-visible:ring-[#FF6300]/30 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/[0.08]";

const initialState: SignInState = {};

export function AuthLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder="Nest ID or email"
          aria-label="Nest ID or email"
          aria-invalid={Boolean(state.fieldErrors?.identifier || state.error)}
          className={fieldClassName}
          disabled={pending}
          required
        />
        {state.fieldErrors?.identifier ? (
          <p className="px-1 text-xs text-red-300">{state.fieldErrors.identifier}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Password"
            aria-label="Password"
            aria-invalid={Boolean(state.fieldErrors?.password || state.error)}
            className={cn(fieldClassName, "pr-12")}
            disabled={pending}
            required
          />
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md px-1.5 py-1 text-xs font-medium text-white/70 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-[#FF6300]/40 focus-visible:outline-none disabled:pointer-events-none disabled:text-white/55"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((value) => !value)}
            disabled={pending}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {state.fieldErrors?.password ? (
          <p className="px-1 text-xs text-red-300">{state.fieldErrors.password}</p>
        ) : null}
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-black transition-opacity hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-[#FF6300]/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="pt-1 text-center text-xs text-white/55">
        Use your Nest ID (for example GFX2) or work email.
      </p>
    </form>
  );
}
