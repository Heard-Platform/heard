import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it } from "@std/testing/bdd";
import type { Statement } from "./types.tsx";
import {
  isStatementAwaitingApproval,
  markStatementAwaitingApproval,
  markStatementHidden,
} from "./moderation-utils.ts";
import {
  applyApprovalDecision,
  buildStatementApprovalPageUrl,
  groupStatementsByRoom,
  isStatementApprovalDecision,
} from "./statement-approval-utils.ts";

const makeStatement = (): Statement => ({
  id: "statement1",
  text: "A statement",
  author: "user1",
  roomId: "room1",
  round: 1,
  timestamp: 0,
  agrees: 0,
  disagrees: 0,
  passes: 0,
  superAgrees: 0,
  voters: {},
});

const makeAwaitingStatement = (): Statement =>
  markStatementAwaitingApproval(makeStatement(), 100);

describe("isStatementAwaitingApproval", () => {
  it("is true only when hidden by the approval queue", () => {
    assertEquals(
      isStatementAwaitingApproval(makeAwaitingStatement()),
      true,
    );
    assertEquals(isStatementAwaitingApproval(makeStatement()), false);
    assertEquals(
      isStatementAwaitingApproval(
        markStatementHidden(makeStatement(), "host1"),
      ),
      false,
    );
  });
});

describe("applyApprovalDecision", () => {
  it("shows the statement on approve", () => {
    const statement = applyApprovalDecision(
      makeAwaitingStatement(),
      "approve",
      "dev1",
    );
    assertEquals(statement.isHidden, false);
    assertEquals(statement.hiddenBy, null);
  });

  it("keeps it hidden by the developer on reject", () => {
    const statement = applyApprovalDecision(
      makeAwaitingStatement(),
      "reject",
      "dev1",
      200,
    );
    assertEquals(statement.isHidden, true);
    assertEquals(statement.hiddenBy, "dev1");
    assertEquals(statement.hiddenAt, 200);
    assertEquals(isStatementAwaitingApproval(statement), false);
  });
});

describe("isStatementApprovalDecision", () => {
  it("accepts approve and reject only", () => {
    assertEquals(isStatementApprovalDecision("approve"), true);
    assertEquals(isStatementApprovalDecision("reject"), true);
    assertEquals(isStatementApprovalDecision("delete"), false);
  });
});

describe("groupStatementsByRoom", () => {
  it("groups statements under their room, keeping order", () => {
    const first = { ...makeStatement(), id: "s1", roomId: "roomA" };
    const second = { ...makeStatement(), id: "s2", roomId: "roomB" };
    const third = { ...makeStatement(), id: "s3", roomId: "roomA" };
    const grouped = groupStatementsByRoom([first, second, third]);
    assertEquals(
      grouped.get("roomA")?.map((statement) => statement.id),
      ["s1", "s3"],
    );
    assertEquals(
      grouped.get("roomB")?.map((statement) => statement.id),
      ["s2"],
    );
  });
});

describe("buildStatementApprovalPageUrl", () => {
  it("points at the approval page", () => {
    const url = new URL(buildStatementApprovalPageUrl());
    assertEquals(url.pathname, "/statement-approval");
  });
});
