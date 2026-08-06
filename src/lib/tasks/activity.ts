import { createClient } from "@/lib/supabase/server";

export async function recordActivity(params: {
  taskId: string;
  actorId: string | null;
  eventType: string;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("nf_activity_events").insert({
    task_id: params.taskId,
    actor_id: params.actorId,
    event_type: params.eventType,
    summary: params.summary,
    metadata: params.metadata ?? {},
  });

  if (error) {
    console.error("Failed to record activity", error);
  }
}
