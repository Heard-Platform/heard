import type { NewFlyerPlacementsRequest, SavedFlyerPlacement } from "../../../utils/dev-api";
import { placementPosition } from "./flyer-location";
import type { FlyerPlacement } from "./sensor-types";

interface SaveContext {
  roomId: string | null;
  statementId: string | null;
  placements: FlyerPlacement[];
  savedFlyers: SavedFlyerPlacement[];
}

function savedGroupsForStatement(savedFlyers: SavedFlyerPlacement[], statementId: string): Set<number> {
  return new Set(savedFlyers.filter((flyer) => flyer.statementId === statementId).map((flyer) => flyer.flyerGroup));
}

function duplicates(values: number[]): number[] {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
}

export function nextFlyerGroup(savedFlyers: SavedFlyerPlacement[], statementId: string | null): number {
  if (!statementId) return 1;
  return Math.max(0, ...savedGroupsForStatement(savedFlyers, statementId)) + 1;
}

export function findSaveProblem({ roomId, statementId, placements, savedFlyers }: SaveContext): string | null {
  if (!roomId) return "Select a room to save";
  if (!statementId) return "Select the statement on these flyers to save";
  if (placements.length === 0) return "Upload a recording with new flyers to save";

  const unplaced = placements.filter((placement) => !placementPosition(placement));
  if (unplaced.length > 0) {
    return `Flyers without a position: ${unplaced.map((placement) => placement.flyerGroup).join(", ")}`;
  }

  const groups = placements.map((placement) => placement.flyerGroup);
  const repeated = duplicates(groups);
  if (repeated.length > 0) return `Flyer numbers used more than once: ${repeated.join(", ")}`;

  const saved = savedGroupsForStatement(savedFlyers, statementId);
  const alreadySaved = groups.filter((group) => saved.has(group));
  if (alreadySaved.length > 0) return `Flyer numbers already saved for this statement: ${alreadySaved.join(", ")}`;

  return null;
}

export function buildSavePayload(
  roomId: string,
  statementId: string,
  placements: FlyerPlacement[],
): NewFlyerPlacementsRequest {
  return {
    roomId,
    statementId,
    flyers: placements.flatMap((placement) => {
      const position = placementPosition(placement);
      if (!position) return [];
      return [
        {
          flyerGroup: placement.flyerGroup,
          latitude: position.latitude,
          longitude: position.longitude,
          headingDeg: placement.headingDeg,
        },
      ];
    }),
  };
}
