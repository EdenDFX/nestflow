import { redirect } from "next/navigation";

import {
  getCurrentProfile,
  requireActiveProfile,
} from "@/lib/auth/session";
import type { AppRole, NestFlowProfile } from "@/lib/auth/types";

export async function requireRoles(
  allowed: AppRole[],
): Promise<NestFlowProfile> {
  const profile = await requireActiveProfile();
  const ok = allowed.some((role) => profile.roles.includes(role));
  if (!ok) {
    redirect("/app");
  }
  return profile;
}

export function hasAnyRole(
  profile: NestFlowProfile,
  allowed: AppRole[],
): boolean {
  return allowed.some((role) => profile.roles.includes(role));
}

export async function getOptionalProfile() {
  return getCurrentProfile();
}
