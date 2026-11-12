import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { listStatementsForApproval } from "./event-approval-utils.ts";
import { STATEMENT_APPROVAL_HIDER } from "./moderation-utils.ts";
import type { Statement } from "./types.tsx";

const STARTED_AT = 1_761_000_000_000;

const statement = (
  id: string,
  roomId: string,
  overrides: Partial<Statement> = {},
): Statement => ({
  id,
  text: id,
  author: "author",
  agrees: 0,
  disagrees: 0,
  passes: 0,
  superAgrees: 0,
  roomId,
  timestamp: STARTED_AT + 1000,
  round: 1,
  voters: {},
  ...overrides,
});

Deno.test("listStatementsForApproval - every event statement since Start, marked waiting or not", () => {
  const state = { roomOrder: ["a", "b"], startedAt: STARTED_AT };
  const listed = listStatementsForApproval(state, [
    [
      statement("waiting", "a", {
        isHidden: true,
        hiddenBy: STATEMENT_APPROVAL_HIDER,
      }),
      statement("seed", "a", { timestamp: STARTED_AT - 1 }),
    ],
    [
      statement("approved", "b"),
      statement("from-feed", "b", { source: "feed" }),
    ],
  ]);
  assertEquals(
    listed.map(({ id, isAwaitingApproval }) => ({ id, isAwaitingApproval })),
    [
      { id: "waiting", isAwaitingApproval: true },
      { id: "approved", isAwaitingApproval: false },
    ],
  );
});
