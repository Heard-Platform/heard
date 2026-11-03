import { describe, expect, it } from "vitest";
import type { Statement } from "../types";
import { getCrowdVerdict, getVoteEvent } from "./vote-result";

const buildStatement = (overrides: Partial<Statement>): Statement => ({
  id: "statement-1",
  text: "Metro should run later on weekends",
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

const VOTER_ID = "voter-2";
const FIRST_VOTE = { type: "first_vote", headline: "First vote!" };
const SWUNG_VOTE = { type: "swung_vote", headline: "You swung the vote!" };

describe("getVoteEvent", () => {
  it("has no vote event for a pass", () => {
    expect(getVoteEvent(buildStatement({}), "pass", VOTER_ID)).toBeNull();
  });

  it("has no vote event when the author votes on their own statement", () => {
    expect(getVoteEvent(buildStatement({}), "agree", "other-user")).toBeNull();
  });

  it("is a first vote when nobody has agreed or disagreed yet", () => {
    expect(getVoteEvent(buildStatement({ passes: 3 }), "agree", VOTER_ID)).toEqual(FIRST_VOTE);
  });

  it("is a first vote when only the author has agreed", () => {
    const statement = buildStatement({ agrees: 1, voters: { "other-user": "agree" } });
    expect(getVoteEvent(statement, "disagree", VOTER_ID)).toEqual(FIRST_VOTE);
  });

  it("is not a first vote once someone other than the author has agreed or disagreed", () => {
    const statement = buildStatement({ agrees: 1, voters: { "voter-1": "agree" } });
    expect(getVoteEvent(statement, "agree", VOTER_ID)).toBeNull();
  });

  it("is a swung vote when the vote breaks an exact tie", () => {
    expect(getVoteEvent(buildStatement({ agrees: 3, disagrees: 3 }), "disagree", VOTER_ID)).toEqual(SWUNG_VOTE);
  });

  it("counts super agrees toward the agree side", () => {
    const statement = buildStatement({ agrees: 2, superAgrees: 1, disagrees: 3 });
    expect(getVoteEvent(statement, "super_agree", VOTER_ID)).toEqual(SWUNG_VOTE);
  });

  it("has no vote event for an ordinary vote", () => {
    expect(getVoteEvent(buildStatement({ agrees: 27, disagrees: 11 }), "agree", VOTER_ID)).toBeNull();
  });
});

describe("getCrowdVerdict", () => {
  it("says most passed when passes are over half the votes", () => {
    expect(getCrowdVerdict({ agree: 2, disagree: 2, pass: 15 })).toEqual({ headline: "Most passed", leadingSide: "pass" });
  });

  it("says most passed when nobody took a side", () => {
    expect(getCrowdVerdict({ agree: 0, disagree: 0, pass: 1 })).toEqual({ headline: "Most passed", leadingSide: "pass" });
  });

  it("says everyone agrees when every vote is agree", () => {
    expect(getCrowdVerdict({ agree: 12, disagree: 0, pass: 0 })).toEqual({ headline: "Everyone agrees", leadingSide: "agree" });
  });

  it("says everyone disagrees when every vote is disagree", () => {
    expect(getCrowdVerdict({ agree: 0, disagree: 3, pass: 0 })).toEqual({ headline: "Everyone disagrees", leadingSide: "disagree" });
  });

  it("says most agree rather than everyone when some passed", () => {
    expect(getCrowdVerdict({ agree: 15, disagree: 0, pass: 2 })).toEqual({ headline: "Most agree", leadingSide: "agree" });
  });

  it("says split when the sides are within the nearly split gap", () => {
    expect(getCrowdVerdict({ agree: 10, disagree: 10, pass: 0 })).toEqual({ headline: "Split down the middle", leadingSide: null });
    expect(getCrowdVerdict({ agree: 1, disagree: 1, pass: 0 })).toEqual({ headline: "Split down the middle", leadingSide: null });
  });

  it("says most agree or most disagree for a clear majority", () => {
    expect(getCrowdVerdict({ agree: 16, disagree: 4, pass: 0 })).toEqual({ headline: "Most agree", leadingSide: "agree" });
    expect(getCrowdVerdict({ agree: 3, disagree: 16, pass: 1 })).toEqual({ headline: "Most disagree", leadingSide: "disagree" });
  });
});
