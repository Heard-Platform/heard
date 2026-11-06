import _ from "lodash";
import moment from "moment-timezone";
import type {
  EventReportAttendeeStatementAdded,
  EventReportOpening,
  EventReportPost,
  EventReportPromptStart,
  EventReportStatement,
  EventReportTimeline,
  EventReportTimelineBin,
} from "../types";
import { ONE_MINUTE_MS, ONE_SECOND_MS } from "./time";

const SESSION_START_FORMAT = "dddd M/D · h:mm A z";
const SESSION_CLOCK_FORMAT = "h:mm";

type SessionTimes = Pick<
  EventReportOpening,
  "sessionStartedAt" | "sessionEndedAt"
>;

export function getSessionMinutes(
  sessionTimes: SessionTimes,
): number {
  const sessionLengthMs =
    sessionTimes.sessionEndedAt - sessionTimes.sessionStartedAt;
  return Math.round(sessionLengthMs / ONE_MINUTE_MS);
}

export function formatSessionStart(
  sessionStartedAt: number,
  timeZone: string = moment.tz.guess(),
): string {
  return moment
    .tz(sessionStartedAt, timeZone)
    .format(SESSION_START_FORMAT);
}

export function formatCount(count: number): string {
  return count.toLocaleString("en-US");
}

export function findLongestPost(
  posts: EventReportPost[],
): EventReportPost | undefined {
  return _.maxBy(posts, "secondsOnPost");
}

export function findPostTopic(
  posts: EventReportPost[],
  postNumber: number,
): string {
  const post = posts.find(
    (eventPost) => eventPost.postNumber === postNumber,
  );
  return post?.topic ?? "";
}

export function getAverageVoterCount(
  posts: EventReportPost[],
): number {
  if (posts.length === 0) return 0;
  return Math.round(_.meanBy(posts, "voterCount"));
}

export function getOneInHowMany(
  partCount: number,
  wholeCount: number,
): number {
  if (partCount === 0) return 0;
  return Math.round(wholeCount / partCount);
}

export function formatSessionClock(
  sessionStartedAt: number,
  secondsSinceStart: number,
  timeZone: string = moment.tz.guess(),
): string {
  const clockTime =
    sessionStartedAt + secondsSinceStart * ONE_SECOND_MS;
  return moment.tz(clockTime, timeZone).format(SESSION_CLOCK_FORMAT);
}

export interface PostStatementHighlight {
  statement: EventReportStatement;
  postNumber: number;
}

function listPostHighlights(
  posts: EventReportPost[],
  pickStatement: (
    post: EventReportPost,
  ) => EventReportStatement | null,
): PostStatementHighlight[] {
  return posts.flatMap((post) => {
    const statement = pickStatement(post);
    return statement
      ? [{ statement, postNumber: post.postNumber }]
      : [];
  });
}

export function findMostAgreedStatement(
  posts: EventReportPost[],
): PostStatementHighlight | undefined {
  const mostAgreedHighlights = listPostHighlights(
    posts,
    (post) => post.mostAgreedStatement,
  );
  return _.maxBy(
    mostAgreedHighlights,
    (highlight) => highlight.statement.agreePercent,
  );
}

export function findMostSplitStatement(
  posts: EventReportPost[],
): PostStatementHighlight | undefined {
  const mostSplitHighlights = listPostHighlights(
    posts,
    (post) => post.mostSplitStatement,
  );
  return _.minBy(mostSplitHighlights, (highlight) =>
    Math.abs(
      highlight.statement.agreePercent -
        highlight.statement.disagreePercent,
    ),
  );
}

export function findBusiestBin(
  bins: EventReportTimelineBin[],
): EventReportTimelineBin | undefined {
  return _.maxBy(bins, "activeVoterCount");
}

export interface QuietestStretch {
  secondsSinceStart: number;
  seconds: number;
  activeVoterCount: number;
}

function listRunsAtVoterCount(
  bins: EventReportTimelineBin[],
  activeVoterCount: number,
): EventReportTimelineBin[][] {
  const runs: EventReportTimelineBin[][] = [];
  let currentRun: EventReportTimelineBin[] = [];
  for (const bin of bins) {
    if (bin.activeVoterCount === activeVoterCount) {
      currentRun.push(bin);
      continue;
    }
    if (currentRun.length > 0) runs.push(currentRun);
    currentRun = [];
  }
  if (currentRun.length > 0) runs.push(currentRun);
  return runs;
}

export function findQuietestStretch(
  timeline: Pick<EventReportTimeline, "bins" | "binSeconds">,
): QuietestStretch | undefined {
  const quietestBin = _.minBy(timeline.bins, "activeVoterCount");
  if (!quietestBin) return undefined;
  const fewestVoters = quietestBin.activeVoterCount;
  const quietRuns = listRunsAtVoterCount(timeline.bins, fewestVoters);
  const longestQuietRun =
    _.maxBy(quietRuns, "length") ?? [quietestBin];
  return {
    secondsSinceStart: longestQuietRun[0].secondsSinceStart,
    seconds: longestQuietRun.length * timeline.binSeconds,
    activeVoterCount: fewestVoters,
  };
}

export function findPostNumberAtSecond(
  promptStarts: EventReportPromptStart[],
  secondsSinceStart: number,
): number | undefined {
  const startsSoFar = promptStarts.filter(
    (promptStart) =>
      promptStart.secondsSinceStart <= secondsSinceStart,
  );
  return _.maxBy(startsSoFar, "secondsSinceStart")?.postNumber;
}

export function getBinIndex(
  timeline: Pick<EventReportTimeline, "binSeconds">,
  secondsSinceStart: number,
): number {
  return Math.floor(secondsSinceStart / timeline.binSeconds);
}

export interface AttendeeStatementBump {
  attendeeStatement: EventReportAttendeeStatementAdded;
  addedVoterCount: number;
}

export function findBiggestAttendeeStatementBump(
  timeline: EventReportTimeline,
): AttendeeStatementBump | undefined {
  const bumps = timeline.attendeeStatementsAdded.map(
    (attendeeStatement) => {
      const binIndex = getBinIndex(
        timeline,
        attendeeStatement.secondsSinceStart,
      );
      const votersWhenAdded =
        timeline.bins[binIndex]?.activeVoterCount ?? 0;
      const votersRightAfter =
        timeline.bins[binIndex + 1]?.activeVoterCount ?? 0;
      return {
        attendeeStatement,
        addedVoterCount: votersRightAfter - votersWhenAdded,
      };
    },
  );
  const biggestBump = _.maxBy(bumps, "addedVoterCount");
  if (!biggestBump || biggestBump.addedVoterCount <= 0)
    return undefined;
  return biggestBump;
}

export interface TimelineColumn {
  secondsSinceStart: number;
  activeVoterCount: number;
  heightPercent: number;
  postNumber: number | undefined;
  startingPostNumber: number | undefined;
  attendeeStatements: EventReportAttendeeStatementAdded[];
}

export function buildTimelineColumns(
  timeline: EventReportTimeline,
): TimelineColumn[] {
  const busiestVoterCount =
    findBusiestBin(timeline.bins)?.activeVoterCount ?? 0;
  const findStartingPostNumber = (binIndex: number) =>
    timeline.promptStarts.find(
      (promptStart) =>
        getBinIndex(timeline, promptStart.secondsSinceStart) ===
        binIndex,
    )?.postNumber;
  const listAttendeeStatementsAdded = (binIndex: number) =>
    timeline.attendeeStatementsAdded.filter(
      (attendeeStatement) =>
        getBinIndex(timeline, attendeeStatement.secondsSinceStart) ===
        binIndex,
    );
  return timeline.bins.map((bin, binIndex) => ({
    secondsSinceStart: bin.secondsSinceStart,
    activeVoterCount: bin.activeVoterCount,
    heightPercent:
      busiestVoterCount === 0
        ? 0
        : Math.round(
            (bin.activeVoterCount / busiestVoterCount) * 100,
          ),
    postNumber: findPostNumberAtSecond(
      timeline.promptStarts,
      bin.secondsSinceStart,
    ),
    startingPostNumber: findStartingPostNumber(binIndex),
    attendeeStatements: listAttendeeStatementsAdded(binIndex),
  }));
}