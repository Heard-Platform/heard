import type { MinimapCluster } from "../components/room/ClusterMinimap";
import type { DeckOrder, Statement, VoteRates } from "../types";

export const FLYER_TOPIC = "Should DC let driverless cars on its streets?";

const MOSTLY_AGREES: VoteRates = [0.85, 0.1, 0.05];
const MOSTLY_DISAGREES: VoteRates = [0.1, 0.85, 0.05];
const SPLIT: VoteRates = [0.45, 0.45, 0.1];

export const FLYER_CLUSTERS: MinimapCluster[] = [
  { stableId: "fast", slot: 0, name: "Full Speed Ahead", size: 42 },
  { stableId: "brakes", slot: 1, name: "Hit the Brakes", size: 30 },
  { stableId: "data", slot: 2, name: "Show Me the Data", size: 18 },
];

const STATEMENTS: { id: string; text: string; rates: VoteRates[] }[] = [
  {
    id: "safer-streets",
    text: "Driverless cars will make streets safer for people walking and biking.",
    rates: [MOSTLY_AGREES, MOSTLY_DISAGREES, SPLIT],
  },
  {
    id: "pilot-first",
    text: "DC should run a small pilot before allowing driverless cars citywide.",
    rates: [MOSTLY_DISAGREES, SPLIT, MOSTLY_AGREES],
  },
  {
    id: "jobs",
    text: "Protecting rideshare and taxi jobs matters more than faster adoption.",
    rates: [MOSTLY_DISAGREES, MOSTLY_AGREES, SPLIT],
  },
  {
    id: "public-data",
    text: "Companies should have to publish all their crash data before expanding.",
    rates: [SPLIT, MOSTLY_AGREES, MOSTLY_AGREES],
  },
  {
    id: "traffic",
    text: "Driverless cars will make traffic worse, not better.",
    rates: [MOSTLY_DISAGREES, MOSTLY_AGREES, SPLIT],
  },
  {
    id: "night-service",
    text: "Late-night driverless rides would make it easier to get home safely.",
    rates: [MOSTLY_AGREES, SPLIT, SPLIT],
  },
];

export const FLYER_DECK_ORDER: DeckOrder = {
  leadStatementIds: STATEMENTS.map((s) => s.id),
  consensusStatementId: null,
  clusters: FLYER_CLUSTERS.map((cluster, clusterIndex) => ({
    ...cluster,
    voteRates: Object.fromEntries(STATEMENTS.map((s) => [s.id, s.rates[clusterIndex]])),
  })),
};

export const FLYER_STATEMENTS: Statement[] = STATEMENTS.map((s) => ({
  id: s.id,
  text: s.text,
  author: "story-author",
  roomId: "flyer-room",
  timestamp: Date.now(),
  agrees: 0,
  disagrees: 0,
  passes: 0,
  superAgrees: 0,
  voters: {},
  round: 1,
}));
