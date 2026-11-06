import { describe, expect, it } from "vitest";
import { ANONYMOUS_ACTION_NOT_ALLOWED_ERROR } from "./constants/errors";
import {
  ACCOUNT_REQUIRED_FLYER_VOTE_MESSAGE,
  GENERIC_FLYER_VOTE_FAILURE_MESSAGE,
  flyerVoteFailureMessage,
} from "./flyer-vote-errors";

describe("flyerVoteFailureMessage", () => {
  it("tells the scanner the conversation requires an account", () => {
    expect(
      flyerVoteFailureMessage(ANONYMOUS_ACTION_NOT_ALLOWED_ERROR),
    ).toBe(ACCOUNT_REQUIRED_FLYER_VOTE_MESSAGE);
  });

  it("falls back to the generic message for other errors", () => {
    expect(flyerVoteFailureMessage("HTTP 500")).toBe(
      GENERIC_FLYER_VOTE_FAILURE_MESSAGE,
    );
  });

  it("falls back to the generic message with no error code", () => {
    expect(flyerVoteFailureMessage(undefined)).toBe(
      GENERIC_FLYER_VOTE_FAILURE_MESSAGE,
    );
  });
});
