import _ from "lodash";
import {
  getStatementsForRoom,
  getStatementsForRoomIncludingHidden,
  getVotesForStatement,
} from "./kv-utils.tsx";
import { calculateVoteStats } from "./voting-utils.ts";
import type {
  EventVote,
  Statement,
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
  const roomStatements = await Promise.all(
    roomIds.map(loadRoomStatements),
  );
  const statements = roomStatements.flat().filter(isEventStatement);
  const votes = await loadEventVotesForStatements(statements);
  return {
    statements: updateVoteCounts(statements, votes),
    votes,
  };
};
