import type {
  Vote,
  Statement,
  User,
  VoteType,
  ContentSource,
  DebateRoom,
} from "./types.tsx";
import {
  findStatementInAnyRoom,
  getVote,
  saveStatement,
  saveVote,
  getVotesForStatement,
  saveUser,
} from "./kv-utils.tsx";
import { getUserSession } from "./auth-api.tsx";
import { generateId, getDebateRoom, saveDebateRoom } from "./debate-api.tsx";
import { recordRoomEngagement } from "./model-utils.ts";
import { ANONYMOUS_ACTION_NOT_ALLOWED_ERROR } from "./constants.tsx";
import { maybeEmailResponseVotesNotif } from "./email-notifs-utils.ts";
import { recomputeClustersIfNeeded } from "./cluster-freshness.ts";
import { runInBackground } from "./background-utils.ts";
import { checkEventVoting } from "./event-utils.ts";
import {
  applyVoteToStatement,
  calculateVoteStats,
} from "./vote-stats-utils.ts";

export interface FlyerSource {
  flyerId: string;
  flyerGroup?: number;
}

export const flyerAttribution = (
  flyerSource?: FlyerSource,
): Pick<Vote, "flyerId" | "flyerGroup"> => {
  if (!flyerSource) return {};
  const { flyerId, flyerGroup } = flyerSource;
  return Number.isInteger(flyerGroup) ? { flyerId, flyerGroup } : { flyerId };
};

export const countStatementVotes = (statement: Statement): number =>
  statement.agrees + statement.disagrees + statement.passes + statement.superAgrees;

const MAX_VOTE_BOOST = 25;
const MAX_RANDOM_JITTER = 100 - MAX_VOTE_BOOST;

export const scoreStatements = (
  statements: Statement[],
): { statement: Statement; score: number }[] => {
  const maxOpinionatedVotes = statements.reduce(
    (max, s) => Math.max(max, s.agrees + s.disagrees),
    0,
  );

  return statements.map((statement) => {
    const opinionatedVotes = statement.agrees + statement.disagrees;
    const score =
      maxOpinionatedVotes > 0
        ? (opinionatedVotes / maxOpinionatedVotes) * MAX_VOTE_BOOST
        : 0;
    return { statement, score };
  });
};

export const orderStatements = (
  statements: Statement[],
): Statement[] =>
  scoreStatements(statements)
    .map(({ statement, score }) => ({
      statement,
      finalScore: score
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .map(({ statement }) => statement);

type ProcessVoteFailure = {
  success: false;
  error: string;
  message?: string;
  status?: 423;
};

type ProcessVoteSuccess = {
  success: true;
  statement: Statement;
  user: User;
  pointsEarned: number;
  userVote: VoteType | null;
};

export type ProcessVoteResult = ProcessVoteFailure | ProcessVoteSuccess;

const awardAuthorAndHostPoints = async (
  statement: Statement,
  room: DebateRoom,
  voterId: string,
) => {
  if (statement.author !== voterId) {
    const author = await getUserSession(statement.author);
    if (author) {
      author.score += 3;
      await saveUser(author);
    }
  }

  if (room.hostId && room.hostId !== voterId) {
    const roomCreator = await getUserSession(room.hostId);
    if (roomCreator) {
      roomCreator.score += 1;
      await saveUser(roomCreator);
    }
  }
};

const NEW_VOTE_POINTS = 10;

const recountStatementVotes = async (
  statement: Statement,
): Promise<Statement> => {
  const voteStats = calculateVoteStats(
    await getVotesForStatement(statement.id),
  );
  return {
    ...statement,
    agrees: voteStats.agrees,
    disagrees: voteStats.disagrees,
    passes: voteStats.passes,
    superAgrees: voteStats.superAgrees,
    voters: voteStats.voters,
  };
};

type ProcessVoteInputs = {
  statementId: string;
  userId: string;
  voteType: VoteType;
  voteSource: ContentSource;
  flyerSource?: FlyerSource;
  skipsEventVotingCheck?: boolean;
};

export const processVote = async ({
  statementId,
  userId,
  voteType,
  voteSource,
  flyerSource,
  skipsEventVotingCheck = false,
}: ProcessVoteInputs): Promise<ProcessVoteResult> => {
  if (
    !["agree", "disagree", "pass", "super_agree"].includes(voteType)
  ) {
    return { success: false, error: "Invalid vote type" };
  }

  const [user, statement, currentVote] = await Promise.all([
    getUserSession(userId),
    findStatementInAnyRoom(statementId),
    getVote(statementId, userId),
  ]);

  if (!user) {
    return { success: false, error: "User session not found" };
  }

  if (!statement) {
    console.error(`Statement not found with ID: ${statementId}`);
    return { success: false, error: "Statement not found" };
  } else if (statement.isHidden) {
    console.error(`Attempt to vote on hidden statement ID: ${statementId}`);
    return { success: false, error: "Statement is hidden" };
  }

  console.log(
    `Voting on statement ${statementId} by user ${userId} with vote ${voteType}`,
  );

  const room = await getDebateRoom(statement.roomId);

  if (!room) {
    console.error(`Debate room not found with ID: ${statement.roomId}`);
    return { success: false, error: "Debate room not found" };
  }

  if (!skipsEventVotingCheck) {
    const canVote = await checkEventVoting(room);
    if (!canVote.allowed) {
      return { success: false, error: canVote.error, status: 423 };
    }
  }

  if (user.isAnonymous && !room.allowAnonymous) {
    return {
      success: false,
      error: ANONYMOUS_ACTION_NOT_ALLOWED_ERROR,
      message: "This debate doesn't allow anonymous voting",
    };
  }

  const isNewParticipant = !room.participants.includes(userId);
  if (isNewParticipant) {
    room.participants.push(userId);
    console.log(
      `Auto-added user ${userId} to room ${statement.roomId} via voting`,
    );
  }

  const isNewVote = !currentVote;
  const isEventVote = voteSource === "event";
  const pointsEarned = isNewVote && !isEventVote ? NEW_VOTE_POINTS : 0;
  const voteCountChange = isNewVote ? 1 : 0;

  const votePartial = {
    voteType,
    source: voteSource,
    timestamp: Date.now(),
    ...flyerAttribution(flyerSource),
  };

  if (isNewVote) {
    await saveVote({
      id: generateId(),
      statementId,
      userId,
      ...votePartial,
    });
  } else {
    await saveVote({ ...currentVote, ...votePartial });
  }

  if (isNewVote && !isEventVote) {
    runInBackground(
      awardAuthorAndHostPoints(statement, room, userId),
      `author and host points for statement ${statementId}`,
    );
  }

  const now = Date.now();
  room.lastActivityAt = now;
  room.totalVotes = (room.totalVotes || 0) + voteCountChange;
  runInBackground(
    recordRoomEngagement(userId, room.id, now),
    `room engagement for room ${statement.roomId}`,
  );
  const shouldSaveRoom = !isEventVote || isNewParticipant;
  if (shouldSaveRoom) {
    runInBackground(
      saveDebateRoom(room),
      `room save for room ${statement.roomId}`,
    );
  }

  const updatedStatement = isEventVote
    ? applyVoteToStatement(
      statement,
      userId,
      currentVote?.voteType ?? null,
      voteType,
    )
    : await recountStatementVotes(statement);

  if (pointsEarned > 0) {
    user.score += pointsEarned;
  }

  await Promise.all([
    isEventVote ? Promise.resolve() : saveStatement(updatedStatement),
    pointsEarned > 0 ? saveUser(user) : Promise.resolve(),
  ]);

  if (!isEventVote) {
    runInBackground(
      recomputeClustersIfNeeded(room),
      `cluster freshness check for room ${statement.roomId}`,
    );
  }

  if (!isEventVote) {
    runInBackground(
      maybeEmailResponseVotesNotif(
        updatedStatement,
        statement.agrees + statement.disagrees,
      ),
      `response votes notif for statement ${statementId}`,
    );
  }

  console.log(
    `Final vote count for statement ${statementId}: ${updatedStatement.agrees} agree, ${updatedStatement.disagrees} disagree, ${updatedStatement.passes} pass`,
  );

  return {
    success: true,
    statement: updatedStatement,
    user,
    pointsEarned,
    userVote: voteType,
  };
};
