import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { requireRoles } from "@/lib/auth/guards";
import { lagosYmd, resolvePeriodBounds } from "@/lib/reports/period";
import { buildPeriodReportForProfile } from "@/lib/reports/queries";
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
  }>;
}) {
  const profile = await requireRoles(["admin", "line_manager", "hr"]);
  const params = await searchParams;

  const kind: ReportPeriodKind = isReportPeriodKind(params.period ?? "")
    ? (params.period as ReportPeriodKind)
    : "weekly";

  const endingCandidate = params.ending?.trim();
  const endingDate =
    endingCandidate && /^\d{4}-\d{2}-\d{2}$/.test(endingCandidate)
      ? endingCandidate
      : resolvePeriodBounds(kind).endingDate;

  // Guard against future end dates beyond tomorrow Lagos.
  const maxEnding = lagosYmd();
  const safeEnding = endingDate > maxEnding ? maxEnding : endingDate;

  const report = await buildPeriodReportForProfile(profile, kind, {
    endingDate: safeEnding,
    department: params.department?.trim() || null,
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <ReportsDashboard report={report} />
    </div>
  );
}
