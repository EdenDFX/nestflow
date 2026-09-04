"use client";

import { format, parse } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import { toast } from "@/lib/sounds/toast";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DeleteButton } from "@/components/ui/delete-button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createPersonalNoteAction,
  deletePersonalNoteAction,
  updatePersonalNoteAction,
} from "@/lib/notes/actions";
import type { PersonalNote } from "@/lib/notes/types";

function formatUpdated(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function NotesCreateDialog({
  triggerLabel = "New note",
  defaultNotedOn,
  trigger,
}: {
  triggerLabel?: string;
  /** YYYY-MM-DD calendar day the note should appear on. */
  defaultNotedOn?: string;
  trigger?: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [notedOn, setNotedOn] = useState(
    () => defaultNotedOn ?? todayInputValue(),
  );

  const bodyChars = body.trim().length;
  const selectedDay = useMemo(() => parseDayKey(notedOn), [notedOn]);

  function reset() {
    setTitle("");
    setBody("");
    setNotedOn(defaultNotedOn ?? todayInputValue());
    setDayPickerOpen(false);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createPersonalNoteAction({ title, body, notedOn });
      if (!result.ok) {
        toast.error(result.error ?? "Could not create note.");
        return;
      }
      toast.success("Note saved.");
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setNotedOn(defaultNotedOn ?? todayInputValue());
          return;
        }
        // Defer reset until after dialog children unmount.
        queueMicrotask(() => {
          reset();
        });
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="rounded-full" variant="secondary">
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        showCloseButton
        className="gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <form onSubmit={onSubmit} className="flex flex-col">
          <DialogHeader className="border-b border-border/70 px-5 py-4 pr-14 sm:pl-6 sm:pr-16">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <DialogTitle className="text-lg">Note editor</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Private to you. Lands on the calendar day you pick.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mr-1 h-9 shrink-0 rounded-full px-3 text-xs font-medium"
                aria-expanded={dayPickerOpen}
                aria-controls="note-day-calendar"
                onClick={() => setDayPickerOpen((current) => !current)}
              >
                <span className="text-muted-foreground">Day</span>
                <span className="ml-1.5 text-foreground">
                  {formatDayLabel(notedOn)}
                </span>
              </Button>
            </div>
          </DialogHeader>

          {dayPickerOpen ? (
            <div
              id="note-day-calendar"
              className="flex justify-center border-b border-border/70 bg-muted/20 px-3 py-3"
            >
              <Calendar
                mode="single"
                weekStartsOn={1}
                selected={selectedDay}
                defaultMonth={selectedDay}
                onSelect={(date) => {
                  if (!date) return;
                  setNotedOn(toDayKey(date));
                  setDayPickerOpen(false);
                }}
              />
            </div>
          ) : null}

          <div className="nf-editor-paper min-h-[22rem] px-5 py-5 sm:px-8 sm:py-7">
            <Label htmlFor="note-title" className="sr-only">
              Title
            </Label>
            <Input
              id="note-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              placeholder="Title"
              className="h-auto rounded-none border-0 bg-transparent px-0 py-0 font-heading text-2xl font-semibold tracking-tight shadow-none placeholder:text-muted-foreground/55 focus-visible:ring-0 md:text-3xl dark:bg-transparent"
            />
            <div
              className="my-4 h-px bg-border/70"
              aria-hidden
            />
            <Label htmlFor="note-body" className="sr-only">
              Note
            </Label>
            <Textarea
              id="note-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={10}
              placeholder="Start writing…"
              required
              className="min-h-[14rem] resize-none rounded-none border-0 bg-transparent px-0 py-0 text-base leading-7 shadow-none placeholder:text-muted-foreground/55 focus-visible:ring-0 md:text-[15px] dark:bg-transparent"
            />
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-none border-border/70 bg-background/80 px-5 py-3 sm:px-6">
            <p className="mr-auto text-xs text-muted-foreground tabular-nums">
              {bodyChars === 0
                ? "Empty draft"
                : `${bodyChars} character${bodyChars === 1 ? "" : "s"}`}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !body.trim()}>
              {pending ? "Saving…" : "Save note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function todayInputValue(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function parseDayKey(value: string): Date {
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

function toDayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function formatDayLabel(value: string): string {
  const parsed = parseDayKey(value);
  return format(parsed, "d MMM yyyy");
}

export function PersonalNotesPanel({ notes }: { notes: PersonalNote[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editNotedOn, setEditNotedOn] = useState(todayInputValue());

  function startEdit(note: PersonalNote) {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditBody(note.body);
    setEditNotedOn(note.notedOn);
  }

  function saveEdit() {
    if (!editingId) return;
    startTransition(async () => {
      const result = await updatePersonalNoteAction({
        noteId: editingId,
        title: editTitle,
        body: editBody,
        notedOn: editNotedOn,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not update note.");
        return;
      }
      toast.success("Note updated.");
      setEditingId(null);
      router.refresh();
    });
  }

  function remove(noteId: string) {
    startTransition(async () => {
      const result = await deletePersonalNoteAction(noteId);
      if (!result.ok) {
        toast.error(result.error ?? "Could not delete note.");
        return;
      }
      toast.success("Note deleted.", { sound: false });
      if (editingId === noteId) setEditingId(null);
      // Let the confirm checkmark land before the list refreshes.
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Notes
          </h2>
          <p className="text-sm text-muted-foreground">
            Private notepad. Notes also appear on your calendar for the day you
            pick.
          </p>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
          No notes yet. Capture ideas here instead of creating personal tasks.
        </p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-2xl border border-border/70 bg-card p-4"
            >
              {editingId === note.id ? (
                <div className="space-y-3">
                  <Input
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                    maxLength={200}
                    placeholder="Title"
                  />
                  <div className="space-y-2">
                    <Label htmlFor={`note-day-${note.id}`}>Calendar day</Label>
                    <Input
                      id={`note-day-${note.id}`}
                      type="date"
                      value={editNotedOn}
                      onChange={(event) => setEditNotedOn(event.target.value)}
                    />
                  </div>
                  <Textarea
                    value={editBody}
                    onChange={(event) => setEditBody(event.target.value)}
                    rows={5}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={saveEdit}
                      disabled={pending || !editBody.trim()}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                      disabled={pending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-medium">{note.title || "Untitled note"}</h3>
                    <time className="text-xs text-muted-foreground">
                      On {formatNotedOn(note.notedOn)} · Updated{" "}
                      {formatUpdated(note.updatedAt)}
                    </time>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {note.body}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(note)}
                      disabled={pending}
                    >
                      Edit
                    </Button>
                    <DeleteButton
                      disabled={pending}
                      onConfirm={() => remove(note.id)}
                    />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatNotedOn(value: string) {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function NoteReadDialog({
  note,
  open,
  onOpenChange,
}: {
  note: PersonalNote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{note.title || "Untitled note"}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          On {formatNotedOn(note.notedOn)}
        </p>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {note.body}
        </p>
      </DialogContent>
    </Dialog>
  );
}
