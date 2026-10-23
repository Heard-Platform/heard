import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { formatProgressLine, formatSimulationReport, type SimulationResults } from "./simulation-report.ts";

const results = (overrides: Partial<SimulationResults>): SimulationResults => ({
  attendeeCount: 70,
  joinFailureCount: 0,
  records: [{ routeName: "GET /event/:id/live", status: 200, durationMs: 120, finishedAt: 0 }],
  stateChanges: [{
    label: "Start",
    changedAt: 0,
    phonesThatSawIt: 70,
    medianSecondsToSee: 1.5,
    ninetyFifthPercentileSecondsToSee: 2.9,
    slowestSecondsToSee: 3.4,
  }],
  totalVotesSent: 400,
  undercountedVotes: [],
  voteCheckError: null,
  ...overrides,
});

Deno.test("formatProgressLine shows the last window's load", () => {
  assertEquals(
    formatProgressLine({
      elapsedMs: 75_000,
      joinedCount: 60,
      attendeeCount: 70,
      peopleHere: 58,
      recentRecords: [
        { routeName: "GET /event/:id/live", status: 200, durationMs: 100, finishedAt: 0 },
        { routeName: "GET /event/:id/live", status: 500, durationMs: 300, finishedAt: 0 },
      ],
    }),
    "1:15  |  joined 60/70  |  here 58  |  0.2 req/s  |  p95 300ms  |  errors 1",
  );
});

Deno.test("formatSimulationReport says when every vote is counted", () => {
  const report = formatSimulationReport(results({}));
  assertStringIncludes(report, "All 400 accepted votes are counted on the server.");
  assertStringIncludes(report, "No failed requests.");
  assertStringIncludes(report, "1.5s / 2.9s / 3.4s");
});

Deno.test("formatSimulationReport lists missing votes", () => {
  const report = formatSimulationReport(results({
    undercountedVotes: [{ statementText: "Three tiers.", vote: "agree", votesSent: 12, votesCounted: 9 }],
  }));
  assertStringIncludes(report, "3 of 400 accepted votes are missing");
  assertStringIncludes(report, `sent 12, counted 9  "Three tiers."`);
});

Deno.test("formatSimulationReport explains a vote check that couldn't run", () => {
  assertStringIncludes(
    formatSimulationReport(results({ voteCheckError: "the event never started" })),
    "Couldn't check: the event never started",
  );
});
