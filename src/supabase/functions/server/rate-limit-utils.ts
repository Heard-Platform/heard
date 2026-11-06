import type { RateLimitedActionType } from "./types.tsx";
import {
  getLastRateLimitedActionAt,
  insertAnalyticsEvent,
  saveRateLimitedAction,
} from "./model-utils.ts";
import { runInBackground } from "./background-utils.ts";

export const RATE_LIMIT_WINDOW_MS: Record<
  RateLimitedActionType,
  number
> = {
  statement: 5000,
};

export const RATE_LIMIT_HIT_EVENTS: Record<
  RateLimitedActionType,
  string
> = {
  statement: "rate_limited_statement",
};

export const isWithinRateLimitWindow = (
  type: RateLimitedActionType,
  lastActionAt: number | null,
  now: number,
): boolean =>
  lastActionAt !== null &&
  now - lastActionAt < RATE_LIMIT_WINDOW_MS[type];

const recordRateLimitHit = (
  userId: string,
  type: RateLimitedActionType,
) =>
  insertAnalyticsEvent({
    type: RATE_LIMIT_HIT_EVENTS[type],
    userId,
  });

export const logActionUnlessRateLimited = async (
  userId: string,
  type: RateLimitedActionType,
  now: number = Date.now(),
): Promise<boolean> => {
  const lastActionAt = await getLastRateLimitedActionAt(userId, type);
  const isRateLimited = isWithinRateLimitWindow(
    type,
    lastActionAt,
    now,
  );
  if (isRateLimited) {
    runInBackground(
      recordRateLimitHit(userId, type),
      `rate limit hit (${type}) for user ${userId}`,
    );
  } else {
    await saveRateLimitedAction({ userId, type, lastActionAt: now });
  }
  return isRateLimited;
};
