"use client";

import { useMemo, useState, type KeyboardEvent } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { personLabel } from "@/lib/people/label";
import type { TaskAssignee } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

export function MentionField({
  people,
  value,
  onChange,
  placeholder,
  disabled,
  rows = 3,
  id,
  singleLine = false,
}: {
  people: TaskAssignee[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  id?: string;
  singleLine?: boolean;
}) {
  const [highlight, setHighlight] = useState(0);

  const mention = useMemo(() => {
    const match = value.match(/@([A-Za-z0-9._-]*)$/);
    if (!match) return null;
    return { query: match[1]!.toLowerCase(), start: match.index ?? 0 };
  }, [value]);

  const suggestions = useMemo(() => {
    if (!mention) return [];
    const q = mention.query;
    return people
      .filter((person) => {
        const nest = person.nestId?.toLowerCase() ?? "";
        const name = person.fullName?.toLowerCase() ?? "";
        const email = person.email?.toLowerCase() ?? "";
        if (!nest && !name) return false;
        if (!q) return true;
        return nest.includes(q) || name.includes(q) || email.includes(q);
      })
      .slice(0, 6);
  }, [mention, people]);

  function insert(person: TaskAssignee) {
    const nest = person.nestId;
    if (!nest || mention === null) return;
    const before = value.slice(0, mention.start);
    onChange(`${before}@${nest} `);
    setHighlight(0);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
    if (suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((index) => (index + 1) % suggestions.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((index) => (index - 1 + suggestions.length) % suggestions.length);
      return;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      const person = suggestions[highlight];
      if (person) {
        event.preventDefault();
        insert(person);
      }
    }
    if (event.key === "Escape") {
      onChange(value);
      setHighlight(0);
    }
  }

  const field = singleLine ? (
    <Input
      id={id}
      value={value}
      onChange={(event) => {
        setHighlight(0);
        onChange(event.target.value);
      }}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete="off"
    />
  ) : (
    <Textarea
      id={id}
      value={value}
      onChange={(event) => {
        setHighlight(0);
        onChange(event.target.value);
      }}
      onKeyDown={onKeyDown}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
    />
  );

  return (
    <div className="relative space-y-1">
      {field}
      {suggestions.length > 0 ? (
        <ul
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-sm"
          role="listbox"
        >
          {suggestions.map((person, index) => (
            <li key={person.userId}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlight}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm",
                  index === highlight && "bg-muted",
                )}
                onMouseDown={(event) => {
                  event.preventDefault();
                  insert(person);
                }}
              >
                <span className="truncate">{personLabel(person)}</span>
                <span className="truncate text-[11px] text-muted-foreground">
                  @{person.nestId ?? "no-id"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
