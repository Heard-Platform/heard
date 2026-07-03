import type { SentEmail } from "../../../types";

export const DAY_MS = 24 * 60 * 60 * 1000;

// Above these counts, the send frequency to a recipient is worth a second look.
export const WARN_24H = 1;
export const WARN_3D = 2;
export const WARN_7D = 3;
export const WARN_30D = 8;

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function formatRelativeTime(ts: number | null): string {
  if (ts === null) return "Never sent before";
  const diffMin = Math.round((Date.now() - ts) / 60_000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export interface FrequencyWatchlistEntry {
  recipientId: string;
  email: string;
  sentLast24h: number;
  sentLast3d: number;
  sentLast7d: number;
  sentLast30d: number;
}

export function buildFrequencyWatchlist(sentEmails: SentEmail[]): FrequencyWatchlistEntry[] {
  const now = Date.now();
  const recipientIds = Array.from(new Set(sentEmails.map((e) => e.recipientId)));

  return recipientIds
    .map((recipientId) => {
      const history = sentEmails.filter((e) => e.recipientId === recipientId);
      return {
        recipientId,
        email: history[0].recipientEmail,
        sentLast24h: history.filter((e) => e.sentAt >= now - DAY_MS).length,
        sentLast3d: history.filter((e) => e.sentAt >= now - 3 * DAY_MS).length,
        sentLast7d: history.filter((e) => e.sentAt >= now - 7 * DAY_MS).length,
        sentLast30d: history.filter((e) => e.sentAt >= now - 30 * DAY_MS).length,
      };
    })
    .sort(
      (a, b) =>
        b.sentLast24h - a.sentLast24h ||
        b.sentLast3d - a.sentLast3d ||
        b.sentLast7d - a.sentLast7d ||
        b.sentLast30d - a.sentLast30d,
    );
}

export function isOverThreshold(entry: FrequencyWatchlistEntry): boolean {
  return (
    entry.sentLast24h > WARN_24H ||
    entry.sentLast3d > WARN_3D ||
    entry.sentLast7d > WARN_7D ||
    entry.sentLast30d > WARN_30D
  );
}
