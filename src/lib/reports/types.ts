export const REPORT_PERIOD_KINDS = ["daily", "weekly", "monthly"] as const;
export type ReportPeriodKind = (typeof REPORT_PERIOD_KINDS)[number];

export type PeriodBounds = {
  kind: ReportPeriodKind;
  /** Inclusive UTC instant for the start of the period (Lagos calendar). */
  start: Date;
  /** Exclusive UTC instant for the end of the period. */
  end: Date;
  /** Stable key for idempotency: YYYY-MM-DD | YYYY-Www | YYYY-MM */
  periodKey: string;
  /** Last calendar day in the period (Lagos), YYYY-MM-DD — used in deep links. */
  endingDate: string;
  label: string;
};

export type ReportTaskDetail = {
  id: string;
  title: string;
  workspaceName: string | null;
  status: string;
  dueAt: string | null;
  completedAt: string | null;
  blockedReason: string | null;
  kind: "completed" | "missed" | "overdue" | "blocked";
};

export type StaffPeriodStats = {
  userId: string;
  fullName: string | null;
  nestId: string | null;
  email: string | null;
  department: string | null;
  /**
   * Row basis. "staff" rows report the person's own delivery;
   * "line_manager" rows report outcomes of tasks the person assigned.
   */
  reportKind: "staff" | "line_manager";
  /** Unique tasks assigned in the period (line-manager rows only). */
  assigned: number;
  completed: number;
  completedOnTime: number;
  missed: number;
  overdue: number;
  blocked: number;
  created: number;
  updated: number;
  minutesLogged: number;
  /** Average cycle time in hours for completions in the period; null if none. */
  avgCycleHours: number | null;
  /** completedOnTime / (completedOnTime + missed); null if denominator is 0. */
  onTimeRate: number | null;
  details: ReportTaskDetail[];
};

export type ReportBucket = {
  key: string;
  label: string;
  completed: number;
  missed: number;
};

export type PeriodReportSummary = {
  staffCount: number;
  completed: number;
  missed: number;
  overdue: number;
  blocked: number;
  minutesLogged: number;
  onTimeRate: number | null;
};

export type PeriodReport = {
  period: PeriodBounds;
  scope: "org" | "team";
  summary: PeriodReportSummary;
  staff: StaffPeriodStats[];
  buckets: ReportBucket[];
  /** Distinct department names in the unfiltered report scope. */
  departments?: string[];
  /** Active department filter; null means none selected (admin default). */
  department?: string | null;
  /** When true, UI prompts for a department before listing everyone. */
  requireDepartment?: boolean;
};

export type LmBlockListItem = {
  taskId: string;
  title: string;
  blockedReason: string | null;
  assigneeNames: string[];
};

export type LineManagerWeeklyStats = {
  userId: string;
  fullName: string | null;
  nestId: string | null;
  email: string | null;
  /** Assignments made by this LM in the period. */
  assigned: number;
  /** Completions among those assigned tasks in the period. */
  completed: number;
  /** Missed deadlines among those assigned tasks in the period. */
  failed: number;
  /** Still-open assigned tasks at period end. */
  unrest: number;
  blockList: LmBlockListItem[];
};

export type LineManagerWeeklyReport = {
  period: PeriodBounds;
  managers: LineManagerWeeklyStats[];
};

export function isReportPeriodKind(value: string): value is ReportPeriodKind {
  return (REPORT_PERIOD_KINDS as readonly string[]).includes(value);
}
