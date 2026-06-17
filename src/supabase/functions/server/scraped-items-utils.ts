import { selectAll, upsert } from "./db-utils.ts";
import { ScrapedItem } from "./types.tsx";

const TABLE_NAME = "scraped_items";
const CONFLICT_KEY = "source,guid";

export const getScrapedItem = async (
  source: string,
  guid: string,
): Promise<ScrapedItem | null> => {
  const rows = await selectAll<ScrapedItem>(TABLE_NAME, { source, guid });
  return rows[0] ?? null;
};

export const saveScrapedItem = async (item: ScrapedItem): Promise<void> => {
  const { success, error } = await upsert(TABLE_NAME, item, CONFLICT_KEY);
  if (!success) throw new Error(error ?? "Failed to save scraped item");
};

export const getScrapedItems = async (
  source: string,
): Promise<ScrapedItem[]> => selectAll<ScrapedItem>(TABLE_NAME, { source });
