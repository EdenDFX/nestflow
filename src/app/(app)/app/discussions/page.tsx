import { AdminSuiteFrame } from "@/components/admin/admin-suite-frame";
import { DiscussionInbox } from "@/components/discussions/discussion-inbox";
import { requireActiveProfile } from "@/lib/auth/session";
import { listDiscussionThreads } from "@/lib/tasks/discussion-queries";

export default async function DiscussionsPage() {
  const profile = await requireActiveProfile();
  const threads = await listDiscussionThreads(profile.userId);
  const isAdmin = profile.roles.includes("admin");

  const content = (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Discussions
        </h1>
        <p className="text-sm text-muted-foreground">
          Task threads you joined or were @mentioned in. Assignment is not
          required to read and reply here.
        </p>
      </div>

      <DiscussionInbox threads={threads} />
    </div>
  );

  if (isAdmin) {
    return <AdminSuiteFrame profile={profile}>{content}</AdminSuiteFrame>;
  }

  return content;
}
