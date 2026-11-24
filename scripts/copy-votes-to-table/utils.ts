import type {
  ContentSource,
  Vote,
  VoteType,
} from "../../src/supabase/functions/server/types.tsx";

export interface VoteRow {
  id: string;
  statementId: string;
  userId: string;
  voteType: VoteType;
  source: ContentSource | null;
  flyerId: string | null;
  flyerGroup: number | null;
  anonymousUserId: string | null;
  timestamp: number;
}

export const voteToRow = (vote: Vote): VoteRow => ({
  id: vote.id,
  statementId: vote.statementId,
  userId: vote.userId,
  voteType: vote.voteType,
  source: vote.source ?? null,
  flyerId: vote.flyerId ?? null,
  flyerGroup: vote.flyerGroup ?? null,
  anonymousUserId: vote.anonymousUserId ?? null,
  timestamp: Math.floor(vote.timestamp),
});

export interface KvVoteRecord {
  key: string;
  value: unknown;
}

export interface VoteCopyPlan {
  votesToCopy: Vote[];
  oldFormatSkippedCount: number;
  mergeLeftoverSkippedCount: number;
  unreadableSkippedCount: number;
}

const parseVote = (value: unknown): Vote | null => {
  try {
    return typeof value === "string" ? JSON.parse(value) : value as Vote;
  } catch {
    return null;
  }
};

export const isCurrentFormatVoteKey = (key: string, vote: Vote) =>
  key === `vote:${vote.statementId}:${vote.userId}`;

const voteIdAndUserKey = (voteId: string, userId: string) =>
  `${voteId}:${userId}`;

export const findMergeLeftoverVotes = (votes: Vote[]): Set<Vote> => {
  const mergedOriginalKeys = new Set(
    votes
      .filter((vote) => vote.anonymousUserId)
      .map((vote) =>
        voteIdAndUserKey(vote.id, vote.anonymousUserId as string)
      ),
  );
  return new Set(
    votes.filter((vote) =>
      mergedOriginalKeys.has(voteIdAndUserKey(vote.id, vote.userId))
    ),
  );
};

export const planVoteCopy = (records: KvVoteRecord[]): VoteCopyPlan => {
  const currentFormatVotes: Vote[] = [];
  let oldFormatSkippedCount = 0;
  let unreadableSkippedCount = 0;

  for (const record of records) {
    const vote = parseVote(record.value);
    if (!vote) {
      unreadableSkippedCount++;
    } else if (isCurrentFormatVoteKey(record.key, vote)) {
      currentFormatVotes.push(vote);
    } else {
      oldFormatSkippedCount++;
    }
  }

  const mergeLeftoverVotes = findMergeLeftoverVotes(currentFormatVotes);
  return {
    votesToCopy: currentFormatVotes.filter(
      (vote) => !mergeLeftoverVotes.has(vote),
    ),
    oldFormatSkippedCount,
    mergeLeftoverSkippedCount: mergeLeftoverVotes.size,
    unreadableSkippedCount,
  };
};
