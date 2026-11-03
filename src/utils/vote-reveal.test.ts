import { describe, expect, it } from "vitest";
import type { Statement } from "../types";
import {
  ANONYMOUS_CURRENT_VOTER_ID,
  buildVoteReveal,
  countVoterVotes,
  sampleVotesForCrowd,
  type VoterVote,
} from "./vote-reveal";

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

const buildVoterVotes = (side: VoterVote["vote"], count: number): VoterVote[] =>
  Array.from({ length: count }, (_, i) => ({ voterId: `${side}-${i}`, vote: side }));

describe("buildVoteReveal", () => {
  it("adds the current voter's vote to everyone else's", () => {
    const statement = buildStatement({
      agrees: 1,
      disagrees: 1,
      passes: 1,
      voters: { a: "agree", b: "disagree", c: "pass" },
    });

    const reveal = buildVoteReveal(statement, "agree", "me");

    expect(reveal.currentVoterId).toBe("me");
    expect(reveal.voterVotes).toEqual([
      { voterId: "a", vote: "agree" },
      { voterId: "b", vote: "disagree" },
      { voterId: "c", vote: "pass" },
      { voterId: "me", vote: "agree" },
    ]);
  });

  it("counts super agrees as agrees", () => {
    const statement = buildStatement({ superAgrees: 1, voters: { a: "super_agree" } });

    expect(buildVoteReveal(statement, "super_agree", "me").voterVotes).toEqual([
      { voterId: "a", vote: "agree" },
      { voterId: "me", vote: "agree" },
    ]);
  });

  it("replaces a vote the current voter already had on the statement", () => {
    const statement = buildStatement({ disagrees: 1, voters: { me: "disagree" } });

    expect(buildVoteReveal(statement, "agree", "me").voterVotes).toEqual([{ voterId: "me", vote: "agree" }]);
  });

  it("uses a stand-in id when the voter has no id", () => {
    const reveal = buildVoteReveal(buildStatement({}), "pass", undefined);

    expect(reveal.currentVoterId).toBe(ANONYMOUS_CURRENT_VOTER_ID);
    expect(reveal.voterVotes).toEqual([{ voterId: ANONYMOUS_CURRENT_VOTER_ID, vote: "pass" }]);
  });

  it("marks the first vote as a vote event", () => {
    expect(buildVoteReveal(buildStatement({}), "agree", "me").voteEvent).toEqual({
      type: "first_vote",
      headline: "First vote!",
    });
  });

  it("marks a swung vote as a vote event", () => {
    expect(buildVoteReveal(buildStatement({ agrees: 3, disagrees: 3 }), "agree", "me").voteEvent).toEqual({
      type: "swung_vote",
      headline: "You swung the vote!",
    });
  });

  it("has no vote event for an ordinary vote or a pass", () => {
    const statement = buildStatement({ agrees: 10, disagrees: 2 });

    expect(buildVoteReveal(statement, "agree", "me").voteEvent).toBeNull();
    expect(buildVoteReveal(statement, "pass", "me").voteEvent).toBeNull();
  });
});

describe("countVoterVotes", () => {
  it("counts each side", () => {
    const voterVotes = [...buildVoterVotes("agree", 3), ...buildVoterVotes("pass", 1)];

    expect(countVoterVotes(voterVotes)).toEqual({ disagree: 0, pass: 1, agree: 3 });
  });
});

describe("sampleVotesForCrowd", () => {
  it("keeps everyone when the crowd fits", () => {
    const voterVotes = buildVoterVotes("agree", 5);

    expect(sampleVotesForCrowd(voterVotes, 20, "agree-0")).toBe(voterVotes);
  });

  it("samples each side in proportion and always keeps the current voter", () => {
    const voterVotes = [
      ...buildVoterVotes("agree", 60),
      ...buildVoterVotes("disagree", 30),
      ...buildVoterVotes("pass", 10),
      { voterId: "me", vote: "disagree" as const },
    ];

    const sample = sampleVotesForCrowd(voterVotes, 11, "me");

    expect(sample).toHaveLength(11);
    expect(sample.at(-1)).toEqual({ voterId: "me", vote: "disagree" });
    expect(countVoterVotes(sample.slice(0, -1))).toEqual({ disagree: 3, pass: 1, agree: 6 });
  });
});
