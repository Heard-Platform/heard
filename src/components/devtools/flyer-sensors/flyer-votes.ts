export interface FlyerVoteTally {
  tappedAtMs: number;
  agrees: number;
  disagrees: number;
}

export type FlyerVotesByTapTime = Record<number, FlyerVoteTally>;

export interface VoteShares {
  total: number;
  agreeFraction: number;
  disagreeFraction: number;
}

const MIN_RING_THICKNESS_PX = 3;
const MAX_RING_THICKNESS_PX = 12;
export const EMPTY_RING_THICKNESS_PX = 1.5;

export function indexVotesByTapTime(tallies: FlyerVoteTally[]): FlyerVotesByTapTime {
  return Object.fromEntries(tallies.map((tally) => [tally.tappedAtMs, tally]));
}

export function voteShares(tally: FlyerVoteTally): VoteShares {
  const total = tally.agrees + tally.disagrees;
  if (total === 0) return { total, agreeFraction: 0, disagreeFraction: 0 };
  return { total, agreeFraction: tally.agrees / total, disagreeFraction: tally.disagrees / total };
}

export function ringThicknessPx(total: number, maxTotal: number): number {
  if (total <= 0 || maxTotal <= 0) return EMPTY_RING_THICKNESS_PX;
  const scale = Math.sqrt(Math.min(total, maxTotal) / maxTotal);
  return MIN_RING_THICKNESS_PX + (MAX_RING_THICKNESS_PX - MIN_RING_THICKNESS_PX) * scale;
}

export function maxVoteTotal(votes: FlyerVotesByTapTime): number {
  return Object.values(votes).reduce((max, tally) => Math.max(max, voteShares(tally).total), 0);
}
