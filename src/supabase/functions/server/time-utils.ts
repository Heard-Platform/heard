// @ts-ignore
import moment from "npm:moment-timezone@0.6.5";

export const ONE_WEEK_MIN = 7 * 24 * 60;
export const ONE_HOUR_MIN = 60;
export const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const ONE_MIN_MS = 60_000;

export const toTimestamp = (val: number | string | undefined): number => {
  if (!val) return 0;
  const n = Number(val);
  return isNaN(n) ? new Date(val).getTime() : n;
};

export const parseTimestampParam = (value: string | undefined): number | null => {
  if (!value) return null;
  const timestamp = Number(value);
  return Number.isFinite(timestamp) ? timestamp : null;
};

export const EASTERN_TIME_ZONE = "America/New_York";

export const getEasternDate = (time: number): string =>
  moment.tz(time, EASTERN_TIME_ZONE).format("YYYY-MM-DD");

// The Eastern calendar dates (YYYY-MM-DD) for the `days` days ending on the day of `time`, oldest first.
export const getEasternDatesEndingAt = (time: number, days: number): string[] =>
  Array.from({ length: days }, (_, i) =>
    moment.tz(time, EASTERN_TIME_ZONE).subtract(days - 1 - i, "days").format("YYYY-MM-DD"),
  );
