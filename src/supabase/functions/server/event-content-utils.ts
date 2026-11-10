import _ from "lodash";
import { calculateVoteStats } from "./voting-utils.ts";
import type { Statement, Vote } from "./types.tsx";

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
