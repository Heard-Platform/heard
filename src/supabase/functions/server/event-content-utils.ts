import _ from "lodash";
import {
  getStatementsForRoom,
  getStatementsForRoomIncludingHidden,
  getVotesForStatement,
} from "./kv-utils.tsx";
import { getMergesForRoom } from "./model-utils.ts";
import { applyStatementMerges } from "./room-utils.ts";
import { calculateVoteStats } from "./vote-stats-utils.ts";
import type {
  EventVote,
  Statement,
  StatementMerge,
  Vote,
} from "./types.tsx";

export const isEventVote = (vote: Pick<Vote, "source">): boolean =>
  vote.source === "event";

export const isEventStatement = (
  statement: Pick<Statement, "source">,
): boolean => statement.source !== "feed";

const reduceToViewerVotes = (
  voters: Statement["voters"],
  viewerId: string | undefined,
): Statement["voters"] => {
  if (!viewerId || !voters[viewerId]) return {};
  return { [viewerId]: voters[viewerId] };
};

export const trimVotersToViewer = (
  statements: Statement[],
  viewerId: string | undefined,
): Statement[] =>
  statements.map((statement) => ({
    ...statement,
    voters: reduceToViewerVotes(statement.voters, viewerId),
  }));

export const updateVoteCounts = (
  statements: Statement[],
  votes: Pick<Vote, "statementId" | "userId" | "voteType">[],
): Statement[] => {
  const eventVotesByStatementId = _.groupBy(
    votes,
    "statementId",
  );
  return statements.map((statement) => ({
    ...statement,
    ...calculateVoteStats(
      eventVotesByStatementId[statement.id] ?? [],
    ),
  }));
};

const statementVoterKey = (vote: EventVote) =>
  `${vote.statementId}:${vote.userId}`;

export const moveVotesToMergeTargets = (
  votes: EventVote[],
  merges: StatementMerge[],
): EventVote[] => {
  const targetIdBySourceId = new Map(
    merges.map((merge) => [
      merge.sourceStatementId,
      merge.targetStatementId,
    ]),
  );
  const votesOnKeptStatements = votes.filter(
    (vote) => !targetIdBySourceId.has(vote.statementId),
  );
  const votesMovedToTargets = votes.flatMap((vote) => {
    const targetId = targetIdBySourceId.get(vote.statementId);
    return targetId ? [{ ...vote, statementId: targetId }] : [];
  });
  return _.uniqBy(
    [...votesOnKeptStatements, ...votesMovedToTargets],
    statementVoterKey,
  );
};

const loadEventVotesForStatements = async (
  statements: Statement[],
): Promise<EventVote[]> =>
  (await Promise.all(
    statements.map(async (statement) =>
      (await getVotesForStatement(statement.id))
        .filter(isEventVote)
        .map((vote) => ({ ...vote, roomId: statement.roomId })),
    ),
  )).flat();

interface EventStatementsAndVotes {
  statements: Statement[];
  votes: EventVote[];
}

interface LoadEventStatementsOptions {
  includesHiddenStatements?: boolean;
}

export const loadEventStatementsAndVotes = async (
  roomIds: string[],
  {
    includesHiddenStatements = false,
  }: LoadEventStatementsOptions = {},
): Promise<EventStatementsAndVotes> => {
  const loadRoomStatements = includesHiddenStatements
    ? getStatementsForRoomIncludingHidden
    : getStatementsForRoom;
  const [roomStatements, roomMerges] = await Promise.all([
    Promise.all(roomIds.map(loadRoomStatements)),
    Promise.all(roomIds.map(getMergesForRoom)),
  ]);
  const statements = roomStatements.flat().filter(isEventStatement);
  const merges = roomMerges.flat();
  const votes = moveVotesToMergeTargets(
    await loadEventVotesForStatements(statements),
    merges,
  );
  return {
    statements: applyStatementMerges(
      updateVoteCounts(statements, votes),
      merges,
    ),
    votes,
  };
};
