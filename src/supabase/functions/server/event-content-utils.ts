import _ from "lodash";
import {
  getStatementsForRoom,
  getStatementsForRoomIncludingHidden,
  getVotesForStatements,
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

export const filterToEventVotes = (
  votes: Vote[],
  statements: Statement[],
): EventVote[] => {
  const roomIdByStatementId = new Map(
    statements.map((statement) => [statement.id, statement.roomId]),
  );
  return votes
    .filter(isEventVote)
    .filter((vote) => roomIdByStatementId.has(vote.statementId))
    .map((vote) => ({
      ...vote,
      roomId: roomIdByStatementId.get(vote.statementId)!,
    }));
};

const loadEventVotesForStatements = async (
  statements: Statement[],
): Promise<EventVote[]> => {
  const votes = await getVotesForStatements(
    statements.map((statement) => statement.id),
  );
  return filterToEventVotes(votes, statements);
};

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
