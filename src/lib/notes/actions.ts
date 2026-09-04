"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireActiveProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { pgUuid } from "@/lib/validation/ids";

export type NoteActionResult = {
  ok: boolean;
  error?: string;
  code?: string;
  noteId?: string;
};

const dayKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid calendar day.");

const createSchema = z.object({
  title: z.string().trim().max(200).default(""),
  body: z.string().trim().max(20000).default(""),
  notedOn: dayKeySchema.optional(),
});

const updateSchema = createSchema.extend({
  noteId: pgUuid,
});

function todayLagosYmd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function revalidateNotes() {
  revalidatePath("/app/my-tasks");
  revalidatePath("/app");
  revalidatePath("/app/work");
}

export async function createPersonalNoteAction(
  input: z.infer<typeof createSchema>,
): Promise<NoteActionResult> {
  const profile = await requireActiveProfile();
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: parsed.error.issues[0]?.message ?? "Invalid note.",
    };
  }

  const title = parsed.data.title || "Untitled note";
  const body = parsed.data.body;
  if (!title.trim() && !body.trim()) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: "Write a title or note body.",
    };
  }

  const notedOn = parsed.data.notedOn ?? todayLagosYmd();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nf_personal_notes")
    .insert({
      user_id: profile.userId,
      title,
      body,
      noted_on: notedOn,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      code: "INTERNAL",
      error: error?.message ?? "Could not create note.",
    };
  }

  revalidateNotes();
  return { ok: true, noteId: data.id as string };
}

export async function updatePersonalNoteAction(
  input: z.infer<typeof updateSchema>,
): Promise<NoteActionResult> {
  const profile = await requireActiveProfile();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: parsed.error.issues[0]?.message ?? "Invalid note.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("nf_personal_notes")
    .update({
      title: parsed.data.title || "Untitled note",
      body: parsed.data.body,
      noted_on: parsed.data.notedOn ?? todayLagosYmd(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.noteId)
    .eq("user_id", profile.userId);

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  revalidateNotes();
  return { ok: true, noteId: parsed.data.noteId };
}

export async function deletePersonalNoteAction(
  noteId: string,
): Promise<NoteActionResult> {
  const profile = await requireActiveProfile();
  const parsed = pgUuid.safeParse(noteId);
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid note id." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("nf_personal_notes")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", profile.userId);

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  revalidateNotes();
  return { ok: true, noteId: parsed.data };
}
