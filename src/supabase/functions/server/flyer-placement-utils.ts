import type { FlyerPlacement, Vote } from "./types.tsx";
import { calculateVoteStats } from "./voting-utils.ts";

export interface FlyerPlacementInput {
  flyerGroup: number;
  latitude: number;
  longitude: number;
  headingDeg: number | null;
}

export interface FlyerVoteCounts {
  agrees: number;
  disagrees: number;
}

export type FlyerPlacementWithVotes = FlyerPlacement & FlyerVoteCounts;

const isInRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;

const isValidHeading = (value: unknown): boolean =>
  value === null || (isInRange(value, 0, 360) && value < 360);

const isValidFlyerPlacementInput = (value: unknown): value is FlyerPlacementInput => {
  if (typeof value !== "object" || value === null) return false;
  const flyer = value as Record<string, unknown>;
  return (
    Number.isInteger(flyer.flyerGroup) &&
    (flyer.flyerGroup as number) > 0 &&
    isInRange(flyer.latitude, -90, 90) &&
    isInRange(flyer.longitude, -180, 180) &&
    isValidHeading(flyer.headingDeg)
  );
};

export const findFlyerPlacementsError = (
  flyers: unknown[],
  savedGroups: Set<number>,
): string | null => {
  if (flyers.length === 0) return "No flyers to save";
  if (!flyers.every(isValidFlyerPlacementInput)) {
    return "Each flyer needs a positive whole flyer group, a valid latitude and longitude, and a heading from 0 to 359 or null";
  }

  const groups = flyers.map((flyer) => flyer.flyerGroup);
  const repeated = groups.filter((group, index) => groups.indexOf(group) !== index);
  if (repeated.length > 0) return `Flyer groups are used more than once: ${[...new Set(repeated)].join(", ")}`;

  const alreadySaved = groups.filter((group) => savedGroups.has(group));
  if (alreadySaved.length > 0) {
    return `Flyer groups are already saved for this statement: ${alreadySaved.join(", ")}`;
  }

  return null;
};

export const countFlyerVotes = (votes: Vote[], flyerGroup: number): FlyerVoteCounts => {
  const { agrees, disagrees } = calculateVoteStats(votes.filter((vote) => vote.flyerGroup === flyerGroup));
  return { agrees, disagrees };
};

export const attachVoteCounts = (
  placements: FlyerPlacement[],
  votesByStatementId: Map<string, Vote[]>,
): FlyerPlacementWithVotes[] =>
  placements.map((placement) => ({
    ...placement,
    ...countFlyerVotes(votesByStatementId.get(placement.statementId) ?? [], placement.flyerGroup),
  }));
