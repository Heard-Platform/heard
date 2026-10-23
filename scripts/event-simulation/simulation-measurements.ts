import _ from "lodash";
import type { LiveEventView, Statement } from "../../src/types/index.ts";
import type { ApiCallRecord } from "../shared/heard-api-client.ts";
import type { SimulatedVote } from "./attendee-behavior.ts";

export interface RouteSummary {
  routeName: string;
  callCount: number;
  failedCount: number;
  medianMs: number;
  ninetyFifthPercentileMs: number;
  slowestMs: number;
}

export interface FailureCount {
  routeName: string;
  statusLabel: string;
  count: number;
}

export type ObservedEventState = Pick<
  LiveEventView,
  "status" | "currentIndex" | "votingPaused" | "reloadNonce" | "updatedAt"
>;

export interface StateChangeSummary {
  label: string;
  changedAt: number;
  phonesThatSawIt: number;
  medianSecondsToSee: number;
  ninetyFifthPercentileSecondsToSee: number;
  slowestSecondsToSee: number;
}

export interface VoteCountMismatch {
  statementText: string;
  vote: SimulatedVote;
  votesSent: number;
  votesCounted: number;
}

const NO_RESPONSE_LABEL = "no response";

export function percentile(values: number[], fraction: number): number {
  if (values.length === 0) return 0;
  const sortedValues = [...values].sort((first, second) => first - second);
  const rank = Math.ceil(fraction * sortedValues.length) - 1;
  return sortedValues[Math.min(Math.max(rank, 0), sortedValues.length - 1)];
}

export function isFailedCall(record: ApiCallRecord): boolean {
  return record.status === null || record.status >= 400;
}

export function summarizeApiCalls(records: ApiCallRecord[]): RouteSummary[] {
  return _.sortBy(
    Object.entries(_.groupBy(records, "routeName")).map(([routeName, routeRecords]) => {
      const durations = routeRecords.map((record) => record.durationMs);
      return {
        routeName,
        callCount: routeRecords.length,
        failedCount: routeRecords.filter(isFailedCall).length,
        medianMs: Math.round(percentile(durations, 0.5)),
        ninetyFifthPercentileMs: Math.round(percentile(durations, 0.95)),
        slowestMs: Math.round(Math.max(...durations)),
      };
    }),
    (summary) => -summary.callCount,
  );
}

export function countFailures(records: ApiCallRecord[]): FailureCount[] {
  const failedRecords = records.filter(isFailedCall);
  const groups = _.groupBy(failedRecords, (record) => `${record.routeName}|${record.status ?? NO_RESPONSE_LABEL}`);
  return _.sortBy(
    Object.values(groups).map((group) => ({
      routeName: group[0].routeName,
      statusLabel: String(group[0].status ?? NO_RESPONSE_LABEL),
      count: group.length,
    })),
    (failure) => -failure.count,
  );
}

export function labelStateChange(previous: ObservedEventState | null, current: ObservedEventState): string {
  if (current.status === "ended") return "End";
  if (current.status === "setup") return "Waiting to start";
  if (!previous || previous.status === "setup") return "Start";
  if (current.reloadNonce !== previous.reloadNonce) return "Reload all phones";
  if (current.currentIndex !== previous.currentIndex) return `Post ${(current.currentIndex ?? 0) + 1}`;
  if (current.votingPaused !== previous.votingPaused) return current.votingPaused ? "Pause" : "Resume";
  return "Other change";
}

export class StateChangeTracker {
  private readonly statesByUpdatedAt = new Map<number, ObservedEventState>();
  private readonly secondsToSeeByUpdatedAt = new Map<number, number[]>();

  recordObservation(state: ObservedEventState, seenAt: number, isAttendeesFirstObservation: boolean) {
    const isNewState = !this.statesByUpdatedAt.has(state.updatedAt);
    if (isNewState) {
      this.statesByUpdatedAt.set(state.updatedAt, state);
      this.secondsToSeeByUpdatedAt.set(state.updatedAt, []);
    }
    if (!isAttendeesFirstObservation) {
      this.secondsToSeeByUpdatedAt.get(state.updatedAt)!.push((seenAt - state.updatedAt) / 1000);
    }
  }

  summarize(): StateChangeSummary[] {
    const states = _.sortBy([...this.statesByUpdatedAt.values()], "updatedAt");
    return states.map((state, index) => {
      const secondsToSee = this.secondsToSeeByUpdatedAt.get(state.updatedAt) ?? [];
      return {
        label: labelStateChange(index > 0 ? states[index - 1] : null, state),
        changedAt: state.updatedAt,
        phonesThatSawIt: secondsToSee.length,
        medianSecondsToSee: percentile(secondsToSee, 0.5),
        ninetyFifthPercentileSecondsToSee: percentile(secondsToSee, 0.95),
        slowestSecondsToSee: secondsToSee.length > 0 ? Math.max(...secondsToSee) : 0,
      };
    });
  }
}

const SERVER_COUNT_FIELDS: Record<SimulatedVote, "agrees" | "disagrees" | "passes"> = {
  agree: "agrees",
  disagree: "disagrees",
  pass: "passes",
};

export class VoteLedger {
  private readonly votesSentByStatementId = new Map<string, Record<SimulatedVote, number>>();

  recordVoteCounted(statementId: string, vote: SimulatedVote) {
    const votesSent = this.votesSentByStatementId.get(statementId) ?? { agree: 0, disagree: 0, pass: 0 };
    votesSent[vote] += 1;
    this.votesSentByStatementId.set(statementId, votesSent);
  }

  get totalVotesSent(): number {
    return _.sumBy([...this.votesSentByStatementId.values()], (votes) => votes.agree + votes.disagree + votes.pass);
  }

  findUndercountedVotes(serverStatements: Statement[]): VoteCountMismatch[] {
    return serverStatements.flatMap((statement) => {
      const votesSent = this.votesSentByStatementId.get(statement.id);
      if (!votesSent) return [];
      return (Object.keys(SERVER_COUNT_FIELDS) as SimulatedVote[])
        .map((vote) => ({
          statementText: statement.text,
          vote,
          votesSent: votesSent[vote],
          votesCounted: statement[SERVER_COUNT_FIELDS[vote]] ?? 0,
        }))
        .filter((mismatch) => mismatch.votesCounted < mismatch.votesSent);
    });
  }
}
