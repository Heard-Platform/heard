import { useState } from "react";
import { ClusterMinimap, MinimapCluster } from "../components/room/ClusterMinimap";
import { Button } from "../components/ui/button";
import { StoryContainer } from "./StoryContainer";
import { estimateClusterProbabilities } from "../utils/cluster-estimation";
import type { DeckOrder, VoteRates, VoteType } from "../types";

export default {
  title: "Voting/ClusterMinimap",
};

const MOSTLY_AGREES: VoteRates = [0.85, 0.1, 0.05];
const MOSTLY_DISAGREES: VoteRates = [0.1, 0.85, 0.05];
const SPLIT: VoteRates = [0.45, 0.45, 0.1];

const THREE_GROUPS: MinimapCluster[] = [
  { stableId: "fast", slot: 0, name: "Full Speed Ahead", size: 42 },
  { stableId: "brakes", slot: 1, name: "Hit the Brakes", size: 30 },
  { stableId: "data", slot: 2, name: "Show Me the Data", size: 18 },
];

const TWO_GROUPS: MinimapCluster[] = [
  { stableId: "fast", slot: 0, name: "Full Speed Ahead", size: 40 },
  { stableId: "brakes", slot: 1, name: "Hit the Brakes", size: 25 },
];

const UNNAMED_GROUPS: MinimapCluster[] = THREE_GROUPS.map((cluster) => ({ ...cluster, name: null }));

const STATEMENTS = [
  {
    id: "bike-lanes",
    text: "The city should add protected bike lanes on every major street.",
    rates: [MOSTLY_AGREES, MOSTLY_DISAGREES, SPLIT],
  },
  {
    id: "pilot-first",
    text: "New transit projects should start as small pilots before scaling up.",
    rates: [MOSTLY_DISAGREES, SPLIT, MOSTLY_AGREES],
  },
  {
    id: "parking",
    text: "Removing street parking is worth it for faster buses.",
    rates: [MOSTLY_AGREES, MOSTLY_DISAGREES, MOSTLY_DISAGREES],
  },
  {
    id: "studies",
    text: "We shouldn't change anything until there's a full traffic study.",
    rates: [MOSTLY_DISAGREES, MOSTLY_AGREES, MOSTLY_AGREES],
  },
  {
    id: "speed",
    text: "Lowering speed limits to 20 mph citywide is the right call.",
    rates: [MOSTLY_AGREES, MOSTLY_DISAGREES, SPLIT],
  },
];

function buildDeckOrder(clusters: MinimapCluster[]): DeckOrder {
  return {
    leadStatementIds: STATEMENTS.map((s) => s.id),
    consensusStatementId: null,
    clusters: clusters.map((cluster, clusterIndex) => ({
      stableId: cluster.stableId,
      size: cluster.size,
      voteRates: Object.fromEntries(STATEMENTS.map((s) => [s.id, s.rates[clusterIndex]])),
    })),
  };
}

function SimulatedSwiping({ clusters }: { clusters: MinimapCluster[] }) {
  const [votes, setVotes] = useState<Record<string, VoteType>>({});
  const deckOrder = buildDeckOrder(clusters);
  const votedCount = Object.keys(votes).length;
  const nextStatement = STATEMENTS[votedCount];
  const clusterProbabilities = votedCount > 0 ? estimateClusterProbabilities(deckOrder, votes) : null;

  const vote = (voteType: VoteType) => {
    if (!nextStatement) return;
    setVotes((current) => ({ ...current, [nextStatement.id]: voteType }));
  };

  return (
    <div className="flex flex-col items-start gap-4 md:flex-row">
      <ClusterMinimap clusters={clusters} clusterProbabilities={clusterProbabilities} />

      <div className="flex max-w-sm flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {nextStatement ? `Vote ${votedCount + 1} of ${STATEMENTS.length}` : "All statements voted"}
        </p>
        {nextStatement && <p className="text-sm font-medium">{nextStatement.text}</p>}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={!nextStatement} onClick={() => vote("agree")}>
            Agree
          </Button>
          <Button size="sm" variant="outline" disabled={!nextStatement} onClick={() => vote("disagree")}>
            Disagree
          </Button>
          <Button size="sm" variant="ghost" disabled={!nextStatement} onClick={() => vote("pass")}>
            Pass
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setVotes({})}>
            Reset
          </Button>
        </div>
        {clusterProbabilities && (
          <p className="text-xs text-muted-foreground">
            {clusters
              .map((cluster, i) => `${cluster.name ?? cluster.stableId}: ${Math.round(clusterProbabilities[i] * 100)}%`)
              .join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

export const ThreeGroups = () => <SimulatedSwiping clusters={THREE_GROUPS} />;
export const TwoGroups = () => <SimulatedSwiping clusters={TWO_GROUPS} />;
export const UnnamedGroups = () => <SimulatedSwiping clusters={UNNAMED_GROUPS} />;

export function ClusterMinimapStory() {
  return (
    <StoryContainer
      title="Cluster Minimap"
      description="Mini opinion-groups map shown while swiping. Vote to watch the dot pulse and move; circle sizes follow group sizes, and member dots are decorative."
      variants={[
        { id: "three", label: "Three groups", children: <ThreeGroups /> },
        { id: "two", label: "Two groups", children: <TwoGroups /> },
        { id: "unnamed", label: "Unnamed groups", children: <UnnamedGroups /> },
      ]}
    />
  );
}
