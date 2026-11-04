import type { Vote } from "./types.tsx";
import { getDevUsers, getStatementsForRoomIncludingHidden, getVotesForStatement } from "./kv-utils.tsx";
import { median } from "./stats-utils.ts";

export interface RoomVoteDepthBucket {
  statementsVotedOn: number;
  voterCount: number;
  reachedPercent: number;
}

export interface RoomVoteDepth {
  statementCount: number;
  voterCount: number;
  medianStatementsVotedOn: number;
  buckets: RoomVoteDepthBucket[];
}

export interface RoomActivity {
  roomId: string;
  voteDepth: RoomVoteDepth;
}

interface BuildRoomVoteDepthInput {
  statementCount: number;
  votes: Pick<Vote, "statementId" | "userId">[];
  excludedUserIds: Set<string>;
}

export function countStatementsVotedOnPerVoter(
  votes: Pick<Vote, "statementId" | "userId">[],
  excludedUserIds: Set<string>,
): number[] {
  const votedStatementIdsByUserId = new Map<string, Set<string>>();
  const includedVotes = votes.filter((vote) => !excludedUserIds.has(vote.userId));
  for (const vote of includedVotes) {
    const votedStatementIds = votedStatementIdsByUserId.get(vote.userId) ?? new Set<string>();
    votedStatementIds.add(vote.statementId);
    votedStatementIdsByUserId.set(vote.userId, votedStatementIds);
  }
  return [...votedStatementIdsByUserId.values()].map((votedStatementIds) => votedStatementIds.size);
}

function buildBuckets(statementsVotedOnPerVoter: number[], bucketCount: number): RoomVoteDepthBucket[] {
  const voterCount = statementsVotedOnPerVoter.length;
  return Array.from({ length: bucketCount }, (_, index) => {
    const statementsVotedOn = index + 1;
    const votersAtThisDepth = statementsVotedOnPerVoter.filter((count) => count === statementsVotedOn).length;
    const votersReachingThisDepth = statementsVotedOnPerVoter.filter((count) => count >= statementsVotedOn).length;
    return {
      statementsVotedOn,
      voterCount: votersAtThisDepth,
      reachedPercent: voterCount === 0 ? 0 : (votersReachingThisDepth / voterCount) * 100,
    };
  });
}

export function buildRoomVoteDepth({
  statementCount,
  votes,
  excludedUserIds,
}: BuildRoomVoteDepthInput): RoomVoteDepth {
  const statementsVotedOnPerVoter = countStatementsVotedOnPerVoter(votes, excludedUserIds);
  const deepestVoter = Math.max(0, ...statementsVotedOnPerVoter);
  const bucketCount = Math.max(statementCount, deepestVoter);
  return {
    statementCount,
    voterCount: statementsVotedOnPerVoter.length,
    medianStatementsVotedOn: statementsVotedOnPerVoter.length === 0 ? 0 : median(statementsVotedOnPerVoter),
    buckets: buildBuckets(statementsVotedOnPerVoter, bucketCount),
  };
}

async function loadRoomVoteDepth(roomId: string): Promise<RoomVoteDepth> {
  const [statements, developers] = await Promise.all([
    getStatementsForRoomIncludingHidden(roomId),
    getDevUsers(),
  ]);
  const votesPerStatement = await Promise.all(
    statements.map((statement) => getVotesForStatement(statement.id)),
  );
  return buildRoomVoteDepth({
    statementCount: statements.length,
    votes: votesPerStatement.flat(),
    excludedUserIds: new Set(developers.map((developer) => developer.id)),
  });
}

export async function loadRoomActivity(roomId: string): Promise<RoomActivity> {
  return { roomId, voteDepth: await loadRoomVoteDepth(roomId) };
}
