import { AuthLoginForm } from "@/components/auth/auth-login-form";
import { NestFlowMark } from "@/components/auth/nestflow-mark";
import { GradientBars } from "@/components/ui/gradient-bars-background";

export function AuthSplitShell({ banner }: { banner?: string }) {
  return (
    <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-[#0a0908] text-white">
      <GradientBars
        numBars={15}
        gradientFrom="rgba(255, 99, 0, 0.85)"
        gradientTo="transparent"
        animationDuration={2.2}
        className="opacity-90"
      />

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
    </main>
  );
}
