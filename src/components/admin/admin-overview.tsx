"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";

import { AdminActivityPanel } from "@/components/admin/admin-activity-panel";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { AdminDeliveryPanel } from "@/components/admin/admin-delivery-panel";
import { AdminTasksPanel } from "@/components/admin/admin-tasks-panel";
import {
  ADMIN_SPRING_SOFT,
  getWeekInterval,
  isOverdue,
  type StatusFilter,
  taskMatchesStatusFilter,
} from "@/components/admin/admin-shared";
import { AdminMetricBlock } from "@/components/admin/ui/admin-metric-block";
import { AdminSummaryCard } from "@/components/admin/ui/admin-summary-card";
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
import type { NestFlowTask, TaskAssignee } from "@/lib/tasks/types";

const AdminSuite = dynamic(
  () => import("@/components/admin/admin-suite").then((mod) => mod.AdminSuite),
  {
    loading: () => (
      <div className="h-[24rem] rounded-[1.75rem] bg-muted/30" aria-hidden />
    ),
  },
);

type OverviewTab = "tasks" | "activity" | "delivery" | "people";

const SECTION_TABS = [
  { id: "tasks", label: "Tasks" },
  { id: "activity", label: "Activity" },
  { id: "delivery", label: "Delivery" },
  { id: "people", label: "People" },
] as const;

export function AdminOverview({
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
  shell = true,
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
  /** When false, render inner canvas only (parent supplies `.admin-dashboard`). */
  shell?: boolean;
  notifications?: NestFlowNotification[];
  notificationUnreadCount?: number;
}) {
  const preferReduced = useReducedMotion();
  const softSpring = preferReduced ? { duration: 0.01 } : ADMIN_SPRING_SOFT;
  const [tab, setTab] = useState<OverviewTab>("tasks");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [calendarFocusToken, setCalendarFocusToken] = useState(0);

  const activePeople = oversightUsers.filter((user) => user.isActive).length;

  const weekTaskCount = useMemo(() => {
    const { start, end } = getWeekInterval(new Date());
    return tasks.filter((task) => {
      const when = task.dueAt ?? task.completedAt;
      if (!when) return false;
      const date = new Date(when);
      return date >= start && date <= end;
    }).length;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (statusFilter === "overdue" && !isOverdue(task)) return false;
      if (statusFilter === "unassigned" && task.assigneeNames.length > 0) {
        return false;
      }
      if (statusFilter === "completed") {
        if (!taskMatchesStatusFilter(task, "completed")) return false;
      } else if (
        statusFilter !== "all" &&
        statusFilter !== "overdue" &&
        statusFilter !== "unassigned" &&
        task.status !== statusFilter
      ) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        task.title,
        task.createdByName,
        task.createdByNestId,
        task.workspaceName,
        ...task.assigneeNames,
        task.lastUpdateSummary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [tasks, query, statusFilter]);

  const filteredLog = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return log;
    return log.filter((entry) =>
      [entry.summary, entry.detail, entry.actorName, entry.taskTitle]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [log, query]);

  function focusTasks(filter: StatusFilter) {
    setTab("tasks");
    setStatusFilter(filter);
    setQuery("");
    setCalendarFocusToken((token) => token + 1);
  }

  const content = (
    <LayoutGroup id="admin-overview">
      <AdminDashboardHeader
        profile={profile}
        homeHref={homeHref}
        routeLinks={routeLinks}
        sectionTabs={[...SECTION_TABS]}
        sectionTab={tab}
        onSectionTabChange={(next) => {
          setTab(next as OverviewTab);
          setQuery("");
        }}
        notifications={notifications}
        notificationUnreadCount={notificationUnreadCount}
      />

      <div className="admin-dashboard__body">
        <div className="admin-dashboard__canvas">
          <aside className="admin-dashboard__sidebar">
            <div className="space-y-2 pb-1">
              <p className="admin-dashboard__eyebrow">Administrator</p>
              <h1 className="admin-dashboard__title">
                {tab === "tasks" ? "This week" : "Organisation overview"}
              </h1>
              {tab !== "tasks" ? (
                <p className="admin-dashboard__subtitle">
                  Last 7 days ·{" "}
                  <span className="tabular-nums text-foreground">{tasks.length}</span>{" "}
                  tasks ·{" "}
                  <span className="tabular-nums text-foreground">
                    {report.pendingApprovals}
                  </span>{" "}
                  pending approvals
                </p>
              ) : null}
            </div>

            {tab === "tasks" ? (
              <AdminSummaryCard>
                {weekTaskCount === 0 ? (
                  "No tasks on the calendar yet."
                ) : (
                  <>
                    You have{" "}
                    <span className="font-medium text-foreground">{weekTaskCount}</span>{" "}
                    task{weekTaskCount === 1 ? "" : "s"} due or completed this week.
                  </>
                )}
              </AdminSummaryCard>
            ) : null}

            <div className="admin-dashboard__metrics">
              <AdminMetricBlock
                label="Open"
                value={report.openTasks}
                tone="primary"
                active={tab === "tasks" && statusFilter === "all"}
                onClick={() => focusTasks("all")}
              />
              <AdminMetricBlock
                label="Overdue"
                value={report.overdue}
                tone="destructive"
                active={tab === "tasks" && statusFilter === "overdue"}
                onClick={() => focusTasks("overdue")}
              />
              <AdminMetricBlock
                label="Blocked"
                value={report.blocked}
                tone="warning"
                active={tab === "tasks" && statusFilter === "blocked"}
                onClick={() => focusTasks("blocked")}
              />
              <AdminMetricBlock
                label="Completed (7d)"
                value={report.completedLast7Days}
                tone="success"
                active={tab === "tasks" && statusFilter === "completed"}
                onClick={() => focusTasks("completed")}
              />
              <AdminMetricBlock
                label="Active people"
                value={activePeople}
                tone="info"
                active={tab === "people"}
                onClick={() => {
                  setTab("people");
                  setQuery("");
                }}
              />
            </div>
          </aside>

          <div className="admin-dashboard__main">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={
                  preferReduced ? { opacity: 0 } : { opacity: 0, y: 10 }
                }
                animate={{ opacity: 1, y: 0 }}
                exit={preferReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={softSpring}
              >
                {tab === "tasks" ? (
                  <AdminTasksPanel
                    tasks={filteredTasks}
                    total={tasks.length}
                    query={query}
                    onQueryChange={setQuery}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    focusToken={calendarFocusToken}
                  />
                ) : null}

                {tab === "activity" ? (
                  <AdminActivityPanel
                    entries={filteredLog}
                    query={query}
                    onQueryChange={setQuery}
                  />
                ) : null}

                {tab === "delivery" ? (
                  <AdminDeliveryPanel report={report} />
                ) : null}

                {tab === "people" ? (
                  <AdminSuite
                    embedded
                    users={users}
                    departments={departments}
                    invites={invites}
                    auditEvents={auditEvents}
                    teams={teams}
                    memberships={memberships}
                    people={people}
                    openByUser={openByUser}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </LayoutGroup>
  );

  if (!shell) {
    return content;
  }

  return <div className="admin-dashboard">{content}</div>;
}
