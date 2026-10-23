import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { defaultLiveEventState, PRESENCE_WINDOW_MS } from "./live-event-utils.ts";
import {
  ACTIVE_WINDOW_MS,
  buildSupportViewStats,
  countPhones,
  describeCurrentPost,
  type EventVote,
  listAttendeeStatements,
  listMinutes,
  listNextPressedAtMinutes,
  listPostsSoFar,
  sumSecondsOnEachPost,
} from "./support-view-utils.ts";
import type { EventPresence, LiveEventState, Statement } from "./types.tsx";

const STARTED_AT = 1_761_000_000_000;
const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const at = (minutes: number, seconds = 0) => STARTED_AT + minutes * MINUTE_MS + seconds * SECOND_MS;

const liveState = (overrides: Partial<LiveEventState> = {}): LiveEventState => ({
  ...defaultLiveEventState(STARTED_AT),
  roomOrder: ["a", "b", "c"],
  currentIndex: 1,
  status: "live",
  postChanges: [{ roomId: "a", changedAt: at(0) }, { roomId: "b", changedAt: at(5) }],
  startedAt: STARTED_AT,
  ...overrides,
});

const presence = (userId: string, overrides: Partial<EventPresence> = {}): EventPresence => ({
  userId,
  shownRoomId: "b",
  screen: "swiping",
  updatedAt: at(6),
  ...overrides,
});

const vote = (userId: string, roomId: string, timestamp: number, voteType: EventVote["voteType"] = "agree"): EventVote => ({
  userId,
  roomId,
  timestamp,
  voteType,
});

const statement = (id: string, roomId: string, timestamp: number, overrides: Partial<Statement> = {}): Statement => ({
  id,
  text: id,
  author: "someone",
  agrees: 0,
  disagrees: 0,
  passes: 0,
  superAgrees: 0,
  roomId,
  timestamp,
  round: 1,
  voters: {},
  ...overrides,
});

Deno.test("countPhones - idle after 30s without a heartbeat, gone after the presence window", () => {
  const now = at(10);
  const counts = countPhones([
    presence("swiping", { updatedAt: now }),
    presence("waiting", { screen: "waiting", updatedAt: now - ACTIVE_WINDOW_MS }),
    presence("idle", { updatedAt: now - ACTIVE_WINDOW_MS - 1 }),
    presence("gone", { updatedAt: now - PRESENCE_WINDOW_MS - 1 }),
  ], now);
  assertEquals(counts, {
    peopleHere: 3,
    activeNow: 2,
    phoneCountsByState: { swiping: 1, waiting: 1, lobby: 0, end: 0, idle: 1 },
  });
});

Deno.test("sumSecondsOnEachPost - adds every stretch on a post, the last running to the session end", () => {
  const postChanges = [
    { roomId: "a", changedAt: at(0) },
    { roomId: "b", changedAt: at(2) },
    { roomId: "a", changedAt: at(3) },
  ];
  assertEquals(sumSecondsOnEachPost(postChanges, at(4)), { a: 180, b: 60 });
});

Deno.test("listPostsSoFar - only reached posts, in session order, with distinct voters", () => {
  const votes = [vote("u1", "a", at(1)), vote("u1", "a", at(2)), vote("u2", "a", at(2)), vote("u1", "b", at(6))];
  assertEquals(listPostsSoFar(liveState(), votes, at(7)), [
    { roomId: "a", postNumber: 1, voterCount: 2, secondsOnPost: 300 },
    { roomId: "b", postNumber: 2, voterCount: 1, secondsOnPost: 120 },
  ]);
});

Deno.test("listMinutes - votes per minute and people joined by their first vote", () => {
  const votes = [vote("u1", "a", at(0, 10)), vote("u2", "a", at(1, 5)), vote("u1", "a", at(1, 20))];
  assertEquals(listMinutes(votes, STARTED_AT, at(2, 30)), [
    { minuteSinceStart: 0, votes: 1, peopleJoined: 1 },
    { minuteSinceStart: 1, votes: 2, peopleJoined: 2 },
    { minuteSinceStart: 2, votes: 0, peopleJoined: 2 },
  ]);
});

Deno.test("listMinutes - nothing before Start", () => {
  assertEquals(listMinutes([], null, at(3)), []);
});

Deno.test("listNextPressedAtMinutes - every post change after the first, in minutes since Start", () => {
  assertEquals(listNextPressedAtMinutes(liveState()), [5]);
  assertEquals(listNextPressedAtMinutes(liveState({ startedAt: null })), []);
});

Deno.test("describeCurrentPost - finished and swiping phones, the post's vote mix, median time to finish", () => {
  const presences = [
    presence("fast", { screen: "waiting" }),
    presence("slow", { screen: "waiting" }),
    presence("still", { screen: "swiping" }),
    presence("earlier-post", { screen: "waiting", shownRoomId: "a" }),
  ];
  const votes = [
    vote("fast", "b", at(5, 40), "super_agree"),
    vote("slow", "b", at(5, 30), "disagree"),
    vote("slow", "b", at(6, 20), "pass"),
    vote("still", "b", at(5, 50)),
    vote("fast", "a", at(4)),
  ];
  assertEquals(
    describeCurrentPost({ state: liveState(), rooms: [{ id: "b", topic: "Post B" }], presences, now: at(6, 30) }, votes),
    {
      postNumber: 2,
      topic: "Post B",
      finishedCount: 2,
      swipingCount: 1,
      agreeVotes: 2,
      disagreeVotes: 1,
      passVotes: 1,
      medianSecondsToFinish: 60,
      startedAt: at(5),
    },
  );
});

Deno.test("describeCurrentPost - none unless live", () => {
  const sources = { rooms: [], presences: [], now: at(6) };
  assertEquals(describeCurrentPost({ ...sources, state: liveState({ status: "ended" }) }, []), null);
  assertEquals(describeCurrentPost({ ...sources, state: defaultLiveEventState(STARTED_AT) }, []), null);
});

Deno.test("listAttendeeStatements - written since Start on the event's posts, hidden ones included", () => {
  const statements = [
    statement("seed", "a", STARTED_AT - 1),
    statement("from-room", "b", at(5), { agrees: 3, superAgrees: 1, disagrees: 2, passes: 1 }),
    statement("hidden", "a", at(2), { isHidden: true }),
    statement("other-post", "z", at(3)),
  ];
  assertEquals(listAttendeeStatements(liveState(), statements), [
    {
      id: "from-room",
      roomId: "b",
      postNumber: 2,
      text: "from-room",
      agreeVotes: 4,
      disagreeVotes: 2,
      passVotes: 1,
      isHidden: false,
      createdAt: at(5),
    },
    {
      id: "hidden",
      roomId: "a",
      postNumber: 1,
      text: "hidden",
      agreeVotes: 0,
      disagreeVotes: 0,
      passVotes: 0,
      isHidden: true,
      createdAt: at(2),
    },
  ]);
});

Deno.test("buildSupportViewStats - session totals skip votes from before Start and hidden statements", () => {
  const stats = buildSupportViewStats({
    eventName: "PRGN",
    state: liveState({ endedAt: null }),
    rooms: [{ id: "b", topic: "Post B" }],
    presences: [presence("u1", { updatedAt: at(6) })],
    statements: [statement("kept", "b", at(5)), statement("hidden", "b", at(5), { isHidden: true })],
    votes: [vote("u1", "a", STARTED_AT - 1), vote("u1", "b", at(5, 10))],
    now: at(6),
  });
  assertEquals(stats.votes, 1);
  assertEquals(stats.statementsFromRoom, 1);
  assertEquals(stats.attendeeStatements.length, 2);
  assertEquals(stats.postCount, 3);
  assertEquals(stats.minutes.length, 7);
});

Deno.test("buildSupportViewStats - after End, time stops at the end", () => {
  const stats = buildSupportViewStats({
    eventName: "PRGN",
    state: liveState({ status: "ended", endedAt: at(8) }),
    rooms: [],
    presences: [],
    statements: [],
    votes: [],
    now: at(30),
  });
  assertEquals(stats.currentPost, null);
  assertEquals(stats.minutes.length, 9);
  assertEquals(stats.postsSoFar.map((post) => post.secondsOnPost), [300, 180]);
});
