import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { APP_FEEDBACK_STATEMENT_KEYS } from "./feedback-utils.ts";
import {
  buildAppFeedbackResults,
  type FeedbackCardNote,
  isFeedbackCardNote,
  isFounderChatOptIn,
} from "./feedback-results-utils.ts";
import type { AppFeedbackVote } from "./types.tsx";

const NOW = 1_761_000_000_000;

const vote = (userId: string, statementKey: string, v: AppFeedbackVote["vote"], votedAt = NOW): AppFeedbackVote => ({
  userId,
  statementKey,
  vote: v,
  roomId: "room-1",
  votedAt,
});

const note = (id: string, userId: string, createdAt: string): FeedbackCardNote => ({
  id,
  userId,
  statementKey: "ui_confusing",
  roomId: "room-1",
  text: "hard to find the create button",
  createdAt,
});

const emptyInputs = {
  votes: [],
  notes: [],
  emailsByUserId: new Map<string, string | null>(),
  shownUserIds: new Set<string>(),
  developerIds: new Set<string>(),
};

Deno.test("isFounderChatOptIn - agree and super agree on founder chat only", () => {
  assertEquals(isFounderChatOptIn(vote("u1", "founder_chat", "agree")), true);
  assertEquals(isFounderChatOptIn(vote("u1", "founder_chat", "super_agree")), true);
  assertEquals(isFounderChatOptIn(vote("u1", "founder_chat", "disagree")), false);
  assertEquals(isFounderChatOptIn(vote("u1", "enjoying", "agree")), false);
});

Deno.test("buildAppFeedbackResults - no data gives zeroed rows for every statement", () => {
  const results = buildAppFeedbackResults(emptyInputs);
  assertEquals(results.statements.length, APP_FEEDBACK_STATEMENT_KEYS.length);
  assertEquals(results.statements.every((s) => s.total === 0), true);
  assertEquals(results.founderOptIns, []);
  assertEquals(results.usersShown, 0);
});

Deno.test("buildAppFeedbackResults - counts each vote type per statement", () => {
  const results = buildAppFeedbackResults({
    ...emptyInputs,
    votes: [
      vote("u1", "ui_confusing", "agree"),
      vote("u2", "ui_confusing", "disagree"),
      vote("u3", "ui_confusing", "super_agree"),
      vote("u4", "ui_confusing", "pass"),
    ],
  });
  assertEquals(results.statements.find((s) => s.statementKey === "ui_confusing"), {
    statementKey: "ui_confusing",
    agree: 1,
    superAgree: 1,
    disagree: 1,
    pass: 1,
    total: 4,
  });
});

Deno.test("buildAppFeedbackResults - founder opt-ins carry email, newest first", () => {
  const results = buildAppFeedbackResults({
    ...emptyInputs,
    votes: [
      vote("u1", "founder_chat", "agree", NOW - 1000),
      vote("u2", "founder_chat", "super_agree", NOW),
      vote("u3", "founder_chat", "disagree", NOW),
    ],
    emailsByUserId: new Map([["u1", "a@example.com"], ["u2", null]]),
  });
  assertEquals(results.founderOptIns, [
    { userId: "u2", email: null, votedAt: NOW },
    { userId: "u1", email: "a@example.com", votedAt: NOW - 1000 },
  ]);
});

Deno.test("buildAppFeedbackResults - excludes developers everywhere", () => {
  const results = buildAppFeedbackResults({
    ...emptyInputs,
    votes: [vote("dev", "founder_chat", "agree"), vote("u1", "enjoying", "agree")],
    notes: [note("n1", "dev", "2026-10-21T10:00:00Z")],
    shownUserIds: new Set(["dev", "u1", "u2"]),
    developerIds: new Set(["dev"]),
  });
  assertEquals(results.founderOptIns, []);
  assertEquals(results.notes, []);
  assertEquals(results.usersShown, 2);
  assertEquals(results.usersVoted, 1);
});

Deno.test("buildAppFeedbackResults - notes newest first, unique note writers counted", () => {
  const results = buildAppFeedbackResults({
    ...emptyInputs,
    notes: [
      note("n1", "u1", "2026-10-21T10:00:00Z"),
      note("n2", "u1", "2026-10-22T10:00:00Z"),
      note("n3", "u2", "2026-10-21T12:00:00Z"),
    ],
  });
  assertEquals(results.notes.map((n) => n.id), ["n2", "n3", "n1"]);
  assertEquals(results.usersWithNote, 2);
});

Deno.test("isFeedbackCardNote - only notes from feedback cards", () => {
  assertEquals(isFeedbackCardNote({ ...note("n1", "u1", "2026-10-21T10:00:00Z"), source: "feedback_card" }), true);
  assertEquals(isFeedbackCardNote({ id: "f1", userId: "u1", text: "side panel feedback" }), false);
});
