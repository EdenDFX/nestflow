"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { personLabel } from "@/lib/people/label";
import type { TaskAssignee } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

export function AssigneePicker({
  people,
  value,
  onChange,
  disabled = false,
  id,
}: {
  people: TaskAssignee[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  id?: string;
}) {
  const [query, setQuery] = useState("");

  const selected = useMemo(() => {
    const selectedSet = new Set(value);
    return people.filter((person) => selectedSet.has(person.userId));
  }, [people, value]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((person) =>
      [person.fullName, person.nestId, person.email]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q)),
    );
  }, [people, query]);

  function toggle(userId: string) {
    if (disabled) return;
    onChange(
      value.includes(userId)
        ? value.filter((id) => id !== userId)
        : [...value, userId],
    );
  }

  return (
    <div className="space-y-2">
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((person) => (
            <button
              key={person.userId}
              type="button"
              disabled={disabled}
              onClick={() => toggle(person.userId)}
              className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs hover:bg-muted disabled:opacity-50"
              aria-label={`Remove ${personLabel(person)}`}
            >
              {personLabel(person)}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Unassigned</p>
      )}

      <Input
        id={id}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search people"
        disabled={disabled}
        aria-label="Search people to assign"
      />

      <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
        {visible.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">
            No matching people.
          </p>
        ) : (
          visible.map((person) => {
            const checked = value.includes(person.userId);
            return (
              <label
                key={person.userId}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/70",
                  checked && "bg-primary/5",
                  disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <input
                  type="checkbox"
                  className="size-3.5 accent-primary"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(person.userId)}
                />
                <span className="min-w-0 truncate">{personLabel(person)}</span>
                {person.nestId ? (
                  <span className="ml-auto truncate text-[11px] text-muted-foreground">
                    {person.nestId}
                  </span>
                ) : null}
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
