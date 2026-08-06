"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  checkRateLimit,
  clientKeyFromHeaders,
} from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your Nest ID or email."),
  password: z.string().min(1, "Enter your password."),
});

export type SignInState = {
  error?: string;
  fieldErrors?: {
    identifier?: string;
    password?: string;
  };
};

export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const headerStore = await headers();
  const rateKey = clientKeyFromHeaders(headerStore, "signin");
  const rate = checkRateLimit({
    key: rateKey,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!rate.ok) {
    return {
      error: `Too many sign-in attempts. Try again in ${rate.retryAfterSeconds} seconds.`,
    };
  }

  const parsed = signInSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      error: "Check the highlighted fields.",
      fieldErrors: {
        identifier: flat.identifier?.[0],
        password: flat.password?.[0],
      },
    };
  }

  const identityRate = checkRateLimit({
    key: `signin-id:${parsed.data.identifier.trim().toLowerCase()}`,
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });
  if (!identityRate.ok) {
    return {
      error: `Too many attempts for this account. Try again in ${identityRate.retryAfterSeconds} seconds.`,
    };
  }

  const supabase = await createClient();

  const { data: resolvedEmail, error: resolveError } = await supabase.rpc(
    "nestflow_resolve_login_email",
    { identifier: parsed.data.identifier },
  );

  if (resolveError) {
    console.error("Login identifier resolve failed", resolveError);
    return { error: "Unable to sign in right now. Try again shortly." };
  }

  const email =
    typeof resolvedEmail === "string" && resolvedEmail.length > 0
      ? resolvedEmail
      : parsed.data.identifier.includes("@")
        ? parsed.data.identifier.trim().toLowerCase()
        : null;

  if (!email) {
    return { error: "Invalid Nest ID or email, or this account is inactive." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (signInError) {
    return {
      error: "Invalid credentials. Check your Nest ID/email and password.",
    };
  }

  const { data: profileRows, error: profileError } = await supabase.rpc(
    "nestflow_current_profile",
  );

  if (profileError) {
    await supabase.auth.signOut();
    return {
      error: "Signed in, but your NestFlow profile could not be loaded.",
    };
  }

  const profile = Array.isArray(profileRows) ? profileRows[0] : profileRows;

  if (!profile || profile.is_active === false) {
    await supabase.auth.signOut();
    return { error: "This account is inactive. Contact your NestFlow admin." };
  }

  redirect("/app");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
