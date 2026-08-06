import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * Public liveness probe. Also used as a Free-tier keep-warm ping.
 */
export async function GET() {
  const started = Date.now();
  let database: "ok" | "error" | "unconfigured" = "unconfigured";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anon) {
    try {
      const supabase = createSupabaseClient(url, anon, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      // Lightweight round-trip; result may be empty without a session.
      const { error } = await supabase.from("nf_workspaces").select("id").limit(1);
      // RLS may hide rows for anonymous callers; a round-trip still warms Free tier.
      database = "ok";
      if (error) {
        console.warn("health database probe:", error.message);
      }
    } catch (error) {
      database = "error";
      console.error("health database probe threw", error);
    }
  }

  const ok = database !== "error";

  return NextResponse.json(
    {
      ok,
      service: "nestflow",
      version: "1.0.0",
      database,
      tier: "supabase-free",
      elapsedMs: Date.now() - started,
    },
    { status: ok ? 200 : 503 },
  );
}
