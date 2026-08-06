import { z } from "zod";

/**
 * Postgres `uuid` accepts any 8-4-4-4-12 hex value. Zod's `.uuid()` is RFC 4122-strict
 * (version + variant bits), so seed IDs like `aaaaaaaa-aaaa-…` fail validation even though
 * Supabase stores them fine. `.guid()` matches that looser hex shape.
 */
export const pgUuid = z.string().guid({ message: "Invalid id." });
