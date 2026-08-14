/** Strip ILIKE wildcards and commas so PostgREST `or` filters stay valid. */
export function sanitizeSearchQuery(raw: string): string {
  return raw
    .trim()
    .slice(0, 80)
    .replaceAll("\\", " ")
    .replaceAll("%", " ")
    .replaceAll("_", " ")
    .replaceAll(",", " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}
