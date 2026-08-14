export function personLabel(person: {
  fullName?: string | null;
  nestId?: string | null;
  email?: string | null;
}): string {
  return person.fullName?.trim() || person.nestId || person.email || "Unknown";
}
