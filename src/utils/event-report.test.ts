import { describe, expect, it } from "vitest";
import type {
  EventReportPost,
  EventReportStatement,
  EventReportTimeline,
} from "../types";
import {
  buildTimelineColumns,
  findBiggestAttendeeStatementBump,
  findBusiestBin,
  findLongestPost,
  findMostAgreedStatement,
  findMostSplitStatement,
  findPostNumberAtSecond,
  findQuietestBin,
  formatCount,
  formatSessionClock,
  formatSessionStart,
  getAverageVoterCount,
  getOneInHowMany,
  getSessionMinutes,
} from "./event-report";
import { ONE_MINUTE_MS } from "./time";

const FRIDAY_9_10_AM_EASTERN = Date.UTC(2026, 9, 23, 13, 10);

describe("getSessionMinutes", () => {
  it("counts whole minutes from start to end", () => {
    const sessionMinutes = getSessionMinutes({
      sessionStartedAt: FRIDAY_9_10_AM_EASTERN,
      sessionEndedAt: FRIDAY_9_10_AM_EASTERN + 34 * ONE_MINUTE_MS,
    });
    expect(sessionMinutes).toBe(34);
  });

  it("rounds to the nearest minute", () => {
    const sessionMinutes = getSessionMinutes({
      sessionStartedAt: FRIDAY_9_10_AM_EASTERN,
      sessionEndedAt: FRIDAY_9_10_AM_EASTERN + 33.6 * ONE_MINUTE_MS,
    });
    expect(sessionMinutes).toBe(34);
  });
});

describe("formatSessionStart", () => {
  it("shows the weekday, date, time and time zone", () => {
    const sessionStart = formatSessionStart(
      FRIDAY_9_10_AM_EASTERN,
      "America/New_York",
    );
    expect(sessionStart).toBe("Friday 10/23 · 9:10 AM EDT");
  });

  it("shows the start in the given time zone", () => {
    const sessionStart = formatSessionStart(
      FRIDAY_9_10_AM_EASTERN,
      "America/Los_Angeles",
    );
    expect(sessionStart).toBe("Friday 10/23 · 6:10 AM PDT");
  });
});

describe("formatCount", () => {
  it("adds thousands separators", () => {
    expect(formatCount(1540)).toBe("1,540");
  });

  it("leaves small numbers as they are", () => {
    expect(formatCount(64)).toBe("64");
  });
});

const reportPost = (
  postNumber: number,
  secondsOnPost: number,
  voterCount: number = 50,
): EventReportPost => ({
  roomId: `post-${postNumber}`,
  postNumber,
  topic: `Prompt ${postNumber}`,
  voterCount,
  secondsOnPost,
  mostAgreedStatement: null,
  mostSplitStatement: null,
  topAttendeeStatement: null,
});

describe("findLongestPost", () => {
  it("finds the post that was on screen longest", () => {
    const posts = [
      reportPost(1, 130),
      reportPost(2, 320),
      reportPost(3, 110),
    ];
    expect(findLongestPost(posts)?.postNumber).toBe(2);
  });

  it("finds nothing when there are no posts", () => {
    expect(findLongestPost([])).toBeUndefined();
  });
});

describe("getAverageVoterCount", () => {
  it("averages the people who voted on each post", () => {
    const posts = [
      reportPost(1, 130, 61),
      reportPost(2, 320, 50),
      reportPost(3, 110, 52),
    ];
    expect(getAverageVoterCount(posts)).toBe(54);
  });

  it("is zero when there are no posts", () => {
    expect(getAverageVoterCount([])).toBe(0);
  });
});

describe("getOneInHowMany", () => {
  it("rounds to the nearest whole ratio", () => {
    expect(getOneInHowMany(14, 64)).toBe(5);
  });

  it("is one when everyone is in the part", () => {
    expect(getOneInHowMany(64, 64)).toBe(1);
  });

  it("is zero when nobody is in the part", () => {
    expect(getOneInHowMany(0, 64)).toBe(0);
  });
});

const statementWithVotes = (
  statementId: string,
  agreePercent: number,
  disagreePercent: number,
): EventReportStatement => ({
  statementId,
  text: `Statement ${statementId}`,
  agreePercent,
  disagreePercent,
});

const postWithHighlights = (
  postNumber: number,
  mostAgreedStatement: EventReportStatement | null,
  mostSplitStatement: EventReportStatement | null,
): EventReportPost => ({
  ...reportPost(postNumber, 100),
  mostAgreedStatement,
  mostSplitStatement,
});

describe("findMostAgreedStatement", () => {
  it("finds the most agreed statement across every post", () => {
    const posts = [
      postWithHighlights(1, statementWithVotes("a", 71, 22), null),
      postWithHighlights(2, statementWithVotes("b", 88, 8), null),
      postWithHighlights(3, null, null),
    ];
    const mostAgreed = findMostAgreedStatement(posts);
    expect(mostAgreed?.statement.statementId).toBe("b");
    expect(mostAgreed?.postNumber).toBe(2);
  });
});

describe("findMostSplitStatement", () => {
  it("finds the statement closest to an even split", () => {
    const posts = [
      postWithHighlights(1, null, statementWithVotes("a", 52, 44)),
      postWithHighlights(2, null, statementWithVotes("b", 50, 50)),
    ];
    expect(findMostSplitStatement(posts)?.statement.statementId).toBe(
      "b",
    );
  });

  it("finds nothing when no post has a split statement", () => {
    const posts = [postWithHighlights(1, null, null)];
    expect(findMostSplitStatement(posts)).toBeUndefined();
  });
});

const TIMELINE: EventReportTimeline = {
  binSeconds: 20,
  bins: [
    { secondsSinceStart: 0, activeVoterCount: 40 },
    { secondsSinceStart: 20, activeVoterCount: 22 },
    { secondsSinceStart: 40, activeVoterCount: 35 },
    { secondsSinceStart: 60, activeVoterCount: 12 },
  ],
  promptStarts: [
    { postNumber: 1, secondsSinceStart: 0 },
    { postNumber: 2, secondsSinceStart: 50 },
  ],
  attendeeStatementsAdded: [
    { statementId: "a", text: "First idea", secondsSinceStart: 25 },
    { statementId: "b", text: "Second idea", secondsSinceStart: 45 },
  ],
};

describe("findBusiestBin and findQuietestBin", () => {
  it("finds the most and least active stretches", () => {
    expect(findBusiestBin(TIMELINE.bins)?.secondsSinceStart).toBe(0);
    expect(findQuietestBin(TIMELINE.bins)?.secondsSinceStart).toBe(
      60,
    );
  });
});

describe("findPostNumberAtSecond", () => {
  it("finds the prompt on screen at a moment", () => {
    expect(findPostNumberAtSecond(TIMELINE.promptStarts, 30)).toBe(1);
    expect(findPostNumberAtSecond(TIMELINE.promptStarts, 55)).toBe(2);
  });
});

describe("findBiggestAttendeeStatementBump", () => {
  it("finds the idea followed by the biggest jump in voters", () => {
    const bump = findBiggestAttendeeStatementBump(TIMELINE);
    expect(bump?.attendeeStatement.statementId).toBe("a");
    expect(bump?.addedVoterCount).toBe(13);
  });

  it("finds nothing when no idea brought more voters", () => {
    const flatTimeline: EventReportTimeline = {
      ...TIMELINE,
      attendeeStatementsAdded: [
        {
          statementId: "b",
          text: "Second idea",
          secondsSinceStart: 45,
        },
      ],
    };
    expect(
      findBiggestAttendeeStatementBump(flatTimeline),
    ).toBeUndefined();
  });
});

describe("formatSessionClock", () => {
  it("shows the clock time a moment in the session happened", () => {
    const clockTime = formatSessionClock(
      FRIDAY_9_10_AM_EASTERN,
      20 * 60,
      "America/New_York",
    );
    expect(clockTime).toBe("9:30");
  });
});

describe("buildTimelineColumns", () => {
  it("sizes columns against the busiest moment and marks landmarks", () => {
    const columns = buildTimelineColumns(TIMELINE);
    expect(columns.map((column) => column.heightPercent)).toEqual([
      100, 55, 88, 30,
    ]);
    expect(
      columns.map((column) => column.startingPostNumber),
    ).toEqual([1, undefined, 2, undefined]);
    expect(
      columns.map((column) =>
        column.attendeeStatements.map(
          (attendeeStatement) => attendeeStatement.statementId,
        ),
      ),
    ).toEqual([[], ["a"], ["b"], []]);
    expect(columns.map((column) => column.postNumber)).toEqual([
      1, 1, 1, 2,
    ]);
  });
});