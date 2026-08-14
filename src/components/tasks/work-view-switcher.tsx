import Link from "next/link";

import { Button } from "@/components/ui/button";
import { WORK_VIEWS, type WorkView } from "@/lib/tasks/work-views";

const VIEW_HREF: Record<WorkView, string> = {
  board: "/app/work?view=board",
  list: "/app/work?view=list",
  calendar: "/app/work?view=calendar",
};

const VIEW_LABEL: Record<WorkView, string> = {
  board: "Board",
  list: "List",
  calendar: "Calendar",
};

export function WorkViewSwitcher({ active }: { active: WorkView }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Work views">
      {WORK_VIEWS.map((view) => (
        <Button
          key={view}
          type="button"
          size="sm"
          variant={active === view ? "default" : "outline"}
          asChild
        >
          <Link href={VIEW_HREF[view]} role="tab" aria-selected={active === view}>
            {VIEW_LABEL[view]}
          </Link>
        </Button>
      ))}
    </div>
  );
}
