import { redirect } from "next/navigation";

import { AuthSplitShell } from "@/components/auth/auth-split-shell";
import { getSessionUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/app");
  }

  return <AuthSplitShell />;
}
