export type IslandAttentionTone = "healthy" | "watch" | "risk";

export type IslandAttention = {
  label: string;
  href: string;
  tone: IslandAttentionTone;
};

export function islandAttention(
  counters: {
    overdue: number;
    blocked: number;
  },
  options?: { href?: string },
): IslandAttention {
  const href = options?.href ?? "/app/my-tasks";

  if (counters.overdue > 0) {
    return {
      label:
        counters.overdue === 1 ? "1 overdue" : `${counters.overdue} overdue`,
      href,
      tone: "risk",
    };
  }

  if (counters.blocked > 0) {
    return {
      label:
        counters.blocked === 1 ? "1 blocked" : `${counters.blocked} blocked`,
      href,
      tone: "watch",
    };
  }

  return {
    label: "Clear",
    href,
    tone: "healthy",
  };
}
