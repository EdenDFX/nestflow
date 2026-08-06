export type ChecklistItem = {
  id: string;
  taskId: string;
  title: string;
  isDone: boolean;
  position: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskComment = {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string | null;
  authorNestId: string | null;
  body: string;
  mentionedUserIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type TaskAttachment = {
  id: string;
  taskId: string;
  uploadedBy: string;
  uploaderName: string | null;
  objectKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type ActivityEvent = {
  id: string;
  taskId: string;
  actorId: string | null;
  actorName: string | null;
  eventType: string;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type TaskCollaboration = {
  checklist: ChecklistItem[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
  activity: ActivityEvent[];
};

export function parseMentions(
  body: string,
  people: Array<{ userId: string; nestId: string | null; email: string | null }>,
) {
  const tokens = body.match(/@([A-Za-z0-9._@+-]+)/g) ?? [];
  const mentioned = new Set<string>();

  for (const token of tokens) {
    const raw = token.slice(1).toLowerCase();
    for (const person of people) {
      const nest = person.nestId?.toLowerCase();
      const email = person.email?.toLowerCase();
      if (raw === nest || raw === email || (email && raw === email.split("@")[0])) {
        mentioned.add(person.userId);
      }
    }
  }

  return [...mentioned];
}
