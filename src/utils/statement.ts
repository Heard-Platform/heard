import type { Statement } from "../types";

export const getAllAgrees = (statement: Statement): number =>
  statement.agrees + statement.superAgrees;

export const getDecisiveVotes = (statement: Statement): number =>
  getAllAgrees(statement) + statement.disagrees;
