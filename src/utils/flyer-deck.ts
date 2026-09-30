import type { DeckOrder, Statement } from "../types";
import type { MinimapCluster } from "../components/room/ClusterMinimap";

export const FLYER_EXTRA_CARD_COUNT = 5;

export function flyerCandidates(statements: Statement[], flyerStatementId: string, userId: string): Statement[] {
  return statements.filter((statement) => statement.id !== flyerStatementId && !statement.voters?.[userId]);
}

export function toMinimapClusters(deckOrder: DeckOrder | null): MinimapCluster[] {
  if (!deckOrder) return [];
  return deckOrder.clusters.map(({ stableId, slot, name, size }) => ({ stableId, slot, name, size }));
}
