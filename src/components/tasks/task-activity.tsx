import type { ActivityEvent } from "@/lib/tasks/collaboration-types";

export function TaskActivity({ events }: { events: ActivityEvent[] }) {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg font-semibold">Activity</h2>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ol className="space-y-3 border-l border-border/80 pl-4">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-primary" />
              <p className="text-sm">{event.summary}</p>
              <p className="text-xs text-muted-foreground">
                {event.actorName ?? "System"} ·{" "}
                {new Date(event.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
