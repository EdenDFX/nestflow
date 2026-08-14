export type IslandAttentionTone = "healthy" | "watch" | "risk";

export type IslandAttention = {
  label: string;
  href: string;
  tone: IslandAttentionTone;
};

export function islandAttention(counters: {
  overdue: number;
  blocked: number;
}): IslandAttention {
  if (counters.overdue > 0) {
    return {
      label:
        counters.overdue === 1 ? "1 overdue" : `${counters.overdue} overdue`,
      href: "/app/my-tasks",
      tone: "risk",
    };
  }

  if (counters.blocked > 0) {
    return {
      label:
        counters.blocked === 1 ? "1 blocked" : `${counters.blocked} blocked`,
      href: "/app/my-tasks",
      tone: "watch",
    };
  }

  return {
    label: "Clear",
    href: "/app/my-tasks",
    tone: "healthy",
  };
}
