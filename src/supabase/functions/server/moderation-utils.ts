import type { Statement } from "./types.tsx";

export const markStatementHidden = (
  statement: Statement,
  hiddenBy: string,
  now: number = Date.now(),
): Statement => ({
  ...statement,
  isHidden: true,
  hiddenAt: now,
  hiddenBy,
});

export const markStatementVisible = (
  statement: Statement,
): Statement => ({
  ...statement,
  isHidden: false,
  hiddenAt: null,
  hiddenBy: null,
});
