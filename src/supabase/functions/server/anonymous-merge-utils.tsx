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
  getFeedbackList,
  saveFeedback,
} from "./kv-utils.tsx";
import { getAllStatements } from "./kv-utils.tsx";
import {
  getCoverCardSwipedRoomIds,
  saveCoverCardSwipe,
  deleteCoverCardSwipesForUser,
  getCardSwipesForUser,
  saveCardSwipe,
  deleteCardSwipesForUser,
  getRoomViewsForUser,
  saveRoomView,
  deleteRoomView,
  getAppFeedbackVotesForUser,
  saveAppFeedbackVote,
  deleteAppFeedbackVotesForUser,
} from "./model-utils.ts";
import type { Vote, Statement, AnonCreatableRecords } from "./types.tsx";
import { reassignAnonymousVotes } from "./feedback-utils.ts";

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

export const mergeRoomViews = async (anonymousUserId: string, targetUserId: string) => {
  const [anonymousViews, targetViews] = await Promise.all([
    getRoomViewsForUser(anonymousUserId),
    getRoomViewsForUser(targetUserId),
  ]);
  const targetViewByRoom = new Map(targetViews.map((view) => [view.roomId, view]));

  for (const anonView of anonymousViews) {
    const targetView = targetViewByRoom.get(anonView.roomId);
    const lastSeenAt = Math.max(anonView.lastSeenAt, targetView?.lastSeenAt ?? 0);
    await saveRoomView({ userId: targetUserId, roomId: anonView.roomId, lastSeenAt });
    await deleteRoomView(anonymousUserId, anonView.roomId);
  }
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

const mergeAppFeedbackVotes = async (anonymousUserId: string, targetUserId: string) => {
  const [anonymousVotes, targetVotes] = await Promise.all([
    getAppFeedbackVotesForUser(anonymousUserId),
    getAppFeedbackVotesForUser(targetUserId),
  ]);
  for (const vote of reassignAnonymousVotes(anonymousVotes, targetVotes, targetUserId)) {
    await saveAppFeedbackVote(vote);
  }
  await deleteAppFeedbackVotesForUser(anonymousUserId);
}

const mergeFeedbackNotes = async (anonymousUserId: string, targetUserId: string) => {
  const notes = await getFeedbackList();
  for (const note of notes.filter((n) => n.userId === anonymousUserId)) {
    await saveFeedback({ ...note, userId: targetUserId });
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
  roomViews: mergeRoomViews,
  appFeedbackVotes: mergeAppFeedbackVotes,
  feedbackNotes: mergeFeedbackNotes,
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