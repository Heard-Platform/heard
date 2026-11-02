import type { Statement, User, VoteType } from "./types.tsx";
import { getStatement, getVote } from "./kv-utils.tsx";
import { processVote, type FlyerSource } from "./voting-utils.ts";
import { isAgreeVote, isDisagreeVote } from "./vote-type-utils.ts";
import { createAnonymousUser, createSession, getUserSession } from "./auth-api.tsx";
import { RouteError } from "./route-error.ts";
import { runInBackground } from "./background-utils.ts";
import { sendFlyerResultsEmailIfFlyerVoter, WAYMO_FLYER_STATEMENT_ID } from "./service-flyer-results-email.ts";

export const VALID_VOTE_TYPES: VoteType[] = ["agree", "disagree", "pass", "super_agree"];
const DROPPED_FLYER_VOTE_LOG_TAG = "[FLYER VOTE DROPPED]";

export type QuickFlyerVoteRequest = {
  flyerId: string;
  statementId: string;
  vote: VoteType;
  environment?: string;
  flyerGroup?: number;
};

export type QuickFlyerVoteResponse = {
  user: User;
  sessionId: string;
  roomId: string;
  statementText: string;
  agreeCount: number;
  disagreeCount: number;
};

export interface AgreeAndDisagreeCounts {
  agreeCount: number;
  disagreeCount: number;
}

interface FlyerVoter {
  user: User;
  sessionId: string;
  previousVoteType: VoteType | null;
}

interface PendingFlyerVote {
  statementId: string;
  userId: string;
  vote: VoteType;
  flyerSource: FlyerSource;
  isExistingUser: boolean;
}

const adjustCount = (
  storedCount: number,
  didPreviousVoteCount: boolean,
  doesNewVoteCount: boolean,
): number =>
  Math.max(0, storedCount - Number(didPreviousVoteCount) + Number(doesNewVoteCount));

export const recountVotes = (
  statement: Pick<Statement, "agrees" | "disagrees">,
  previousVoteType: VoteType | null,
  newVoteType: VoteType,
): AgreeAndDisagreeCounts => ({
  agreeCount: adjustCount(
    statement.agrees,
    isAgreeVote(previousVoteType),
    isAgreeVote(newVoteType),
  ),
  disagreeCount: adjustCount(
    statement.disagrees,
    isDisagreeVote(previousVoteType),
    isDisagreeVote(newVoteType),
  ),
});

const createAnonymousFlyerVoter = async (
  environment: string | undefined,
  flyerSource: FlyerSource,
): Promise<FlyerVoter> => {
  const user = await createAnonymousUser({
    createdInEnvironment: environment || "unknown",
    isTestUser: environment !== "production",
    flyerId: flyerSource.flyerId,
    flyerGroup: flyerSource.flyerGroup,
  });
  const session = await createSession(user.id);
  return { user, sessionId: session.id, previousVoteType: null };
};

const loadExistingFlyerVoter = async (
  userId: string,
  statementId: string,
): Promise<FlyerVoter> => {
  const [user, previousVote, session] = await Promise.all([
    getUserSession(userId),
    getVote(statementId, userId),
    createSession(userId),
  ]);
  if (!user) throw new RouteError("User not found", 404);
  return { user, sessionId: session.id, previousVoteType: previousVote?.voteType ?? null };
};

const logDroppedFlyerVote = (pendingVote: PendingFlyerVote, reason: unknown) => {
  console.error(
    DROPPED_FLYER_VOTE_LOG_TAG,
    JSON.stringify({
      flyerId: pendingVote.flyerSource.flyerId,
      flyerGroup: pendingVote.flyerSource.flyerGroup,
      statementId: pendingVote.statementId,
      userId: pendingVote.userId,
      vote: pendingVote.vote,
      reason: reason instanceof Error ? reason.message : reason,
    }),
  );
};

const saveFlyerVote = async (pendingVote: PendingFlyerVote) => {
  try {
    const result = await processVote(
      pendingVote.statementId,
      pendingVote.userId,
      pendingVote.vote,
      pendingVote.flyerSource,
      true,
    );
    if (!result.success) {
      logDroppedFlyerVote(pendingVote, result.error);
      return;
    }
  } catch (error) {
    logDroppedFlyerVote(pendingVote, error);
    return;
  }

  if (pendingVote.isExistingUser && pendingVote.statementId === WAYMO_FLYER_STATEMENT_ID) {
    await sendFlyerResultsEmailIfFlyerVoter(pendingVote.userId);
  }
};

export const castFlyerVoteQuickly = async (
  { flyerId, statementId, vote, environment, flyerGroup }: QuickFlyerVoteRequest,
  existingUserId: string | undefined,
): Promise<QuickFlyerVoteResponse> => {
  const flyerSource: FlyerSource = { flyerId, flyerGroup };

  const [voter, statement] = await Promise.all([
    existingUserId
      ? loadExistingFlyerVoter(existingUserId, statementId)
      : createAnonymousFlyerVoter(environment, flyerSource),
    getStatement(flyerId, statementId),
  ]);
  if (!statement) throw new RouteError("Statement not found", 404);

  const stats = recountVotes(
    statement,
    voter.previousVoteType,
    vote,
  );

  runInBackground(
    saveFlyerVote({
      statementId,
      userId: voter.user.id,
      vote,
      flyerSource,
      isExistingUser: !!existingUserId,
    }),
    `flyer vote for statement ${statementId}`,
  );

  return {
    user: voter.user,
    sessionId: voter.sessionId,
    roomId: statement.roomId,
    statementText: statement.text,
    ...stats,
  };
};
