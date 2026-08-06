import type { AppRole } from "@/lib/auth/types";
import { primaryRole } from "@/lib/auth/types";

export type NavIcon =
  | "dashboard"
  | "my-tasks"
  | "board"
  | "list"
  | "calendar"
  | "team"
  | "people"
  | "admin";

export type NavItem = {
  href: string;
  label: string;
  roles?: AppRole[];
  icon: NavIcon;
};

const baseNav: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: "dashboard" },
  { href: "/app/my-tasks", label: "My Tasks", icon: "my-tasks" },
  {
    href: "/app/board",
    label: "Board",
    icon: "board",
    roles: ["staff", "line_manager"],
  },
  {
    href: "/app/list",
    label: "List",
    icon: "list",
    roles: ["staff", "line_manager"],
  },
  {
    href: "/app/calendar",
    label: "Calendar",
    icon: "calendar",
    roles: ["staff", "line_manager", "hr"],
  },
];

const roleNav: NavItem[] = [
  {
    href: "/app/team",
    label: "Team",
    roles: ["line_manager"],
    icon: "team",
  },
  {
    href: "/app/people",
    label: "People tasks",
    roles: ["hr"],
    icon: "people",
  },
  {
    href: "/app/admin",
    label: "Overview",
    roles: ["admin"],
    icon: "admin",
  },
];

export function navForRoles(roles: AppRole[]): NavItem[] {
  // Administrators work from Overview only (task lists and boards are for other roles).
  if (primaryRole(roles) === "admin") {
    return [{ href: "/app/admin", label: "Overview", icon: "admin" }];
  }

  const allowed = new Set(roles);
  return [...baseNav, ...roleNav].filter((item) => {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    return item.roles.some((role) => allowed.has(role));
  });
}

/** Board and List remain for staff and line managers only. */
export function canAccessWorkViews(roles: AppRole[]): boolean {
  return roles.some((role) => role === "staff" || role === "line_manager");
}

export function homePathForRoles(roles: AppRole[]): string {
  const role = primaryRole(roles);
  switch (role) {
    case "admin":
      return "/app/admin";
    case "hr":
      return "/app/people";
    case "line_manager":
      return "/app";
    case "staff":
      return "/app";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}
