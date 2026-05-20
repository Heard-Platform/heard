import type { Statement } from "../types";

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
