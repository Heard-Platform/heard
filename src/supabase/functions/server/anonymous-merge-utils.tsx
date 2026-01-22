import { getVotesForUser, saveVote, deleteVote, getStatement, saveStatement, getVote } from "./kv-utils.tsx";
import { getAllStatements } from "./kv-utils.tsx";
import type { Vote, Statement, AnonCreatableRecords } from "./types.tsx";

type MergeHandlers = {
  [key in AnonCreatableRecords]: (
    anonymousUserId: string,
    targetUserId: string,
  ) => Promise<void>;
};

const mergeVotes = async (anonymousUserId: string, targetUserId: string) => {
  const anonymousVotes = await getVotesForUser(anonymousUserId);
  for (const anonVote of anonymousVotes) {
    const existingVote = await getVote(anonVote.statementId, targetUserId);
    if (existingVote) {
      await deleteVote(existingVote.statementId, anonymousUserId);
    }

    const updatedAnonVote: Vote = {
      ...anonVote,
      userId: targetUserId,
      anonymousUserId: anonymousUserId,
    };
    await saveVote(updatedAnonVote);

    const statement = await getStatement(anonVote.statementId);
    if (!statement) {
      continue;
    }

    delete statement.voters[anonymousUserId];
    statement.voters[targetUserId] = anonVote.voteType;

    await saveStatement(statement);
  }
}

const mergeStatements = async (anonymousUserId: string, targetUserId: string) => {
  const allStatements = await getAllStatements();
  const anonymousStatements = allStatements.filter(
    (s) => s.author === anonymousUserId,
  );

  for (const statement of anonymousStatements) {
    const updatedStatement: Statement = {
      ...statement,
      author: targetUserId,
      anonymousUserId: anonymousUserId,
    };
    await saveStatement(updatedStatement);
  }
}

const mergeHandlers: MergeHandlers = {
  votes: mergeVotes,
  statements: mergeStatements,
};

export const mergeAnonymousUserActivity = async (
  anonymousUserId: string,
  targetUserId: string,
) => {
  for (const [recordType, handler] of Object.entries(mergeHandlers)) {
    console.log(`Merging record type: ${recordType}`);
    await handler(anonymousUserId, targetUserId);
  }
};