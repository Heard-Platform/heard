import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildEventReport,
  type EventReportInputs,
  findSessionEnd,
  isAttendeeStatement,
} from "./event-report-utils.ts";
import { EMPTY_CAMP_ANALYSIS } from "./event-report-camp-utils.ts";
import { percentOf } from "./utils.tsx";
import { RouteError } from "./route-error.ts";
import type { EventVote, Statement, VoteType } from "./types.tsx";

const STARTED_AT = 1_761_000_000_000;
const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const DAY_MS = 24 * 60 * MINUTE_MS;
const at = (minutes: number, seconds = 0) =>
  STARTED_AT + minutes * MINUTE_MS + seconds * SECOND_MS;

const MODERATOR_ID = "moderator";
const COMMUNITY_ADMIN_ID = "community-admin";
const BEFORE_SESSION = STARTED_AT - DAY_MS;

const statement = (
  id: string,
  roomId: string,
  author: string,
  timestamp: number,
): Statement => ({
  id,
  text: `Statement ${id}`,
  author,
  agrees: 0,
  disagrees: 0,
  passes: 0,
  superAgrees: 0,
  roomId,
  timestamp,
  round: 1,
  voters: {},
});

const vote = (
  statementId: string,
  roomId: string,
  userId: string,
  voteType: VoteType,
  timestamp: number,
): EventVote => ({
  id: `${statementId}-${userId}`,
  statementId,
  roomId,
  userId,
  voteType,
  timestamp,
});

const votesOn = (
  statementId: string,
  roomId: string,
  firstVoteAt: number,
  userVotes: [string, VoteType][],
): EventVote[] =>
  userVotes.map(([userId, voteType], index) =>
    vote(
      statementId,
      roomId,
      userId,
      voteType,
      firstVoteAt + index * 10 * SECOND_MS,
    )
  );

const STATEMENTS: Statement[] = [
  statement("a1", "a", MODERATOR_ID, BEFORE_SESSION),
  statement("a2", "a", MODERATOR_ID, BEFORE_SESSION),
  statement("a3", "a", "u1", at(1)),
  statement("a4", "a", MODERATOR_ID, at(2)),
  statement("b1", "b", COMMUNITY_ADMIN_ID, BEFORE_SESSION),
  statement("b2", "b", "u2", at(6)),
  statement("c1", "c", MODERATOR_ID, BEFORE_SESSION),
  statement("c2", "c", "u3", at(11)),
];

const VOTES: EventVote[] = [
  ...votesOn("a1", "a", at(0, 30), [
    ["u1", "agree"],
    ["u2", "agree"],
    ["u3", "agree"],
    ["u4", "agree"],
    ["u5", "super_agree"],
    ["u6", "agree"],
  ]),
  ...votesOn("a2", "a", at(1, 30), [
    ["u1", "agree"],
    ["u2", "agree"],
    ["u3", "agree"],
    ["u4", "disagree"],
    ["u5", "disagree"],
    ["u6", "pass"],
  ]),
  ...votesOn("a3", "a", at(2, 30), [
    ["u2", "agree"],
    ["u3", "agree"],
    ["u4", "agree"],
    ["u5", "agree"],
    ["u6", "disagree"],
  ]),
  ...votesOn("a4", "a", at(3, 30), [
    ["u1", "agree"],
    ["u2", "agree"],
    ["u3", "agree"],
    ["u4", "agree"],
    ["u5", "agree"],
  ]),
  ...votesOn("b1", "b", at(5, 30), [
    ["u1", "agree"],
    ["u2", "agree"],
    ["u3", "agree"],
    ["u4", "disagree"],
    ["u5", "disagree"],
  ]),
  ...votesOn("b2", "b", at(6, 30), [
    ["u1", "agree"],
    ["u3", "agree"],
  ]),
  ...votesOn("c1", "c", at(10, 30), [
    ["u1", "agree"],
    ["u2", "agree"],
    ["u3", "disagree"],
    ["u4", "disagree"],
  ]),
  ...votesOn("c2", "c", at(11, 30), [
    ["u1", "agree"],
    ["u2", "agree"],
  ]),
  vote("c1", "c", "u5", "pass", at(16)),
  vote("a3", "a", "u7", "agree", at(60)),
];

const inputs = (
  overrides: Partial<EventReportInputs> = {},
): EventReportInputs => ({
  event: {
    name: "How has AI changed your pricing?",
    subtitle: "",
    creatorId: MODERATOR_ID,
  },
  community: { adminId: COMMUNITY_ADMIN_ID, modIds: [] },
  state: {
    roomOrder: ["a", "b", "c"],
    postChanges: [
      { roomId: "a", changedAt: at(0) },
      { roomId: "b", changedAt: at(5) },
      { roomId: "c", changedAt: at(10) },
    ],
    startedAt: STARTED_AT,
    endedAt: at(15),
  },
  rooms: [
    { id: "a", topic: "Post A" },
    { id: "b", topic: "Post B" },
    { id: "c", topic: "Post C" },
  ],
  statements: STATEMENTS,
  votes: VOTES,
  now: at(90),
  ...overrides,
});

const buildReport = (reportInputs: EventReportInputs) =>
  buildEventReport(reportInputs).report;

const NEVER_ENDED_STATE = { ...inputs().state, endedAt: null };

Deno.test("percentOf rounds and treats no votes as zero", () => {
  assertEquals(percentOf(5, 6), 83);
  assertEquals(percentOf(3, 0), 0);
});

Deno.test(
  "isAttendeeStatement counts only non-moderators during the session",
  () => {
    const reportInputs = inputs();
    const isFromTheFloor = (author: string, timestamp: number) =>
      isAttendeeStatement({ author, timestamp }, reportInputs);

    assertEquals(isFromTheFloor("u1", at(1)), true);
    assertEquals(isFromTheFloor("u1", BEFORE_SESSION), false);
    assertEquals(isFromTheFloor(MODERATOR_ID, at(2)), false);
    assertEquals(isFromTheFloor(COMMUNITY_ADMIN_ID, at(2)), false);
  },
);

Deno.test("findSessionEnd uses endedAt when End was pressed", () => {
  assertEquals(
    findSessionEnd(inputs().state, VOTES, at(90)),
    at(15),
  );
});

Deno.test(
  "findSessionEnd stops at the final post's first quiet gap",
  () => {
    assertEquals(
      findSessionEnd(NEVER_ENDED_STATE, VOTES, at(90)),
      at(11, 40),
    );
  },
);

Deno.test(
  "findSessionEnd gives an unvoted final post five minutes",
  () => {
    const votesBeforeFinalPost = VOTES.filter(
      (sessionVote) => sessionVote.roomId !== "c",
    );
    assertEquals(
      findSessionEnd(NEVER_ENDED_STATE, votesBeforeFinalPost, at(90)),
      at(15),
    );
  },
);

Deno.test(
  "findSessionEnd treats a first vote after a quiet gap as no votes",
  () => {
    const lateFinalPostVotes = [
      vote("c1", "c", "u1", "agree", at(14)),
    ];
    assertEquals(
      findSessionEnd(NEVER_ENDED_STATE, lateFinalPostVotes, at(90)),
      at(15),
    );
  },
);

Deno.test("findSessionEnd never ends a session in the future", () => {
  assertEquals(
    findSessionEnd(NEVER_ENDED_STATE, [], at(12)),
    at(12),
  );
});

Deno.test("buildEventReport rejects an event not yet started", () => {
  const notStarted = inputs({
    state: { ...NEVER_ENDED_STATE, startedAt: null, postChanges: [] },
  });
  assertThrows(() => buildReport(notStarted), RouteError);
});

Deno.test("buildEventReport counts every vote in the opening", () => {
  assertEquals(buildReport(inputs()).opening, {
    eventName: "How has AI changed your pricing?",
    eventSubtitle: null,
    peopleCount: 7,
    voteCount: 37,
    postCount: 3,
    attendeeStatementCount: 3,
    averagePostParticipationPercent: 81,
    sessionStartedAt: STARTED_AT,
    sessionEndedAt: at(15),
  });
});

Deno.test(
  "buildEventReport measures participation against the busiest post",
  () => {
    const voterOnlyOnPostB = vote("b1", "b", "u8", "agree", at(7));
    const report = buildReport(
      inputs({ votes: [...VOTES, voterOnlyOnPostB] }),
    );

    assertEquals(report.opening.peopleCount, 8);
    assertEquals(report.opening.averagePostParticipationPercent, 86);
  },
);

Deno.test("buildEventReport picks each post's statements", () => {
  const [postA, postB, postC] = buildReport(inputs()).posts;

  assertEquals(postA, {
    roomId: "a",
    postNumber: 1,
    topic: "Post A",
    voterCount: 7,
    secondsOnPost: 300,
    mostAgreedStatement: {
      statementId: "a1",
      text: "Statement a1",
      agreePercent: 100,
      disagreePercent: 0,
    },
    mostSplitStatement: {
      statementId: "a2",
      text: "Statement a2",
      agreePercent: 50,
      disagreePercent: 33,
    },
    topAttendeeStatement: {
      statementId: "a3",
      text: "Statement a3",
      agreePercent: 83,
      disagreePercent: 17,
    },
  });
  assertEquals(postB.mostAgreedStatement?.statementId, "b1");
  assertEquals(postB.mostSplitStatement?.statementId, "b1");
  assertEquals(postB.topAttendeeStatement?.statementId, "b2");
  assertEquals(postC.voterCount, 5);
  assertEquals(postC.mostAgreedStatement?.statementId, "c1");
  assertEquals(postC.topAttendeeStatement?.statementId, "c2");
});

Deno.test(
  "buildEventReport leaves a post with no floor ideas empty",
  () => {
    const withoutFloorIdeaOnB = inputs({
      statements: STATEMENTS.filter(({ id }) => id !== "b2"),
    });
    const postB = buildReport(withoutFloorIdeaOnB).posts[1];
    assertEquals(postB.topAttendeeStatement, null);
  },
);

Deno.test("buildEventReport ranks the floor", () => {
  assertEquals(buildReport(inputs()).floor, {
    attendeeCount: 3,
    attendeeStatementVoteCount: 10,
    attendeeStatementsInTopTenCount: 1,
    averageAttendeeAgreePercent: 83,
    averagePreparedAgreePercent: 70,
    topAttendeeStatements: [
      {
        statementId: "a3",
        text: "Statement a3",
        agreePercent: 83,
        disagreePercent: 17,
        postNumber: 1,
        voteCount: 6,
      },
    ],
    lowVoteAttendeeStatements: [
      {
        statementId: "b2",
        text: "Statement b2",
        agreePercent: 100,
        disagreePercent: 0,
        postNumber: 2,
        voteCount: 2,
      },
      {
        statementId: "c2",
        text: "Statement c2",
        agreePercent: 100,
        disagreePercent: 0,
        postNumber: 3,
        voteCount: 2,
      },
    ],
  });
});

Deno.test(
  "buildEventReport shows the three most voted low vote ideas",
  () => {
    const extraFloorIdeas = [
      statement("c3", "c", "u4", at(12)),
      statement("c4", "c", "u5", at(12, 10)),
    ];
    const extraVotes = [
      ...votesOn("c3", "c", at(12, 20), [
        ["u1", "agree"],
        ["u2", "agree"],
        ["u3", "agree"],
      ]),
      vote("c4", "c", "u1", "agree", at(13)),
    ];
    const report = buildReport(
      inputs({
        statements: [...STATEMENTS, ...extraFloorIdeas],
        votes: [...VOTES, ...extraVotes],
      }),
    );
    const lowVoteStatementIds =
      report.floor.lowVoteAttendeeStatements.map(
        (lowVoteStatement) => lowVoteStatement.statementId,
      );
    assertEquals(lowVoteStatementIds, ["c3", "b2", "c2"]);
  },
);

Deno.test("buildEventReport finds no camps with five people", () => {
  assertEquals(
    buildReport(inputs()).campAnalysis,
    EMPTY_CAMP_ANALYSIS,
  );
});

Deno.test("buildEventReport bins the timeline by 20 seconds", () => {
  const { timeline } = buildReport(inputs());

  assertEquals(timeline.binSeconds, 20);
  assertEquals(timeline.bins.length, 45);
  assertEquals(timeline.bins[0], {
    secondsSinceStart: 0,
    activeVoterCount: 0,
  });
  assertEquals(timeline.bins[7], {
    secondsSinceStart: 140,
    activeVoterCount: 2,
  });
  assertEquals(timeline.promptStarts, [
    { postNumber: 1, secondsSinceStart: 0 },
    { postNumber: 2, secondsSinceStart: 300 },
    { postNumber: 3, secondsSinceStart: 600 },
  ]);
  const addedAtSeconds = timeline.attendeeStatementsAdded.map(
    ({ statementId, secondsSinceStart }) => [
      statementId,
      secondsSinceStart,
    ],
  );
  assertEquals(addedAtSeconds, [
    ["a3", 60],
    ["b2", 360],
    ["c2", 660],
  ]);
  assertEquals(
    timeline.attendeeStatementsAdded[0].text,
    "Statement a3",
  );
});

Deno.test(
  "buildEventReport ends a session with no End at the quiet gap",
  () => {
    const report = buildReport(
      inputs({ state: NEVER_ENDED_STATE }),
    );

    assertEquals(report.opening.sessionEndedAt, at(11, 40));
    assertEquals(report.opening.voteCount, 37);
    assertEquals(report.posts[2].secondsOnPost, 100);
    assertEquals(report.timeline.bins.length, 35);
  },
);
