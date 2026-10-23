import type { ApiCallRecord } from "../shared/heard-api-client.ts";
import {
  countFailures,
  isFailedCall,
  percentile,
  type StateChangeSummary,
  summarizeApiCalls,
  type VoteCountMismatch,
} from "./simulation-measurements.ts";

export const PROGRESS_WINDOW_MS = 10_000;

export interface ProgressSnapshot {
  elapsedMs: number;
  joinedCount: number;
  attendeeCount: number;
  peopleHere: number | null;
  recentRecords: ApiCallRecord[];
}

export interface SimulationResults {
  attendeeCount: number;
  joinFailureCount: number;
  records: ApiCallRecord[];
  stateChanges: StateChangeSummary[];
  totalVotesSent: number;
  undercountedVotes: VoteCountMismatch[];
  voteCheckError: string | null;
}

const formatSeconds = (seconds: number) => `${seconds.toFixed(1)}s`;

function formatElapsed(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

export function formatProgressLine(snapshot: ProgressSnapshot): string {
  const durations = snapshot.recentRecords.map((record) => record.durationMs);
  const requestsPerSecond = snapshot.recentRecords.length / (PROGRESS_WINDOW_MS / 1000);
  return [
    formatElapsed(snapshot.elapsedMs),
    `joined ${snapshot.joinedCount}/${snapshot.attendeeCount}`,
    `here ${snapshot.peopleHere ?? "-"}`,
    `${requestsPerSecond.toFixed(1)} req/s`,
    `p95 ${Math.round(percentile(durations, 0.95))}ms`,
    `errors ${snapshot.recentRecords.filter(isFailedCall).length}`,
  ].join("  |  ");
}

export function formatSimulationReport(results: SimulationResults): string {
  return [
    ...formatRouteSection(results.records),
    "",
    ...formatFailureSection(results.records, results.joinFailureCount, results.attendeeCount),
    "",
    ...formatStateChangeSection(results.stateChanges),
    "",
    ...formatVoteCheckSection(results),
  ].join("\n");
}

function formatRouteSection(records: ApiCallRecord[]): string[] {
  return [
    "REQUESTS BY ROUTE (median / p95 / slowest)",
    ...summarizeApiCalls(records).map((summary) =>
      `  ${summary.routeName.padEnd(28)} ${String(summary.callCount).padStart(6)} calls  ${summary.medianMs}ms / ${summary.ninetyFifthPercentileMs}ms / ${summary.slowestMs}ms  failed ${summary.failedCount}`
    ),
  ];
}

function formatFailureSection(records: ApiCallRecord[], joinFailureCount: number, attendeeCount: number): string[] {
  const failures = countFailures(records);
  return [
    "ERRORS",
    `  ${joinFailureCount} of ${attendeeCount} simulated phones never managed to join.`,
    ...(failures.length === 0
      ? ["  No failed requests."]
      : failures.map((failure) => `  ${failure.routeName.padEnd(28)} ${failure.statusLabel.padEnd(12)} x${failure.count}`)),
  ];
}

function formatStateChangeSection(stateChanges: StateChangeSummary[]): string[] {
  return [
    "TIME FOR PHONES TO SEE EACH MODERATOR ACTION (median / p95 / slowest, from the server's timestamp)",
    ...stateChanges.map((change) =>
      `  ${change.label.padEnd(18)} ${String(change.phonesThatSawIt).padStart(4)} phones  ${
        formatSeconds(change.medianSecondsToSee)
      } / ${formatSeconds(change.ninetyFifthPercentileSecondsToSee)} / ${formatSeconds(change.slowestSecondsToSee)}`
    ),
  ];
}

function formatVoteCheckSection(results: SimulationResults): string[] {
  const heading = "VOTE CHECK (server counts vs. votes the simulated phones had accepted)";
  if (results.voteCheckError) return [heading, `  Couldn't check: ${results.voteCheckError}`];
  if (results.undercountedVotes.length === 0) {
    return [heading, `  All ${results.totalVotesSent} accepted votes are counted on the server.`];
  }
  const missingVoteCount = results.undercountedVotes.reduce(
    (total, mismatch) => total + mismatch.votesSent - mismatch.votesCounted,
    0,
  );
  return [
    heading,
    `  ${missingVoteCount} of ${results.totalVotesSent} accepted votes are missing from the server's counts:`,
    ...results.undercountedVotes.map((mismatch) =>
      `  ${mismatch.vote.padEnd(8)} sent ${mismatch.votesSent}, counted ${mismatch.votesCounted}  "${mismatch.statementText}"`
    ),
  ];
}
