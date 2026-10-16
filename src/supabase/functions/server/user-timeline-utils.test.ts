import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildUserTimeline } from "./user-timeline-utils.ts";
import type { DebateRoom, SentEmail, Statement, User, UserEvent, Vote } from "./types.tsx";

const ANON_CREATED = Date.UTC(2026, 9, 1, 9);
const ACCOUNT_CREATED = Date.UTC(2026, 9, 1, 10);

const makeUser = (overrides: Partial<User>): User => ({
  id: "user-1",
  nickname: "Sam",
  email: "sam@example.com",
  score: 0,
  streak: 0,
  lastActive: ACCOUNT_CREATED,
  emailDigestsEnabled: false,
  createdAt: ACCOUNT_CREATED,
  ...overrides,
});

const room = { id: "room-1", topic: "Bike lanes", hostId: "host" } as DebateRoom;
const statement = {
  id: "statement-1",
  text: "More bike lanes",
  author: "someone-else",
  roomId: "room-1",
  timestamp: ANON_CREATED,
} as Statement;

const emptySources = {
  rooms: [],
  statements: [],
  votes: [],
  rants: [],
  emails: [],
  events: [],
  roomsById: new Map([[room.id, room]]),
  statementsById: new Map([[statement.id, statement]]),
};

Deno.test("buildUserTimeline - orders anonymous activity before account creation", () => {
  const user = makeUser({});
  const anonUser = makeUser({ id: "anon-1", isAnonymous: true, createdAt: ANON_CREATED });
  const mergedVote: Vote = {
    id: "vote-1",
    statementId: statement.id,
    userId: user.id,
    anonymousUserId: anonUser.id,
    voteType: "agree",
    timestamp: ANON_CREATED + 1000,
  };

  const timeline = buildUserTimeline({
    ...emptySources,
    user,
    anonymousUsers: [anonUser],
    votes: [mergedVote],
  });

  assertEquals(timeline.map((entry) => entry.kind), [
    "anon_session_started",
    "vote_cast",
    "first_seen",
  ]);
  assertEquals(timeline[1].wasAnonymous, true);
  assertEquals(timeline[1].detail, "More bike lanes");
  assertEquals(timeline[1].roomTopic, "Bike lanes");
  assertEquals(timeline[2].wasAnonymous, false);
});

Deno.test("buildUserTimeline - splits an in-place anonymous upgrade into session start and account creation", () => {
  const user = makeUser({ createdAt: ANON_CREATED, upgradedFromAnonymousAt: ACCOUNT_CREATED });
  const votes: Vote[] = [
    { id: "vote-1", statementId: statement.id, userId: user.id, voteType: "agree", timestamp: ANON_CREATED + 1000 },
    { id: "vote-2", statementId: statement.id, userId: user.id, voteType: "pass", timestamp: ACCOUNT_CREATED + 1000 },
  ];

  const timeline = buildUserTimeline({ ...emptySources, user, anonymousUsers: [], votes });

  assertEquals(timeline.map((entry) => [entry.kind, entry.wasAnonymous]), [
    ["anon_session_started", true],
    ["vote_cast", true],
    ["account_created", false],
    ["vote_cast", false],
  ]);
});

Deno.test("buildUserTimeline - attributes tracked events by the acting user id", () => {
  const user = makeUser({});
  const anonUser = makeUser({ id: "anon-1", isAnonymous: true, createdAt: ANON_CREATED });
  const events = [
    { type: "initial_load", userId: anonUser.id, createdAt: new Date(ANON_CREATED + 5).toISOString() },
    { type: "room_opened", userId: user.id, roomId: room.id, createdAt: new Date(ACCOUNT_CREATED + 5).toISOString() },
  ] as unknown as UserEvent[];

  const timeline = buildUserTimeline({
    ...emptySources,
    user,
    anonymousUsers: [anonUser],
    events,
  });

  const trackedEvents = timeline.filter((entry) => entry.kind === "tracked_event");
  assertEquals(trackedEvents.map((entry) => [entry.label, entry.wasAnonymous]), [
    ["initial_load", true],
    ["room_opened", false],
  ]);
  assertEquals(trackedEvents[1].roomTopic, "Bike lanes");
});

Deno.test("buildUserTimeline - drops entries without a valid timestamp", () => {
  const user = makeUser({ createdAt: undefined as unknown as number });

  const timeline = buildUserTimeline({ ...emptySources, user, anonymousUsers: [] });

  assertEquals(timeline, []);
});

Deno.test("buildUserTimeline - includes sent emails such as the welcome email", () => {
  const user = makeUser({});
  const emails: SentEmail[] = [
    { id: "email-1", userId: user.id, emailType: "welcome", sentAt: ACCOUNT_CREATED + 1000 },
  ];

  const timeline = buildUserTimeline({ ...emptySources, user, anonymousUsers: [], emails });

  assertEquals(timeline.map((entry) => [entry.kind, entry.label]), [
    ["first_seen", "First seen"],
    ["email_sent", "Email sent: welcome"],
  ]);
});
