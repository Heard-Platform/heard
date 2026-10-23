import type { Statement } from "../types";

export const ADD_RESPONSE_NUDGE_FIRST_SHIMMER_DELAY_MS = 1000;
export const ADD_RESPONSE_NUDGE_SHIMMER_INTERVAL_MS = 10000;
export const ADD_RESPONSE_NUDGE_MAX_SHIMMERS_PER_VISIT = 3;

export const hasUserAuthoredStatement = (
  statements: Statement[],
  userId: string,
): boolean =>
  statements.some((statement) => statement.author === userId);

export const getDelayUntilNextShimmerMs = (
  shimmersShownCount: number,
): number | null => {
  if (shimmersShownCount >= ADD_RESPONSE_NUDGE_MAX_SHIMMERS_PER_VISIT) {
    return null;
  }
  return shimmersShownCount === 0
    ? ADD_RESPONSE_NUDGE_FIRST_SHIMMER_DELAY_MS
    : ADD_RESPONSE_NUDGE_SHIMMER_INTERVAL_MS;
};
