import type { Statement } from "../types";

export const DELAY_MS = 1000;
export const INTERVAL_MS = 10000;
export const MAX_PER_VISIT = 3;

export const hasUserAuthoredStatement = (
  statements: Statement[],
  userId: string,
): boolean =>
  statements.some((statement) => statement.author === userId);

export const getDelayUntilNextShimmerMs = (
  shimmersShownCount: number,
): number | null => {
  if (shimmersShownCount >= MAX_PER_VISIT) {
    return null;
  }
  return shimmersShownCount === 0
    ? DELAY_MS
    : INTERVAL_MS;
};
