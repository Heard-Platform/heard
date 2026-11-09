import type { Statement } from "./types.tsx";

export const STATEMENT_APPROVAL_HIDER = "statement-approval";

export const markStatementHidden = (
  statement: Statement,
  hiddenBy: string,
  now: number = Date.now(),
): Statement => ({
  ...statement,
  hiddenBy,
  isHidden: true,
  hiddenAt: now,
});

export const markStatementVisible = (
  statement: Statement,
): Statement => ({
  ...statement,
  isHidden: false,
  hiddenAt: null,
  hiddenBy: null,
});

export const markStatementAwaitingApproval = (
  statement: Statement,
  now: number = Date.now(),
): Statement =>
  markStatementHidden(statement, STATEMENT_APPROVAL_HIDER, now);

export const isStatementAwaitingApproval = (
  statement: Statement,
): boolean =>
  !!statement.isHidden &&
  statement.hiddenBy === STATEMENT_APPROVAL_HIDER;
