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
