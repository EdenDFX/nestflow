import { createClient } from "@/lib/supabase/server";
import type { PersonalNote } from "@/lib/notes/types";

type NoteRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  noted_on: string;
  created_at: string;
  updated_at: string;
};

function mapNote(row: NoteRow): PersonalNote {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    notedOn: row.noted_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPersonalNotes(
  userId: string,
): Promise<PersonalNote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nf_personal_notes")
    .select("id, user_id, title, body, noted_on, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as NoteRow[] | null)?.map(mapNote) ?? [];
}
