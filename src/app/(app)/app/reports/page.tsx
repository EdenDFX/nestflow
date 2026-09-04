import { AdminSuiteFrame } from "@/components/admin/admin-suite-frame";
import { LineManagerWeeklyPanel } from "@/components/reports/line-manager-weekly-panel";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { requireRoles } from "@/lib/auth/guards";
import {
  lagosYmd,
  resolveInteractivePeriodEnding,
} from "@/lib/reports/period";
import {
  buildLineManagerWeeklyReport,
  buildPeriodReportForProfile,
} from "@/lib/reports/queries";
import {
  isReportPeriodKind,
  type ReportPeriodKind,
} from "@/lib/reports/types";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    ending?: string;
    department?: string;
    view?: string;
  }>;
}) {
  const profile = await requireRoles(["admin", "line_manager", "hr"]);
  const params = await searchParams;
  const isAdmin = profile.roles.includes("admin");
  const view = params.view === "managers" && isAdmin ? "managers" : "staff";

  const kind: ReportPeriodKind = isReportPeriodKind(params.period ?? "")
    ? (params.period as ReportPeriodKind)
    : "weekly";

  const endingCandidate = params.ending?.trim();
  const endingDate =
    endingCandidate && /^\d{4}-\d{2}-\d{2}$/.test(endingCandidate)
      ? endingCandidate
      : resolveInteractivePeriodEnding(kind);

  const maxEnding = lagosYmd();
  const safeEnding = endingDate > maxEnding ? maxEnding : endingDate;

  const body =
    view === "managers" ? (
      <>
        <ReportsViewTabs active="managers" ending={safeEnding} period={kind} />
        <LineManagerWeeklyPanel
          report={await buildLineManagerWeeklyReport({ endingDate: safeEnding })}
        />
      </>
    ) : (
      <>
        {isAdmin ? (
          <ReportsViewTabs active="staff" ending={safeEnding} period={kind} />
        ) : null}
        <ReportsDashboard
          report={await buildPeriodReportForProfile(profile, kind, {
            endingDate: safeEnding,
            department: params.department?.trim() || null,
          })}
        />
      </>
    );

  if (isAdmin) {
    return (
      <AdminSuiteFrame profile={profile}>
        <div className="mx-auto w-full max-w-7xl space-y-6">{body}</div>
      </AdminSuiteFrame>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {body}
    </div>
  );
}

function ReportsViewTabs({
  active,
  ending,
  period,
}: {
  active: "staff" | "managers";
  ending: string;
  period: ReportPeriodKind;
}) {
  const staffHref = `/app/reports?period=${period}&ending=${ending}`;
  const managersHref = `/app/reports?view=managers&period=weekly&ending=${ending}`;

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={staffHref}
        className={
          active === "staff"
            ? "rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
            : "rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground hover:bg-muted"
        }
      >
        Staff delivery
      </a>
      <a
        href={managersHref}
        className={
          active === "managers"
            ? "rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
            : "rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground hover:bg-muted"
        }
      >
        Line managers
      </a>
    </div>
  );
}
