import { describe, expect, it } from "vitest";

import { sanitizeSearchQuery } from "@/lib/search/sanitize";

describe("sanitizeSearchQuery", () => {
  it("trims, caps length, and strips ILIKE / or-filter breakers", () => {
    expect(sanitizeSearchQuery("  board  review  ")).toBe("board review");
    expect(sanitizeSearchQuery("100%_done,really")).toBe("100 done really");
    expect(sanitizeSearchQuery("a".repeat(100)).length).toBe(80);
  });
});
