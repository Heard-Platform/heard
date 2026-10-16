import type { DebateRoom, Rant, SentEmail, Statement, User, UserEvent, Vote } from "./types.tsx";

export type UserTimelineEventKind =
  | "anon_session_started"
  | "account_created"
  | "first_seen"
  | "room_created"
  | "statement_posted"
  | "vote_cast"
  | "rant_submitted"
  | "email_sent"
  | "tracked_event";

export interface UserTimelineEvent {
  timestamp: number;
  kind: UserTimelineEventKind;
  label: string;
  detail?: string;
  roomId?: string;
  roomTopic?: string;
  wasAnonymous: boolean;
}

interface TimelineSources {
  user: User;
  anonymousUsers: User[];
  rooms: DebateRoom[];
  statements: Statement[];
  votes: Vote[];
  rants: Rant[];
  emails: SentEmail[];
  events: UserEvent[];
  roomsById: Map<string, DebateRoom>;
  statementsById: Map<string, Statement>;
}

const wasUserAnonymousAt = (user: User, timestamp: number) =>
  !!user.isAnonymous ||
  (user.upgradedFromAnonymousAt !== undefined && timestamp < user.upgradedFromAnonymousAt);

// Anonymous users who sign up via anon-add-email keep their id, so their createdAt
// is when the anonymous session started. Accounts upgraded before
// upgradedFromAnonymousAt existed can't be told apart from direct sign-ups.
const accountMilestones = (user: User): UserTimelineEvent[] => {
  if (user.isAnonymous) {
    return [{
      timestamp: user.createdAt,
      kind: "anon_session_started",
      label: "Started anonymous session",
      wasAnonymous: true,
    }];
  }

  if (user.upgradedFromAnonymousAt !== undefined) {
    return [
      {
        timestamp: user.createdAt,
        kind: "anon_session_started",
        label: "Started anonymous session",
        wasAnonymous: true,
      },
      {
        timestamp: user.upgradedFromAnonymousAt,
        kind: "account_created",
        label: "Created account",
        wasAnonymous: false,
      },
    ];
  }

  return [{
    timestamp: user.createdAt,
    kind: "first_seen",
    label: "First seen",
    detail: "Account creation or anonymous session start (not recorded which)",
    wasAnonymous: false,
  }];
};

export const buildUserTimeline = ({
  user,
  anonymousUsers,
  rooms,
  statements,
  votes,
  rants,
  emails,
  events,
  roomsById,
  statementsById,
}: TimelineSources): UserTimelineEvent[] => {
  const anonymousUserIds = new Set(anonymousUsers.map((anonUser) => anonUser.id));
  const isAnonymousActor = (actorId: string | null | undefined, timestamp: number) =>
    !!actorId &&
    (anonymousUserIds.has(actorId) ||
      (actorId === user.id && wasUserAnonymousAt(user, timestamp)));
  const roomFields = (roomId: string | undefined) => ({
    roomId,
    roomTopic: roomId ? roomsById.get(roomId)?.topic : undefined,
  });

  const timeline: UserTimelineEvent[] = [
    ...anonymousUsers.map((anonUser) => ({
      timestamp: anonUser.createdAt,
      kind: "anon_session_started" as const,
      label: "Started anonymous session",
      detail: anonUser.id,
      wasAnonymous: true,
    })),
    ...accountMilestones(user),
    ...rooms.map((room) => ({
      timestamp: room.createdAt,
      kind: "room_created" as const,
      label: "Created room",
      ...roomFields(room.id),
      wasAnonymous: isAnonymousActor(room.hostId, room.createdAt),
    })),
    ...statements.map((statement) => ({
      timestamp: statement.timestamp,
      kind: "statement_posted" as const,
      label: "Posted statement",
      detail: statement.text,
      ...roomFields(statement.roomId),
      wasAnonymous: !!statement.anonymousUserId || isAnonymousActor(statement.author, statement.timestamp),
    })),
    ...votes.map((vote) => {
      const statement = statementsById.get(vote.statementId);
      return {
        timestamp: vote.timestamp,
        kind: "vote_cast" as const,
        label: `Voted ${vote.voteType}`,
        detail: statement?.text,
        ...roomFields(statement?.roomId),
        wasAnonymous: !!vote.anonymousUserId || isAnonymousActor(vote.userId, vote.timestamp),
      };
    }),
    ...rants.map((rant) => ({
      timestamp: rant.timestamp,
      kind: "rant_submitted" as const,
      label: "Submitted rant",
      detail: rant.text,
      ...roomFields(rant.roomId),
      wasAnonymous: isAnonymousActor(rant.author, rant.timestamp),
    })),
    ...emails.map((email) => ({
      timestamp: email.sentAt,
      kind: "email_sent" as const,
      label: `Email sent: ${email.emailType}`,
      ...roomFields(email.roomId),
      wasAnonymous: false,
    })),
    ...events.map((event) => {
      const timestamp = new Date(event.createdAt).getTime();
      return {
        timestamp,
        kind: "tracked_event" as const,
        label: event.type,
        detail: event.url,
        ...roomFields(event.roomId),
        wasAnonymous: isAnonymousActor(event.userId, timestamp),
      };
    }),
  ];

  return timeline
    .filter((entry) => Number.isFinite(entry.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);
};
