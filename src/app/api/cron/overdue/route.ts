import { NextResponse } from "next/server";

import { notifyUser } from "@/lib/notifications/notify";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminClientConfigured()) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY is required for overdue notification scans.",
      },
      { status: 500 },
    );
  }

  const admin = createAdminClient()!;
  const now = new Date();
  const dueSoonCutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data: tasks, error } = await admin
    .schema("nestflow")
    .from("tasks")
    .select("id, title, due_at, status, archived_at")
    .not("due_at", "is", null)
    .is("archived_at", null)
    .neq("status", "completed")
    .lte("due_at", dueSoonCutoff.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let overdue = 0;
  let dueSoon = 0;

  for (const task of tasks ?? []) {
    if (!task.due_at) continue;

    const { data: assignees } = await admin
      .schema("nestflow")
      .from("task_assignees")
      .select("user_id")
      .eq("task_id", task.id);

    const userIds = (assignees ?? []).map((row) => row.user_id as string);
    if (userIds.length === 0) continue;

    const dueAt = new Date(task.due_at);
    const isOverdue = dueAt.getTime() < now.getTime();
    const key = dayKey(now);

    for (const userId of userIds) {
      if (isOverdue) {
        const id = await notifyUser({
          userId,
          system: true,
          eventType: "task_overdue",
          title: "Task is overdue",
          body: task.title,
          taskId: task.id,
          href: `/app/tasks/${task.id}`,
          idempotencyKey: `overdue:${task.id}:${userId}:${key}`,
        });
        if (id) overdue += 1;
      } else {
        const id = await notifyUser({
          userId,
          system: true,
          eventType: "task_due_soon",
          title: "Task due within 24 hours",
          body: task.title,
          taskId: task.id,
          href: `/app/tasks/${task.id}`,
          idempotencyKey: `due_soon:${task.id}:${userId}:${key}`,
        });
        if (id) dueSoon += 1;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: tasks?.length ?? 0,
    overdueCreated: overdue,
    dueSoonCreated: dueSoon,
  });
}

export async function GET(request: Request) {
  return POST(request);
}
