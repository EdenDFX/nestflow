export const APP_ROLES = [
  "admin",
  "line_manager",
  "hr",
  "staff",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type NestFlowProfile = {
  userId: string;
  nestId: string | null;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  department: string | null;
  status: string | null;
  isActive: boolean;
  roles: AppRole[];
};

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}

export function primaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("hr")) return "hr";
  if (roles.includes("line_manager")) return "line_manager";
  return "staff";
}

export function roleLabel(role: AppRole): string {
  switch (role) {
    case "admin":
      return "Administrator";
    case "line_manager":
      return "Line Manager";
    case "hr":
      return "HR";
    case "staff":
      return "Staff";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}
