import * as kv from "./kv_store.tsx";
import { getVotesForUser, saveVote, deleteVote, getStatement, saveStatement } from "./kv-utils.tsx";
import { getAllStatements } from "./kv-utils.tsx";
import type { Vote, Statement, User } from "./types.tsx";

const ENABLE_ANONYMOUS_MERGE = false;

export const mergeAnonymousUserActivity = async (
  anonymousUserId: string,
  targetUserId: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!ENABLE_ANONYMOUS_MERGE) {
    console.log("Anonymous merge feature is disabled, skipping merge");
    return { success: true };
  }

  try {
    console.log(`Starting merge of anonymous user ${anonymousUserId} into ${targetUserId}`);

    const anonymousVotes = await getVotesForUser(anonymousUserId);
    console.log(`Found ${anonymousVotes.length} votes from anonymous user`);

    for (const vote of anonymousVotes) {
      const statement = await getStatement(vote.statementId);
      if (!statement) {
        console.log(`Statement ${vote.statementId} not found, skipping vote`);
        continue;
      }

      const existingVoteOnSameStatement = statement.voters[targetUserId];
      if (existingVoteOnSameStatement) {
        console.log(`Target user already voted on statement ${vote.statementId}, skipping anonymous vote`);
        continue;
      }

      await deleteVote(vote.statementId, anonymousUserId);

      const updatedVote: Vote = {
        ...vote,
        userId: targetUserId,
        anonymousUserId: anonymousUserId,
      };
      await saveVote(updatedVote);

      delete statement.voters[anonymousUserId];
      statement.voters[targetUserId] = vote.voteType;

      await saveStatement(statement);

      console.log(`Migrated vote on statement ${vote.statementId} from anonymous to target user`);
    }

    const allStatements = await getAllStatements();
    const anonymousStatements = allStatements.filter(s => s.author === anonymousUserId);
    console.log(`Found ${anonymousStatements.length} statements from anonymous user`);

    for (const statement of anonymousStatements) {
      const updatedStatement: Statement = {
        ...statement,
        author: targetUserId,
        anonymousUserId: anonymousUserId,
      };
      await saveStatement(updatedStatement);
      console.log(`Migrated statement ${statement.id} from anonymous to target user`);
    }

    console.log(`Successfully merged anonymous user ${anonymousUserId} into ${targetUserId}`);
    return { success: true };
  } catch (error) {
    console.error("Error merging anonymous user activity:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error during merge" 
    };
  }
};

export const shouldMergeAnonymousActivity = async (
  currentSessionUserId: string | null,
): Promise<{ shouldMerge: boolean; anonymousUserId?: string }> => {
  if (!ENABLE_ANONYMOUS_MERGE) {
    return { shouldMerge: false };
  }

  if (!currentSessionUserId) {
    return { shouldMerge: false };
  }

  const anonymousUserData = await kv.get(`user:${currentSessionUserId}`);
  if (!anonymousUserData) {
    return { shouldMerge: false };
  }

  const anonymousUser = JSON.parse(anonymousUserData) as User;
  
  if (!anonymousUser.isAnonymous) {
    return { shouldMerge: false };
  }

  return {
    shouldMerge: true,
    anonymousUserId: currentSessionUserId,
  };
};
