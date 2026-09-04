"use client";

import { useEffect, useMemo, useState, type KeyboardEvent, type RefObject } from "react";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { personLabel } from "@/lib/people/label";
import { loadMentionablePeopleAction } from "@/lib/tasks/mention-actions";
import type { TaskAssignee } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

const SUGGESTION_LIMIT = 12;

export function MentionField({
  people: initialPeople,
  taskId,
  value,
  onChange,
  placeholder,
  disabled,
  rows = 3,
  id,
  singleLine = false,
  textareaRef,
  onKeyDown: onKeyDownProp,
}: {
  people: TaskAssignee[];
  taskId?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  id?: string;
  singleLine?: boolean;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  const [highlight, setHighlight] = useState(0);
  const [people, setPeople] = useState(initialPeople);
  const [peopleSource, setPeopleSource] = useState(initialPeople);
  if (initialPeople !== peopleSource) {
    setPeopleSource(initialPeople);
    setPeople(initialPeople);
  }

  useEffect(() => {
    let cancelled = false;

    async function refreshPeople() {
      const loaded = await loadMentionablePeopleAction(taskId);
      if (!cancelled && loaded.length > 0) {
        setPeople(loaded);
      }
    }

    void refreshPeople();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

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
      .slice(0, SUGGESTION_LIMIT);
  }, [mention, people]);

  const suggestionsOpen = suggestions.length > 0;

  function insert(person: TaskAssignee) {
    const nest = person.nestId;
    if (!nest || mention === null) return;
    const before = value.slice(0, mention.start);
    onChange(`${before}@${nest} `);
    setHighlight(0);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
    if (suggestions.length > 0) {
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
          return;
        }
      }
      if (event.key === "Escape") {
        onChange(value);
        setHighlight(0);
        return;
      }
    }

    if (!singleLine && onKeyDownProp && event.currentTarget instanceof HTMLTextAreaElement) {
      onKeyDownProp(event as KeyboardEvent<HTMLTextAreaElement>);
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
      ref={textareaRef}
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
    <Popover open={suggestionsOpen}>
      <PopoverAnchor asChild>
        <div className="w-full min-w-0">{field}</div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={6}
        collisionPadding={12}
        className="w-[var(--radix-popover-trigger-width)] max-h-[min(15rem,40dvh)] overflow-y-auto p-0 shadow-lg"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <ul role="listbox" className="py-1">
          {suggestions.map((person, index) => (
            <li key={person.userId}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlight}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm",
                  index === highlight && "bg-muted",
                )}
                onMouseDown={(event) => {
                  event.preventDefault();
                  insert(person);
                }}
              >
                <span className="min-w-0 truncate">{personLabel(person)}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  @{person.nestId ?? "no-id"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
