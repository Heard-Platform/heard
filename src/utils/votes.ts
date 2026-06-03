import type { Statement } from "../types";

export const getTotalVotes = (statement: Statement): number =>
  (statement.agrees ?? 0) +
  (statement.disagrees ?? 0) +
  (statement.passes ?? 0) +
  (statement.superAgrees ?? 0);
