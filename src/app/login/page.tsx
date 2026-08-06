import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthSplitShell } from "@/components/auth/auth-split-shell";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) {
    redirect("/app");
  }

  const params = await searchParams;

  return (
    <AuthSplitShell
      banner={
        params.error === "inactive"
          ? "This account is inactive. Contact your NestFlow admin."
          : undefined
      }
    />
  );
}
