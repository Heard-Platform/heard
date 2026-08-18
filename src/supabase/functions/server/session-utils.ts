import { getRecentUserEvents, tagEventsWithSession } from "./model-utils.ts";
import { getAllRealUsers, getDevUsers } from "./kv-utils.tsx";
import { UserEvent } from "./types.tsx";

export const SESSION_GAP_MS = 15 * 60 * 1000;
const DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface SessionSummary {
  sessionId: string;
  userId: string;
  userLabel: string;
  startedAt: number;
  endedAt: number | null;
  durationMs: number;
  eventCount: number;
  eventTypes: string[];
  isActive: boolean;
}

export interface EventForGrouping {
  id: string;
  userId: string;
  type: string;
  createdAt: number;
  sessionId?: string | null;
}

export interface SessionComputation {
  sessions: SessionSummary[];
  newlyTagged: { eventIds: string[]; sessionId: string }[];
}

const toTimestamp = (val: number | string | undefined): number => {
  if (!val) return 0;
  const n = Number(val);
  return isNaN(n) ? new Date(val).getTime() : n;
};

const summarizeSession = (
  sessionId: string,
  userId: string,
  events: EventForGrouping[],
  isActive: boolean,
  now: number,
): SessionSummary => {
  const startedAt = events[0].createdAt;
  const endedAt = isActive ? null : events[events.length - 1].createdAt;
  return {
    sessionId,
    userId,
    userLabel: userId,
    startedAt,
    endedAt,
    durationMs: (isActive ? now : endedAt!) - startedAt,
    eventCount: events.length,
    eventTypes: Array.from(new Set(events.map((e) => e.type))),
    isActive,
  };
};

export const computeSessions = (
  events: EventForGrouping[],
  now: number,
): SessionComputation => {
  const eventsByUser = new Map<string, EventForGrouping[]>();
  for (const event of events) {
    const list = eventsByUser.get(event.userId) ?? [];
    list.push(event);
    eventsByUser.set(event.userId, list);
  }

  const sessions: SessionSummary[] = [];
  const newlyTagged: { eventIds: string[]; sessionId: string }[] = [];

  for (const [userId, userEvents] of eventsByUser) {
    const sorted = [...userEvents].sort((a, b) => a.createdAt - b.createdAt);

    const taggedGroups = new Map<string, EventForGrouping[]>();
    const untagged: EventForGrouping[] = [];
    for (const event of sorted) {
      if (event.sessionId) {
        const group = taggedGroups.get(event.sessionId) ?? [];
        group.push(event);
        taggedGroups.set(event.sessionId, group);
      } else {
        untagged.push(event);
      }
    }

    for (const [sessionId, group] of taggedGroups) {
      sessions.push(summarizeSession(sessionId, userId, group, false, now));
    }

    let chunkStart = 0;
    for (let i = 0; i < untagged.length; i++) {
      const isLastEvent = i === untagged.length - 1;
      const gapToNext = isLastEvent
        ? now - untagged[i].createdAt
        : untagged[i + 1].createdAt - untagged[i].createdAt;

      if (gapToNext >= SESSION_GAP_MS) {
        const chunk = untagged.slice(chunkStart, i + 1);
        const sessionId = `${userId}-${chunk[0].createdAt}`;
        sessions.push(summarizeSession(sessionId, userId, chunk, false, now));
        newlyTagged.push({ eventIds: chunk.map((e) => e.id), sessionId });
        chunkStart = i + 1;
      }
    }

    if (chunkStart < untagged.length) {
      const chunk = untagged.slice(chunkStart);
      const sessionId = `${userId}-${chunk[0].createdAt}-active`;
      sessions.push(summarizeSession(sessionId, userId, chunk, true, now));
    }
  }

  return { sessions, newlyTagged };
};

export const computeAndGetSessions = async (
  sinceTs?: number,
): Promise<{
  sessions: SessionSummary[];
  fetchedAt: number;
}> => {
  const now = Date.now();
  const windowStart = sinceTs ?? now - DEFAULT_WINDOW_MS;

  const [rawEvents, devUsers] = await Promise.all([
    getRecentUserEvents(windowStart),
    getDevUsers(),
  ]);
  const devUserIds = new Set(devUsers.map((u) => u.id));

  const events: EventForGrouping[] = rawEvents
    .filter(
      (e): e is UserEvent & { id: string; userId: string } =>
        !!e.id && !!e.userId && !devUserIds.has(e.userId),
    )
    .map((e) => ({
      id: e.id,
      userId: e.userId,
      type: e.type,
      createdAt: toTimestamp(e.createdAt),
      sessionId: e.sessionId,
    }));

  const { sessions, newlyTagged } = computeSessions(events, now);

  await Promise.all(
    newlyTagged.map(({ eventIds, sessionId }) =>
      tagEventsWithSession(eventIds, sessionId),
    ),
  );

  const meaningfulSessions = sessions.filter((s) => s.eventCount > 1);

  const users = await getAllRealUsers();
  const userLabels = new Map(
    users.map((u) => [u.id, u.nickname || u.email || u.id]),
  );
  for (const session of meaningfulSessions) {
    session.userLabel = userLabels.get(session.userId) ?? session.userId;
  }

  meaningfulSessions.sort((a, b) => b.startedAt - a.startedAt);

  return { sessions: meaningfulSessions, fetchedAt: now };
};
