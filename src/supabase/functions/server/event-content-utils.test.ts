import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  isEventStatement,
  isEventVote,
  setVotersToViewerEventVotes,
  moveVotesToMergeTargets,
  trimVotersToViewer,
  updateVoteCounts,
} from "./event-content-utils.ts";
import type {
  EventVote,
  Statement,
  StatementMerge,
} from "./types.tsx";

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

const merge = (
  sourceStatementId: string,
  targetStatementId: string,
): StatementMerge => ({
  id: `${sourceStatementId}-into-${targetStatementId}`,
  roomId: "room",
  sourceStatementId,
  targetStatementId,
  creatorId: "moderator",
  createdAt: "2026-11-10",
});

const eventVote = (
  statementId: string,
  userId: string,
  voteType: EventVote["voteType"],
): EventVote => ({
  id: `${statementId}-${userId}`,
  statementId,
  userId,
  voteType,
  source: "event",
  timestamp: 0,
  roomId: "room",
});

Deno.test(
  "moveVotesToMergeTargets - moves votes to the target",
  () => {
    const votes = [
      eventVote("source", "source-voter", "pass"),
      eventVote("other", "other-voter", "agree"),
    ];

    assertEquals(
      moveVotesToMergeTargets(votes, [merge("source", "target")]),
      [
        eventVote("other", "other-voter", "agree"),
        {
          ...eventVote("source", "source-voter", "pass"),
          statementId: "target",
        },
      ],
    );
  },
);

Deno.test(
  "moveVotesToMergeTargets - the target's own vote wins",
  () => {
    const votes = [
      eventVote("source", "voter", "disagree"),
      eventVote("target", "voter", "agree"),
    ];

    assertEquals(
      moveVotesToMergeTargets(votes, [merge("source", "target")]),
      [eventVote("target", "voter", "agree")],
    );
  },
);

Deno.test(
  "moveVotesToMergeTargets - one vote per voter per target",
  () => {
    const votes = [
      eventVote("first", "voter", "agree"),
      eventVote("second", "voter", "agree"),
    ];
    const merges = [
      merge("first", "target"),
      merge("second", "target"),
    ];

    assertEquals(moveVotesToMergeTargets(votes, merges), [
      {
        ...eventVote("first", "voter", "agree"),
        statementId: "target",
      },
    ]);
  },
);

Deno.test(
  "trimVotersToViewer - keeps only the viewer's own vote on each statement",
  () => {
    const statements = [
      { ...STATEMENT, id: "voted", voters: { viewer: "agree", other: "pass" } },
      { ...STATEMENT, id: "not-voted", voters: { other: "disagree" } },
      { ...STATEMENT, id: "no-voters", voters: {} },
    ] satisfies Statement[];
    const trimmed = trimVotersToViewer(statements, "viewer");
    assertEquals(
      trimmed.map(({ id, voters }) => ({ id, voters })),
      [
        { id: "voted", voters: { viewer: "agree" } },
        { id: "not-voted", voters: {} },
        { id: "no-voters", voters: {} },
      ],
    );
    assertEquals(trimmed[0].agrees, STATEMENT.agrees);
  },
);

Deno.test("trimVotersToViewer - no voters without a viewer", () => {
  const trimmed = trimVotersToViewer(
    [{ ...STATEMENT, voters: { someone: "agree" } }],
    undefined,
  );
  assertEquals(trimmed[0].voters, {});
});

Deno.test(
  "setVotersToViewerEventVotes - keeps only the viewer's own event votes",
  () => {
    const statements = [
      { ...STATEMENT, id: "voted", voters: { other: "agree" } },
      { ...STATEMENT, id: "voted-in-feed", voters: {} },
      { ...STATEMENT, id: "not-voted", voters: { other: "pass" } },
    ] satisfies Statement[];
    const marked = setVotersToViewerEventVotes(
      statements,
      [
        { statementId: "voted", voteType: "disagree", source: "event" },
        { statementId: "voted-in-feed", voteType: "agree", source: "feed" },
      ],
      "viewer",
    );
    assertEquals(
      marked.map(({ id, voters }) => ({ id, voters })),
      [
        { id: "voted", voters: { viewer: "disagree" } },
        { id: "voted-in-feed", voters: {} },
        { id: "not-voted", voters: {} },
      ],
    );
  },
);

Deno.test("setVotersToViewerEventVotes - no voters without a viewer", () => {
  const marked = setVotersToViewerEventVotes(
    [{ ...STATEMENT, voters: { other: "agree" } }],
    [{ statementId: STATEMENT.id, voteType: "agree", source: "event" }],
    undefined,
  );
  assertEquals(marked[0].voters, {});
});

