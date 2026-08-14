import type { NestFlowProfile } from "@/lib/auth/types";

export function profileInitials(profile: NestFlowProfile) {
  const source =
    profile.fullName?.trim() || profile.email || profile.nestId || "NF";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}
