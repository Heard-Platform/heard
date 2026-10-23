import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import type { Statement } from "../../src/types/index.ts";
import type { ApiCallRecord } from "../shared/heard-api-client.ts";
import {
  countFailures,
  labelStateChange,
  type ObservedEventState,
  percentile,
  StateChangeTracker,
  summarizeApiCalls,
  VoteLedger,
} from "./simulation-measurements.ts";

const call = (routeName: string, status: number | null, durationMs: number): ApiCallRecord => ({
  routeName,
  status,
  durationMs,
  finishedAt: 0,
});

const eventState = (overrides: Partial<ObservedEventState>): ObservedEventState => ({
  status: "live",
  currentIndex: 0,
  votingPaused: false,
  reloadNonce: 0,
  updatedAt: 1000,
  ...overrides,
});

Deno.test("percentile uses the nearest rank", () => {
  assertEquals(percentile([], 0.5), 0);
  assertEquals(percentile([5, 1, 3, 2, 4], 0.5), 3);
  assertEquals(percentile(Array.from({ length: 100 }, (_, index) => index + 1), 0.95), 95);
});

Deno.test("summarizeApiCalls groups by route, busiest first", () => {
  const summaries = summarizeApiCalls([
    call("GET /room/:id", 200, 100),
    call("GET /event/:id/live", 200, 50),
    call("GET /event/:id/live", 500, 300),
    call("GET /event/:id/live", null, 20),
  ]);
  assertEquals(summaries.map((summary) => [summary.routeName, summary.callCount, summary.failedCount]), [
    ["GET /event/:id/live", 3, 2],
    ["GET /room/:id", 1, 0],
  ]);
  assertEquals(summaries[0].slowestMs, 300);
});

Deno.test("countFailures groups by route and status, with no response named", () => {
  assertEquals(
    countFailures([
      call("POST /statement/:id/vote", 423, 10),
      call("POST /statement/:id/vote", 423, 10),
      call("GET /event/:id/live", null, 10),
      call("GET /event/:id/live", 200, 10),
    ]),
    [
      { routeName: "POST /statement/:id/vote", statusLabel: "423", count: 2 },
      { routeName: "GET /event/:id/live", statusLabel: "no response", count: 1 },
    ],
  );
});

Deno.test("labelStateChange names each moderator action", () => {
  const live = eventState({});
  assertEquals(labelStateChange(null, eventState({ status: "setup" })), "Waiting to start");
  assertEquals(labelStateChange(eventState({ status: "setup" }), live), "Start");
  assertEquals(labelStateChange(live, eventState({ currentIndex: 1 })), "Post 2");
  assertEquals(labelStateChange(live, eventState({ votingPaused: true })), "Pause");
  assertEquals(labelStateChange(eventState({ votingPaused: true }), live), "Resume");
  assertEquals(labelStateChange(live, eventState({ reloadNonce: 1 })), "Reload all phones");
  assertEquals(labelStateChange(live, eventState({ status: "ended" })), "End");
});

Deno.test("StateChangeTracker times each change but not a phone's first look", () => {
  const tracker = new StateChangeTracker();
  const started = eventState({ updatedAt: 10_000 });
  const secondPost = eventState({ currentIndex: 1, updatedAt: 20_000 });
  tracker.recordObservation(started, 11_000, false);
  tracker.recordObservation(started, 13_000, false);
  tracker.recordObservation(started, 30_000, true);
  tracker.recordObservation(secondPost, 22_000, false);

  const summaries = tracker.summarize();
  assertEquals(summaries.map((summary) => summary.label), ["Start", "Post 2"]);
  assertEquals(summaries[0].phonesThatSawIt, 2);
  assertEquals(summaries[0].medianSecondsToSee, 1);
  assertEquals(summaries[0].slowestSecondsToSee, 3);
  assertEquals(summaries[1].medianSecondsToSee, 2);
});

Deno.test("VoteLedger finds votes the server undercounts", () => {
  const ledger = new VoteLedger();
  ledger.recordVoteCounted("a", "agree");
  ledger.recordVoteCounted("a", "agree");
  ledger.recordVoteCounted("a", "pass");
  ledger.recordVoteCounted("b", "disagree");
  const serverStatements = [
    { id: "a", text: "A", agrees: 1, disagrees: 0, passes: 3 },
    { id: "b", text: "B", agrees: 4, disagrees: 1, passes: 0 },
    { id: "c", text: "C", agrees: 0, disagrees: 0, passes: 0 },
  ] as Statement[];

  assertEquals(ledger.totalVotesSent, 4);
  assertEquals(ledger.findUndercountedVotes(serverStatements), [
    { statementText: "A", vote: "agree", votesSent: 2, votesCounted: 1 },
  ]);
});
