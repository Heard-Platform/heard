import {
  getVotesForUser,
  saveVote,
  deleteVote,
  getStatement,
  saveStatement,
  getUser,
  saveUser,
  getUsersChanceCardStatuses,
  saveChanceCardStatus,
  deleteChanceCardStatus,
  getUsersYouTubeCardStatuses,
  saveYouTubeCardStatus,
  deleteYouTubeCardStatus,
} from "./kv-utils.tsx";
import { getAllStatements } from "./kv-utils.tsx";
import {
  getCoverCardSwipedRoomIds,
  saveCoverCardSwipe,
  deleteCoverCardSwipesForUser,
  getCardSwipesForUser,
  saveCardSwipe,
  deleteCardSwipesForUser,
} from "./model-utils.ts";
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
    const updatedAnonVote: Vote = {
      ...anonVote,
      userId: targetUserId,
      anonymousUserId: anonymousUserId,
    };
    await saveVote(updatedAnonVote);
    await deleteVote(anonVote.statementId, anonymousUserId);

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

const mergeScore = async (anonymousUserId: string, targetUserId: string) => {
  const anonymousUser = await getUser(anonymousUserId);
  const targetUser = await getUser(targetUserId);

  if (!anonymousUser || !targetUser) {
    console.error(`Could not find users for score merge`);
    return;
  }

  targetUser.score = (targetUser.score || 0) + (anonymousUser.score || 0);
  
  await saveUser(targetUser);
}

const mergeCoverCardSwipes = async (anonymousUserId: string, targetUserId: string) => {
  const roomIds = await getCoverCardSwipedRoomIds(anonymousUserId);
  for (const roomId of roomIds) {
    await saveCoverCardSwipe(targetUserId, roomId);
  }
  await deleteCoverCardSwipesForUser(anonymousUserId);
}

const mergeCardSwipes = async (anonymousUserId: string, targetUserId: string) => {
  const swipes = await getCardSwipesForUser(anonymousUserId);
  for (const swipe of swipes) {
    await saveCardSwipe(targetUserId, swipe.roomId, swipe.cardType);
  }
  await deleteCardSwipesForUser(anonymousUserId);
}

const mergeChanceCardStatuses = async (anonymousUserId: string, targetUserId: string) => {
  const statuses = await getUsersChanceCardStatuses(anonymousUserId);
  for (const status of statuses) {
    await saveChanceCardStatus({ ...status, userId: targetUserId });
    await deleteChanceCardStatus(status);
  }
}

const mergeYoutubeCardStatuses = async (anonymousUserId: string, targetUserId: string) => {
  const statuses = await getUsersYouTubeCardStatuses(anonymousUserId);
  for (const status of statuses) {
    await saveYouTubeCardStatus({ ...status, userId: targetUserId });
    await deleteYouTubeCardStatus(status);
  }
}

const mergeHandlers: MergeHandlers = {
  votes: mergeVotes,
  statements: mergeStatements,
  score: mergeScore,
  coverCardSwipes: mergeCoverCardSwipes,
  cardSwipes: mergeCardSwipes,
  chanceCardStatuses: mergeChanceCardStatuses,
  youtubeCardStatuses: mergeYoutubeCardStatuses,
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