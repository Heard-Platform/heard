import { selectAll, upsert } from "./db-utils.ts";
import { ScrapedItem } from "./types.tsx";

const TABLE_NAME = "scraped_items";
const CONFLICT_KEY = "source,guid";

// PostgREST returns absent optional columns as `null`; drop them so reads
// match the `?: T` type (and the shape the KV store produced before).
const stripNulls = (row: ScrapedItem): ScrapedItem => {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== null) out[key] = value;
  }
  return out as unknown as ScrapedItem;
};

export const getScrapedItem = async (
  source: string,
  guid: string,
): Promise<ScrapedItem | null> => {
  const rows = await selectAll<ScrapedItem>(TABLE_NAME, { source, guid });
  return rows[0] ? stripNulls(rows[0]) : null;
};

export const saveScrapedItem = async (item: ScrapedItem): Promise<void> => {
  const { success, error } = await upsert(TABLE_NAME, item, CONFLICT_KEY);
  if (!success) throw new Error(error ?? "Failed to save scraped item");
};
