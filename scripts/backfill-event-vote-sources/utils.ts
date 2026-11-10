import {
  bulkSaveVotes,
  getLiveEventState,
  getStatementsForRoomIncludingHidden,
  getVotesForStatement,
} from "../../src/supabase/functions/server/kv-utils.tsx";
import {
  selectAllWithoutLimit,
} from "../../src/supabase/functions/server/db-utils.ts";
import {
  findSessionEnd,
} from "../../src/supabase/functions/server/event-report-utils.ts";
import type {
  Event,
  EventVote,
  LiveEventState,
  Vote,
} from "../../src/supabase/functions/server/types.tsx";

interface SessionWindow {
  startedAt: number;
  endedAt: number;
}

export const isUnsourcedSessionVote = (
  vote: Pick<Vote, "source" | "timestamp">,
  { startedAt, endedAt }: SessionWindow,
): boolean =>
  vote.source === undefined &&
  vote.timestamp >= startedAt &&
  vote.timestamp <= endedAt;

export const stampAsEventVote = (vote: Vote): Vote => ({
  ...vote,
  source: "event",
});

export interface EventVoteBackfill {
  eventId: number;
  eventName: string;
  stampedVoteCount: number;
}

const loadEventPostVotes = async (
  roomOrder: string[],
): Promise<{ votes: Vote[]; eventVotes: EventVote[] }> => {
  const statements = (
    await Promise.all(
      roomOrder.map(getStatementsForRoomIncludingHidden),
    )
  ).flat();
  const votesByStatement = await Promise.all(
    statements.map(async (statement) => ({
      roomId: statement.roomId,
      votes: await getVotesForStatement(statement.id),
    })),
  );
  return {
    votes: votesByStatement.flatMap(({ votes }) => votes),
    eventVotes: votesByStatement.flatMap(({ roomId, votes }) =>
      votes.map((vote) => ({ ...vote, roomId })),
    ),
  };
};

const backfillEventVoteSources = async (
  event: Event,
  state: LiveEventState & { startedAt: number },
  isDryRun: boolean,
  now: number,
): Promise<EventVoteBackfill> => {
  const { votes, eventVotes } = await loadEventPostVotes(
    state.roomOrder,
  );
  const sessionWindow = {
    startedAt: state.startedAt,
    endedAt: findSessionEnd(state, eventVotes, now),
  };
  const votesToStamp = votes.filter((vote) =>
    isUnsourcedSessionVote(vote, sessionWindow),
  );
  if (!isDryRun && votesToStamp.length > 0) {
    await bulkSaveVotes(votesToStamp.map(stampAsEventVote));
  }
  return {
    eventId: event.id,
    eventName: event.name,
    stampedVoteCount: votesToStamp.length,
  };
};

const hasStarted = (
  state: LiveEventState | null,
): state is LiveEventState & { startedAt: number } =>
  state !== null && state.startedAt !== null;

export interface EventVoteSourcesBackfill {
  stampedVoteCount: number;
  backfills: EventVoteBackfill[];
}

export const backfillAllEventVoteSources = async (
  isDryRun: boolean,
  now: number,
): Promise<EventVoteSourcesBackfill> => {
  const events = await selectAllWithoutLimit<Event>("events");
  const backfills: EventVoteBackfill[] = [];
  for (const event of events) {
    const state = await getLiveEventState(event.id);
    if (!hasStarted(state)) continue;
    backfills.push(
      await backfillEventVoteSources(event, state, isDryRun, now),
    );
  }
  return {
    stampedVoteCount: backfills.reduce(
      (total, backfill) => total + backfill.stampedVoteCount,
      0,
    ),
    backfills,
  };
};
