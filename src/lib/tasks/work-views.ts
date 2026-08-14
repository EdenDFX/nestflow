export const WORK_VIEWS = ["board", "list", "calendar"] as const;
export type WorkView = (typeof WORK_VIEWS)[number];

export function isWorkView(value: string | null | undefined): value is WorkView {
  return value === "board" || value === "list" || value === "calendar";
}
