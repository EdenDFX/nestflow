"use server";

import { requireActiveProfile } from "@/lib/auth/session";
import { searchWorkspace } from "@/lib/search/queries";
import type { SearchResults } from "@/lib/search/types";

export async function searchWorkspaceAction(
  query: string,
): Promise<SearchResults> {
  await requireActiveProfile();
  return searchWorkspace(query);
}
