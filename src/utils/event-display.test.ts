import { describe, expect, it } from "vitest";
import type { Statement } from "../types";
import {
  findMostSplitStatementId,
  getLatestAttendeeStatement,
  getNewStatementStripMode,
  getVoteShares,
  pickBoardStatements,
  sortByAgreeShare,
  splitIntoConsensusColumns,
  NEW_STATEMENT_CELEBRATE_MS,
  NEW_STATEMENT_INVITE_AFTER_MS,
} from "./event-display";

const STARTED_AT = 1_000;

const statement = (
  id: string,
  votes: { agrees?: number; disagrees?: number; passes?: number; superAgrees?: number } = {},
  overrides: Partial<Statement> = {},
): Statement => ({
  id,
  text: id,
  author: "host",
  agrees: votes.agrees ?? 0,
  disagrees: votes.disagrees ?? 0,
  passes: votes.passes ?? 0,
  superAgrees: votes.superAgrees ?? 0,
  roomId: "room",
  timestamp: 0,
  round: 1,
  voters: {},
  ...overrides,
});

const attendeeStatement = (id: string, votes: Parameters<typeof statement>[1], timestamp = STARTED_AT + 1) =>
  statement(id, votes, { timestamp });

const statementIds = (statements: Statement[]) => statements.map((statement) => statement.id);

describe("getVoteShares", () => {
  it("counts super agrees as agrees", () => {
    expect(getVoteShares(statement("a", { agrees: 1, superAgrees: 1, disagrees: 1, passes: 1 }))).toEqual({
      agree: 50,
      disagree: 25,
      pass: 25,
      total: 4,
    });
  });

  it("returns zero shares when nobody has voted", () => {
    expect(getVoteShares(statement("a"))).toEqual({ agree: 0, disagree: 0, pass: 0, total: 0 });
  });
});

describe("pickBoardStatements", () => {
  it("keeps every statement written before Start", () => {
    const seedStatements = [statement("a"), statement("b")];
    expect(statementIds(pickBoardStatements(seedStatements, STARTED_AT))).toEqual(["a", "b"]);
  });

  it("adds an attendee statement once it has 5 votes", () => {
    const boardStatements = pickBoardStatements(
      [statement("seed"), attendeeStatement("four", { agrees: 4 }), attendeeStatement("five", { agrees: 3, passes: 2 })],
      STARTED_AT,
    );
    expect(statementIds(boardStatements)).toEqual(["seed", "five"]);
  });

  it("holds at most 2 attendee statements, the ones with the most votes", () => {
    const boardStatements = pickBoardStatements(
      [attendeeStatement("six", { agrees: 6 }), attendeeStatement("nine", { agrees: 9 }), attendeeStatement("seven", { disagrees: 7 })],
      STARTED_AT,
    );
    expect(statementIds(boardStatements)).toEqual(["nine", "seven"]);
  });

  it("caps the board at 7, dropping the statements from before Start with the fewest votes", () => {
    const seedStatements = Array.from({ length: 7 }, (_, seedNumber) =>
      statement(`seed${seedNumber}`, { agrees: 10 + seedNumber }),
    );
    const boardStatements = pickBoardStatements(
      [...seedStatements, attendeeStatement("attendee1", { agrees: 6 }), attendeeStatement("attendee2", { agrees: 5 })],
      STARTED_AT,
    );
    expect(statementIds(boardStatements)).toEqual(["seed2", "seed3", "seed4", "seed5", "seed6", "attendee1", "attendee2"]);
  });

  it("drops hidden statements", () => {
    const boardStatements = pickBoardStatements([statement("seed", {}, { isHidden: true }), statement("kept")], STARTED_AT);
    expect(statementIds(boardStatements)).toEqual(["kept"]);
  });

  it("treats every statement as a seed before Start", () => {
    expect(statementIds(pickBoardStatements([attendeeStatement("late", {})], null))).toEqual(["late"]);
  });
});

describe("sortByAgreeShare", () => {
  it("orders statements by agree share, highest first", () => {
    const sorted = sortByAgreeShare([
      statement("low", { agrees: 1, disagrees: 3 }),
      statement("high", { agrees: 3, disagrees: 1 }),
      statement("none"),
    ]);
    expect(statementIds(sorted)).toEqual(["high", "low", "none"]);
  });
});

describe("findMostSplitStatementId", () => {
  it("picks the statement with the smallest gap between agree and disagree", () => {
    const mostSplitStatementId = findMostSplitStatementId([
      statement("clear", { agrees: 9, disagrees: 1 }),
      statement("close", { agrees: 5, disagrees: 4 }),
    ]);
    expect(mostSplitStatementId).toBe("close");
  });

  it("breaks a tie with the statement that has more votes", () => {
    const mostSplitStatementId = findMostSplitStatementId([
      statement("small", { agrees: 1, disagrees: 1 }),
      statement("big", { agrees: 5, disagrees: 5 }),
    ]);
    expect(mostSplitStatementId).toBe("big");
  });

  it("ignores statements nobody has voted on", () => {
    expect(findMostSplitStatementId([statement("none"), statement("voted", { agrees: 3 })])).toBe("voted");
    expect(findMostSplitStatementId([statement("none")])).toBeNull();
  });
});

describe("splitIntoConsensusColumns", () => {
  it("puts the widest gaps under agrees and the most split under splits, most split first", () => {
    const columns = splitIntoConsensusColumns([
      statement("agree", { agrees: 9, disagrees: 1 }),
      statement("disagree", { agrees: 2, disagrees: 8 }),
      statement("close", { agrees: 5, disagrees: 4 }),
      statement("even", { agrees: 5, disagrees: 5 }),
    ]);
    expect(statementIds(columns.agreeStatements)).toEqual(["agree", "disagree"]);
    expect(statementIds(columns.splitStatements)).toEqual(["even", "close"]);
  });

  it("never shows a statement in both columns or more than 4 in either", () => {
    const statements = Array.from({ length: 10 }, (_, i) => statement(`s${i}`, { agrees: i, disagrees: 9 - i }));
    const columns = splitIntoConsensusColumns(statements);
    expect(columns.agreeStatements).toHaveLength(4);
    expect(columns.splitStatements).toHaveLength(4);
    expect(statementIds(columns.agreeStatements).filter((id) => statementIds(columns.splitStatements).includes(id))).toEqual([]);
  });

  it("gives the agree column the extra row when the count is odd", () => {
    const columns = splitIntoConsensusColumns([statement("a"), statement("b"), statement("c")]);
    expect(columns.agreeStatements).toHaveLength(2);
    expect(columns.splitStatements).toHaveLength(1);
  });
});

describe("getLatestAttendeeStatement", () => {
  it("returns the newest visible statement written since Start", () => {
    const latestAttendeeStatement = getLatestAttendeeStatement(
      [
        statement("seed"),
        attendeeStatement("older", {}, STARTED_AT + 5),
        attendeeStatement("newer", {}, STARTED_AT + 10),
        statement("hidden", {}, { timestamp: STARTED_AT + 20, isHidden: true }),
      ],
      STARTED_AT,
    );
    expect(latestAttendeeStatement?.id).toBe("newer");
  });

  it("returns null when no attendee has written one", () => {
    expect(getLatestAttendeeStatement([statement("seed")], STARTED_AT)).toBeNull();
  });
});

describe("getNewStatementStripMode", () => {
  const latestAttendeeStatement = attendeeStatement("new", {}, 100_000);

  it("is empty with no attendee statements", () => {
    expect(getNewStatementStripMode(null, false, 0)).toBe("empty");
  });

  it("celebrates for the first 15s", () => {
    expect(getNewStatementStripMode(latestAttendeeStatement, true, 100_000 + NEW_STATEMENT_CELEBRATE_MS - 1)).toBe("celebrating");
    expect(getNewStatementStripMode(latestAttendeeStatement, false, 100_000 + NEW_STATEMENT_CELEBRATE_MS)).toBe("collecting-votes");
  });

  it("invites the room once the statement is on the board and 45s have passed", () => {
    expect(getNewStatementStripMode(latestAttendeeStatement, true, 100_000 + NEW_STATEMENT_INVITE_AFTER_MS)).toBe("invite");
    expect(getNewStatementStripMode(latestAttendeeStatement, true, 100_000 + NEW_STATEMENT_INVITE_AFTER_MS - 1)).toBe("collecting-votes");
  });

  it("keeps showing a statement that hasn't reached the board", () => {
    expect(getNewStatementStripMode(latestAttendeeStatement, false, 100_000 + NEW_STATEMENT_INVITE_AFTER_MS * 10)).toBe("collecting-votes");
  });
});
