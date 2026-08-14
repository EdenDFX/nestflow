import type { TaskPriority, TaskStatus } from "@/lib/tasks/types";

export type SearchTaskHit = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
};

export type SearchPersonHit = {
  userId: string;
  fullName: string | null;
  nestId: string | null;
  email: string | null;
};

export type SearchResults = {
  query: string;
  tasks: SearchTaskHit[];
  people: SearchPersonHit[];
};

export const OPEN_SEARCH_EVENT = "nestflow:open-search";

export function openCommandPalette() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}
