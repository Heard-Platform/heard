import type { Vote, Statement, User, VoteType } from "./types.tsx";
import { saveStatement, saveVote, getVotesForStatement, deleteVote, saveUser } from "./kv-utils.tsx";
import { getByPrefixParsed } from "./kv-utils.tsx";
import { getUserSession } from "./auth-api.tsx";
import { generateId, getDebateRoom, getStatementById, saveDebateRoom } from "./debate-api.tsx";
import { ANONYMOUS_ACTION_NOT_ALLOWED_ERROR } from "./constants.tsx";

export const countStatementVotes = (statement: Statement): number =>
  statement.agrees + statement.disagrees + statement.passes + statement.superAgrees;

export const calculateVoteStats = (
  votes: Vote[],
): {
  agrees: number;
  disagrees: number;
  passes: number;
  superAgrees: number;
  voters: { [userId: string]: VoteType };
} => {
  const voters: { [userId: string]: VoteType } = {};
  let agrees = 0;
  let disagrees = 0;
  let passes = 0;
  let superAgrees = 0;

  votes.forEach((vote) => {
    voters[vote.userId] = vote.voteType;
    if (vote.voteType === "agree") {
      agrees++;
    } else if (vote.voteType === "disagree") {
      disagrees++;
    } else if (vote.voteType === "pass") {
      passes++;
    } else if (vote.voteType === "super_agree") {
      superAgrees++;
      // Count super agrees also as regular agrees for now
      agrees++;
    }
  });

  return { agrees, disagrees, passes, superAgrees, voters };
};

type ProcessVoteFailure = {
  success: false;
  error: string;
  message?: string;
};

type ProcessVoteSuccess = {
  success: true;
  statement: Statement;
  user: User;
  pointsEarned: number;
  userVote: VoteType | null;
};

export type ProcessVoteResult = ProcessVoteFailure | ProcessVoteSuccess;

export const processVote = async (
  statementId: string,
  userId: string,
  voteType: VoteType,
  flyerId?: string,
  allowIdempotent = false,
): Promise<ProcessVoteResult> => {
  if (
    !["agree", "disagree", "pass", "super_agree"].includes(voteType)
  ) {
    return { success: false, error: "Invalid vote type" };
  }

  const user = await getUserSession(userId);
  if (!user) {
    return { success: false, error: "User session not found" };
  }

  // Fetch statement using LIKE pattern (statement:%:statementId)
  const statement = await getStatementById(statementId);

  if (!statement) {
    console.error(`Statement not found with ID: ${statementId}`);
    return { success: false, error: "Statement not found" };
  }
  console.log(
    `Voting on statement ${statementId} by user ${userId} with vote ${voteType}`,
  );

  // Auto-join user to room if they're not already a participant
  const room = await getDebateRoom(statement.roomId);

  if (user.isAnonymous && room && !room.allowAnonymous) {
    return {
      success: false,
      error: ANONYMOUS_ACTION_NOT_ALLOWED_ERROR,
      message: "This debate doesn't allow anonymous voting",
    };
  }

  if (room && !room.participants.includes(userId)) {
    room.participants.push(userId);
    await saveDebateRoom(room);
    console.log(
      `Auto-added user ${userId} to room ${statement.roomId} via voting`,
    );
  }

  // Get current vote if it exists
  const currentVotes = await getVotesForStatement(statementId);
  const currentVote = currentVotes.find((v) => v.userId === userId);
  let pointsEarned = 0;

  let voteData = {
    voteType,
    flyerId,
    timestamp: Date.now(),
  }

  if (currentVote?.voteType === voteType && !allowIdempotent) {
    // Same vote type - undo vote (delete the vote record)
    await deleteVote(statementId, userId);
    console.log(
      `Removed vote for user ${userId} on statement ${statementId}`,
    );
    // No points change for undoing
  } else if (currentVote && currentVote.voteType !== voteType) {
    // Different vote type - update existing vote
    const updatedVote: Vote = {
      ...currentVote,
      ...voteData,
    };
    await saveVote(updatedVote);
    console.log(
      `Updated vote for user ${userId} on statement ${statementId} to ${voteType}`,
    );

    // No points for changing vote
  } else {
    const newVote: Vote = {
      id: generateId(),
      statementId,
      userId,
      ...voteData,
    };
    await saveVote(newVote);
    console.log(
      `Created new vote for user ${userId} on statement ${statementId}: ${voteType}`,
    );

    pointsEarned = 10;

    const allUsers = await getByPrefixParsed<User>("user:");
    const statementAuthorUser = allUsers.find(
      (u) => u.id === statement.author,
    );

    if (statementAuthorUser && statementAuthorUser.id !== userId) {
      statementAuthorUser.score += 3;
      await saveUser(statementAuthorUser);
    }

    if (room && room.hostId && room.hostId !== userId) {
      const roomCreator = await getUserSession(room.hostId);
      if (roomCreator) {
        roomCreator.score += 1;
        await saveUser(roomCreator);
      }
    }
  }

  if (room) {
    room.lastVoteAt = Date.now();
    await saveDebateRoom(room);
  }

  // Get updated vote data to return
  const updatedVotes = await getVotesForStatement(statementId);
  const voteStats = calculateVoteStats(updatedVotes);

  const updatedStatement = {
    ...statement,
    agrees: voteStats.agrees,
    disagrees: voteStats.disagrees,
    passes: voteStats.passes,
    superAgrees: voteStats.superAgrees,
    voters: voteStats.voters,
  };

  await saveStatement(updatedStatement);

  console.log(
    `Final vote count for statement ${statementId}: ${voteStats.agrees} agree, ${voteStats.disagrees} disagree, ${voteStats.passes} pass (${updatedVotes.length} total votes)`,
  );

  if (pointsEarned > 0) {
    user.score += pointsEarned;
    await saveUser(user);
  }

  return {
    success: true,
    statement: updatedStatement,
    user,
    pointsEarned,
    userVote: voteStats.voters[userId] || null,
  };
};