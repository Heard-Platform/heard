import { describe, expect, it } from "vitest";
import type { Statement } from "../types";
import {
  ADD_RESPONSE_NUDGE_FIRST_SHIMMER_DELAY_MS,
  ADD_RESPONSE_NUDGE_MAX_SHIMMERS_PER_VISIT,
  ADD_RESPONSE_NUDGE_SHIMMER_INTERVAL_MS,
  getDelayUntilNextAddResponseShimmerMs,
  hasUserAuthoredStatement,
} from "./add-response-nudge";

const buildStatement = (overrides: Partial<Statement>): Statement => ({
  id: "statement-1",
  text: "A statement",
  author: "other-user",
  agrees: 0,
  disagrees: 0,
  passes: 0,
  superAgrees: 0,
  roomId: "room-1",
  timestamp: 0,
  round: 1,
  voters: {},
  ...overrides,
});

describe("hasUserAuthoredStatement", () => {
  it("is false when the user wrote none of the statements", () => {
    const statements = [buildStatement({ author: "other-user" })];
    expect(hasUserAuthoredStatement(statements, "current-user")).toBe(false);
  });

  it("is true when the user is the author of a statement", () => {
    const statements = [
      buildStatement({ id: "statement-1", author: "other-user" }),
      buildStatement({ id: "statement-2", author: "current-user" }),
    ];
    expect(hasUserAuthoredStatement(statements, "current-user")).toBe(true);
  });

  it("is false when there are no statements", () => {
    expect(hasUserAuthoredStatement([], "current-user")).toBe(false);
  });
});

describe("getDelayUntilNextAddResponseShimmerMs", () => {
  it("waits the short first delay before the first shimmer", () => {
    expect(getDelayUntilNextAddResponseShimmerMs(0)).toBe(
      ADD_RESPONSE_NUDGE_FIRST_SHIMMER_DELAY_MS,
    );
  });

  it("waits the repeat interval between later shimmers", () => {
    expect(getDelayUntilNextAddResponseShimmerMs(1)).toBe(
      ADD_RESPONSE_NUDGE_SHIMMER_INTERVAL_MS,
    );
    expect(
      getDelayUntilNextAddResponseShimmerMs(
        ADD_RESPONSE_NUDGE_MAX_SHIMMERS_PER_VISIT - 1,
      ),
    ).toBe(ADD_RESPONSE_NUDGE_SHIMMER_INTERVAL_MS);
  });

  it("stops once the per-visit maximum has been shown", () => {
    expect(
      getDelayUntilNextAddResponseShimmerMs(
        ADD_RESPONSE_NUDGE_MAX_SHIMMERS_PER_VISIT,
      ),
    ).toBeNull();
  });
});
