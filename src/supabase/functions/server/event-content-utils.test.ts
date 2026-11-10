import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  isEventStatement,
  isEventVote,
  updateVoteCounts,
} from "./event-content-utils.ts";
import type { Statement } from "./types.tsx";

const STATEMENT: Statement = {
  id: "statement",
  text: "",
  author: "author",
  agrees: 9,
  disagrees: 9,
  passes: 9,
  superAgrees: 9,
  roomId: "room",
  timestamp: 0,
  round: 1,
  voters: { "feed-voter": "agree" },
};

Deno.test("isEventVote - only event votes count", () => {
  assertEquals(isEventVote({ source: "event" }), true);
  assertEquals(isEventVote({ source: "feed" }), false);
  assertEquals(isEventVote({ source: undefined }), false);
});

Deno.test(
  "isEventStatement - everything but feed statements counts",
  () => {
    assertEquals(isEventStatement({ source: "event" }), true);
    assertEquals(isEventStatement({ source: undefined }), true);
    assertEquals(isEventStatement({ source: "feed" }), false);
  },
);

Deno.test(
  "updateVoteCounts - recounts from the given votes only",
  () => {
    const otherStatement = { ...STATEMENT, id: "other" };
    const eventVotes = [
      {
        statementId: "statement",
        userId: "attendee-1",
        voteType: "agree" as const,
      },
      {
        statementId: "statement",
        userId: "attendee-2",
        voteType: "disagree" as const,
      },
    ];

    assertEquals(
      updateVoteCounts([STATEMENT, otherStatement], eventVotes),
      [
        {
          ...STATEMENT,
          agrees: 1,
          disagrees: 1,
          passes: 0,
          superAgrees: 0,
          voters: { "attendee-1": "agree", "attendee-2": "disagree" },
        },
        {
          ...otherStatement,
          agrees: 0,
          disagrees: 0,
          passes: 0,
          superAgrees: 0,
          voters: {},
        },
      ],
    );
  },
);
