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
  { href: "/app/board", label: "Board", icon: "board" },
  { href: "/app/list", label: "List", icon: "list" },
  { href: "/app/calendar", label: "Calendar", icon: "calendar" },
];

const roleNav: NavItem[] = [
  {
    href: "/app/team",
    label: "Team",
    roles: ["admin", "line_manager"],
    icon: "team",
  },
  {
    href: "/app/people",
    label: "People tasks",
    roles: ["admin", "hr"],
    icon: "people",
  },
  {
    href: "/app/admin",
    label: "Admin",
    roles: ["admin"],
    icon: "admin",
  },
];

export function navForRoles(roles: AppRole[]): NavItem[] {
  const allowed = new Set(roles);
  return [...baseNav, ...roleNav].filter((item) => {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    return item.roles.some((role) => allowed.has(role));
  });
}

export function homePathForRoles(roles: AppRole[]): string {
  const role = primaryRole(roles);
  switch (role) {
    case "admin":
      return "/app/admin";
    case "hr":
      return "/app/people";
    case "line_manager":
      return "/app/team";
    case "staff":
      return "/app";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}
