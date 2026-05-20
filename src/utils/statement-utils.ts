import type { Statement, VoteType } from "../types";

export const sortWithIdTieBreaker =
  <T extends { id: string }>(sortFn: (a: T, b: T) => number) =>
  (a: T, b: T): number =>
    sortFn(a, b) || a.id.localeCompare(b.id);

export function mergeStatements(
  existing: Statement[] | undefined,
  incoming: Statement[],
): Statement[] {
  if (!existing || existing.length === 0) return incoming;

  const incomingById = new Map(incoming.map((s) => [s.id, s]));
  const preserved: Statement[] = [];
  for (const s of existing) {
    const updated = incomingById.get(s.id);
    if (updated) preserved.push(updated);
  }

  const preservedIds = new Set(preserved.map((s) => s.id));
  const appended = incoming.filter((s) => !preservedIds.has(s.id));

  return [...preserved, ...appended];
}

const decisiveVoteCount = (s: Statement) =>
  s.agrees + s.superAgrees + s.disagrees;

/** Sort statements by decisive vote count (agrees + super-agrees + disagrees), descending. */
export function sortStatementsByDecisive(statements: Statement[]): Statement[] {
  return [...statements].sort(
    sortWithIdTieBreaker((a, b) => decisiveVoteCount(b) - decisiveVoteCount(a)),
  );
}

/** Sort statements by net agreement (agrees minus disagrees), descending. */
export function sortStatementsByNetAgreement(
  statements: Statement[],
): Statement[] {
  return [...statements].sort(
    sortWithIdTieBreaker(
      (a, b) => b.agrees - b.disagrees - (a.agrees - a.disagrees),
    ),
  );
}

const countVotesOfType = (statement: Statement, vote: VoteType): number => {
  if (!statement.voters) return 0;
  let count = 0;
  for (const v of Object.values(statement.voters)) {
    if (v === vote) count++;
  }
  return count;
};

export function sortStatementsByVoteType(
  statements: Statement[],
  voteType: VoteType | "none",
): Statement[] {
  if (voteType === "none") return statements;
  return [...statements].sort(
    sortWithIdTieBreaker(
      (a, b) => countVotesOfType(b, voteType) - countVotesOfType(a, voteType),
    ),
  );
}

export function sortByNumericField<T extends { id: string }>(
  items: T[],
  field: keyof T | null,
  direction: "asc" | "desc",
): T[] {
  if (!field) return items;
  return [...items].sort(
    sortWithIdTieBreaker((a, b) => {
      const av = a[field] as unknown as number;
      const bv = b[field] as unknown as number;
      return direction === "desc" ? bv - av : av - bv;
    }),
  );
}