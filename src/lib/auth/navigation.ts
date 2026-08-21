import type { AppRole } from "@/lib/auth/types";
import { primaryRole } from "@/lib/auth/types";

export type NavIcon =
  | "dashboard"
  | "my-tasks"
  | "work"
  | "board"
  | "list"
  | "calendar"
  | "team"
  | "people"
  | "admin"
  | "reports";

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
    href: "/app/work",
    label: "Work",
    icon: "work",
    roles: ["staff", "line_manager"],
  },
  {
    href: "/app/calendar",
    label: "Calendar",
    icon: "calendar",
    roles: ["hr"],
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
    href: "/app/reports",
    label: "Reports",
    roles: ["line_manager", "hr", "admin"],
    icon: "reports",
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
  if (primaryRole(roles) === "admin") {
    return [
      { href: "/app/admin", label: "Overview", icon: "admin" },
      { href: "/app/reports", label: "Reports", icon: "reports" },
    ];
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
      return "/app/my-tasks";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}
