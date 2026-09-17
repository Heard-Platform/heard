import type { Statement } from "../types";

export const getTotalVotes = (statement: Statement): number =>
  (statement.agrees ?? 0) +
  (statement.disagrees ?? 0) +
  (statement.passes ?? 0) +
  (statement.superAgrees ?? 0);

export const getRoomVoteCount = (statements: Statement[]): number =>
  statements.reduce((total, s) => total + getTotalVotes(s), 0);
