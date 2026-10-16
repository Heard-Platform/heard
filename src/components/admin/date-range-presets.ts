const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export interface DateRange {
  from: Date | null;
  to: Date;
}

export type DateRangePresetKey = "last24Hours" | "last7Days" | "last30Days" | "last3Months" | "allTime";

export type DateRangeSelection =
  | { kind: "preset"; preset: DateRangePresetKey }
  | { kind: "custom"; from: Date; to: Date };

interface DateRangePreset {
  key: DateRangePresetKey;
  label: string;
  durationMs: number | null;
}

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  { key: "last24Hours", label: "Last 24 hours", durationMs: DAY_MS },
  { key: "last7Days", label: "Last 7 days", durationMs: 7 * DAY_MS },
  { key: "last30Days", label: "Last 30 days", durationMs: 30 * DAY_MS },
  { key: "last3Months", label: "Last 3 months", durationMs: 90 * DAY_MS },
  { key: "allTime", label: "All time", durationMs: null },
];

export const DEFAULT_DATE_RANGE_SELECTION: DateRangeSelection = { kind: "preset", preset: "allTime" };

const findPreset = (key: DateRangePresetKey) => DATE_RANGE_PRESETS.find((preset) => preset.key === key)!;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) => new Date(startOfDay(date).getTime() + DAY_MS - 1);

export function resolveDateRange(selection: DateRangeSelection, now: Date): DateRange {
  if (selection.kind === "custom") {
    return { from: startOfDay(selection.from), to: endOfDay(selection.to) };
  }
  const { durationMs } = findPreset(selection.preset);
  return {
    from: durationMs === null ? null : new Date(now.getTime() - durationMs),
    to: now,
  };
}

const formatDay = (date: Date) => date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function formatDateRangeSelection(selection: DateRangeSelection): string {
  if (selection.kind === "preset") return findPreset(selection.preset).label;
  return `${formatDay(selection.from)} – ${formatDay(selection.to)}`;
}
