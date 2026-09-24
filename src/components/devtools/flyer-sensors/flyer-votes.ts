export interface VoteCounts {
  agrees: number;
  disagrees: number;
}

export interface VoteShares {
  total: number;
  agreeFraction: number;
  disagreeFraction: number;
}

const MIN_RING_THICKNESS_PX = 3;
const MAX_RING_THICKNESS_PX = 12;
export const EMPTY_RING_THICKNESS_PX = 1.5;

export function voteShares(counts: VoteCounts): VoteShares {
  const total = counts.agrees + counts.disagrees;
  if (total === 0) return { total, agreeFraction: 0, disagreeFraction: 0 };
  return { total, agreeFraction: counts.agrees / total, disagreeFraction: counts.disagrees / total };
}

export function ringThicknessPx(total: number, maxTotal: number): number {
  if (total <= 0 || maxTotal <= 0) return EMPTY_RING_THICKNESS_PX;
  const scale = Math.sqrt(Math.min(total, maxTotal) / maxTotal);
  return MIN_RING_THICKNESS_PX + (MAX_RING_THICKNESS_PX - MIN_RING_THICKNESS_PX) * scale;
}

export function maxVoteTotal(counts: VoteCounts[]): number {
  return counts.reduce((max, count) => Math.max(max, voteShares(count).total), 0);
}

export function describeVotes(counts: VoteCounts): string {
  const { total } = voteShares(counts);
  if (total === 0) return "No flyer votes yet";
  return `${total} flyer votes · ${counts.agrees} agree / ${counts.disagrees} disagree`;
}
