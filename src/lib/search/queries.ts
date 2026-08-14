import { sanitizeSearchQuery } from "@/lib/search/sanitize";
import type { SearchPersonHit, SearchResults, SearchTaskHit } from "@/lib/search/types";
import { createClient } from "@/lib/supabase/server";
import {
  isTaskPriority,
  isTaskStatus,
} from "@/lib/tasks/types";

const TASK_LIMIT = 20;
const PEOPLE_LIMIT = 8;

function mapTaskHit(row: {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_at: string | null;
}): SearchTaskHit | null {
  if (!isTaskStatus(row.status) || !isTaskPriority(row.priority)) {
    return null;
  }
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    dueAt: row.due_at,
  };
}

export async function searchWorkspace(rawQuery: string): Promise<SearchResults> {
  const query = sanitizeSearchQuery(rawQuery);
  if (query.length < 1) {
    return { query, tasks: [], people: [] };
  }

  const supabase = await createClient();
  const pattern = `%${query}%`;

  const [{ data: taskRows, error: taskError }, { data: peopleRows, error: peopleError }] =
    await Promise.all([
      supabase
        .from("nf_tasks")
        .select("id, title, status, priority, due_at")
        .is("archived_at", null)
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .order("updated_at", { ascending: false })
        .limit(TASK_LIMIT),
      supabase
        .from("profiles")
        .select("id, full_name, nest_id, email")
        .is("deleted_at", null)
        .or(
          `full_name.ilike.${pattern},nest_id.ilike.${pattern},email.ilike.${pattern}`,
        )
        .limit(PEOPLE_LIMIT),
    ]);

  if (taskError) throw new Error(taskError.message);
  if (peopleError) throw new Error(peopleError.message);

  const tasks = (taskRows ?? [])
    .map((row) =>
      mapTaskHit({
        id: row.id as string,
        title: row.title as string,
        status: row.status as string,
        priority: row.priority as string,
        due_at: (row.due_at as string | null) ?? null,
      }),
    )
    .filter((hit): hit is SearchTaskHit => hit !== null);

  const people: SearchPersonHit[] = (peopleRows ?? []).map((row) => ({
    userId: row.id as string,
    fullName: (row.full_name as string | null) ?? null,
    nestId: (row.nest_id as string | null) ?? null,
    email: (row.email as string | null) ?? null,
  }));

  return { query, tasks, people };
}
