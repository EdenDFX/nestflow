"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import type { NavItem } from "@/lib/auth/navigation";
import type { NestFlowProfile } from "@/lib/auth/types";
import type {
  AdminReportSnapshot,
  AuditEvent,
  Department,
  DirectoryUser,
  Invite,
  NestFlowTeam,
  OversightLogEntry,
  OversightTaskRow,
  TeamMembershipRow,
} from "@/lib/admin/types";
import type { NestFlowNotification } from "@/lib/notifications/types";
import type { DiscussionThread } from "@/lib/tasks/discussion-shared";
import type { NestFlowTask, TaskAssignee } from "@/lib/tasks/types";

const AdminOverview = dynamic(
  () =>
    import("@/components/admin/admin-overview").then((mod) => mod.AdminOverview),
  {
    loading: () => (
      <div className="admin-dashboard">
        <div className="admin-dashboard__body">
          <div className="h-[24rem] rounded-[1.75rem] bg-muted/30" aria-hidden />
        </div>
      </div>
    ),
  },
);

const DiscussionDashboardPanel = dynamic(
  () =>
    import("@/components/discussions/discussion-dashboard-panel").then(
      (mod) => mod.DiscussionDashboardPanel,
    ),
  { ssr: false },
);

export function AdminConsole({
  profile,
  homeHref,
  routeLinks,
  tasks,
  log,
  report,
  oversightUsers,
  users,
  departments,
  invites,
  auditEvents,
  teams,
  memberships,
  people = [],
  openByUser = {},
  discussionThreads = [],
  unreadMentionCount = 0,
  notifications = [],
  notificationUnreadCount = 0,
}: {
  profile: NestFlowProfile;
  homeHref: string;
  routeLinks: NavItem[];
  tasks: OversightTaskRow[];
  log: OversightLogEntry[];
  report: AdminReportSnapshot;
  oversightUsers: DirectoryUser[];
  users: DirectoryUser[];
  departments: Department[];
  invites: Invite[];
  auditEvents: AuditEvent[];
  teams: NestFlowTeam[];
  memberships: TeamMembershipRow[];
  people?: TaskAssignee[];
  openByUser?: Record<string, NestFlowTask[]>;
  discussionThreads?: DiscussionThread[];
  unreadMentionCount?: number;
  notifications?: NestFlowNotification[];
  notificationUnreadCount?: number;
}) {
  const [discussionsOpen, setDiscussionsOpen] = useState(false);

  return (
    <div className="admin-dashboard">
      <AdminOverview
        profile={profile}
        homeHref={homeHref}
        routeLinks={routeLinks}
        tasks={tasks}
        log={log}
        report={report}
        oversightUsers={oversightUsers}
        users={users}
        departments={departments}
        invites={invites}
        auditEvents={auditEvents}
        teams={teams}
        memberships={memberships}
        people={people}
        openByUser={openByUser}
        shell={false}
        notifications={notifications}
        notificationUnreadCount={notificationUnreadCount}
      />

      <details
        className="admin-dashboard__discussions mx-5 mb-8 md:mx-7"
        open={discussionsOpen}
        onToggle={(event) =>
          setDiscussionsOpen((event.currentTarget as HTMLDetailsElement).open)
        }
      >
        <summary>
          Mentions & discussions
          {unreadMentionCount > 0 ? (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {unreadMentionCount}
            </span>
          ) : null}
        </summary>
        <div className="mt-4 px-1 pb-2">
          <DiscussionDashboardPanel
            threads={discussionThreads}
            unreadMentionCount={unreadMentionCount}
            embedded
          />
        </div>
      </details>
    </div>
  );
}
