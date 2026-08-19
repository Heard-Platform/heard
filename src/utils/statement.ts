import type { Statement } from "../types";

export const getAllAgrees = (statement: Statement): number =>
  statement.agrees + statement.superAgrees;
