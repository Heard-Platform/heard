import { useState } from "react";
import { BridgeStatementsSection } from "../components/analysis/BridgeStatementsSection";
import { StatementVotes } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

function StatefulBridgeStatementsSection(props: {
  statements: StatementVotes[];
  totalParticipants: number;
  clusterSizes: number[];
}) {
  const [showNumbers, setShowNumbers] = useState(false);
  return (
    <div>
      <button
        type="button"
        className="mb-3 text-xs text-muted-foreground hover:text-foreground underline"
        onClick={() => setShowNumbers((v) => !v)}
      >
        {showNumbers ? "Hide" : "Show"} numbers
      </button>
      <BridgeStatementsSection {...props} showNumbers={showNumbers} />
    </div>
  );
}

export default {
  title: "Analysis/BridgeStatementsSection",
};

const clusterSizes = [80, 60, 50, 35];
const totalParticipants = 225;

// A & C (indices 0 & 2) strongly agree with each other while B & D strongly
// disagree, so the population overall looks split even though A & C bridge.
const bridgeAC: StatementVotes = {
  id: "bridge-ac",
  text: "We should legalize regulated cannabis dispensaries but ban public consumption entirely.",
  agreeVotes: 108,
  rawAgreeVotes: 90,
  superAgreeVotes: 18,
  disagreeVotes: 78,
  passVotes: 14,
  totalVotes: 200,
  consensusScore: 16.1,
  mergedFrom: [],
  clusterVotes: [
    { clusterId: 0, clusterSize: 80, agreeVotes: 60, superAgreeVotes: 10, disagreeVotes: 5, passVotes: 5 },
    { clusterId: 1, clusterSize: 60, agreeVotes: 5, superAgreeVotes: 1, disagreeVotes: 45, passVotes: 5 },
    { clusterId: 2, clusterSize: 50, agreeVotes: 40, superAgreeVotes: 7, disagreeVotes: 3, passVotes: 2 },
    { clusterId: 3, clusterSize: 35, agreeVotes: 3, superAgreeVotes: 0, disagreeVotes: 25, passVotes: 2 },
  ],
};

// B & D (indices 1 & 3) strongly agree with each other, a different pair
// than the statement above.
const bridgeBD: StatementVotes = {
  id: "bridge-bd",
  text: "Unemployment benefits should require proof of active job searching each week.",
  agreeVotes: 105,
  rawAgreeVotes: 85,
  superAgreeVotes: 20,
  disagreeVotes: 80,
  passVotes: 11,
  totalVotes: 196,
  consensusScore: 13.5,
  mergedFrom: [],
  clusterVotes: [
    { clusterId: 0, clusterSize: 80, agreeVotes: 10, superAgreeVotes: 1, disagreeVotes: 45, passVotes: 5 },
    { clusterId: 1, clusterSize: 60, agreeVotes: 50, superAgreeVotes: 12, disagreeVotes: 3, passVotes: 2 },
    { clusterId: 2, clusterSize: 50, agreeVotes: 15, superAgreeVotes: 2, disagreeVotes: 30, passVotes: 3 },
    { clusterId: 3, clusterSize: 35, agreeVotes: 30, superAgreeVotes: 5, disagreeVotes: 2, passVotes: 1 },
  ],
};

// A & D (indices 0 & 3) strongly agree with each other, a third distinct
// pair, to show the section can surface several different bridges at once.
const bridgeAD: StatementVotes = {
  id: "bridge-ad",
  text: "Short-term vacation rentals should be banned in residential neighborhoods.",
  agreeVotes: 115,
  rawAgreeVotes: 95,
  superAgreeVotes: 20,
  disagreeVotes: 78,
  passVotes: 11,
  totalVotes: 204,
  consensusScore: 19.2,
  mergedFrom: [],
  clusterVotes: [
    { clusterId: 0, clusterSize: 80, agreeVotes: 55, superAgreeVotes: 10, disagreeVotes: 8, passVotes: 2 },
    { clusterId: 1, clusterSize: 60, agreeVotes: 20, superAgreeVotes: 3, disagreeVotes: 35, passVotes: 5 },
    { clusterId: 2, clusterSize: 50, agreeVotes: 15, superAgreeVotes: 2, disagreeVotes: 30, passVotes: 3 },
    { clusterId: 3, clusterSize: 35, agreeVotes: 25, superAgreeVotes: 5, disagreeVotes: 5, passVotes: 1 },
  ],
};

// Broad agreement across every cluster: high overall consensus, so this
// should NOT show up as a bridge even though no pair actively disagrees.
const highConsensus: StatementVotes = {
  id: "high-consensus",
  text: "Public libraries should remain free to access for all residents.",
  agreeVotes: 192,
  rawAgreeVotes: 155,
  superAgreeVotes: 37,
  disagreeVotes: 16,
  passVotes: 17,
  totalVotes: 225,
  consensusScore: 84.6,
  mergedFrom: [],
  clusterVotes: [
    { clusterId: 0, clusterSize: 80, agreeVotes: 70, superAgreeVotes: 15, disagreeVotes: 5, passVotes: 5 },
    { clusterId: 1, clusterSize: 60, agreeVotes: 52, superAgreeVotes: 10, disagreeVotes: 4, passVotes: 4 },
    { clusterId: 2, clusterSize: 50, agreeVotes: 42, superAgreeVotes: 8, disagreeVotes: 4, passVotes: 4 },
    { clusterId: 3, clusterSize: 35, agreeVotes: 28, superAgreeVotes: 4, disagreeVotes: 3, passVotes: 4 },
  ],
};

const mockStatements: StatementVotes[] = [bridgeAC, bridgeBD, bridgeAD, highConsensus];

export const Default = () => (
  <div className="p-4 max-w-4xl mx-auto">
    <StatefulBridgeStatementsSection
      statements={mockStatements}
      totalParticipants={totalParticipants}
      clusterSizes={clusterSizes}
    />
  </div>
);

export const NoBridges = () => (
  <div className="p-4 max-w-4xl mx-auto">
    <p className="text-sm text-muted-foreground mb-3">
      Renders nothing below when no statement clears the bridging thresholds.
    </p>
    <StatefulBridgeStatementsSection
      statements={[highConsensus]}
      totalParticipants={totalParticipants}
      clusterSizes={clusterSizes}
    />
  </div>
);

export function BridgeStatementsSectionStory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bridge Statements Section</CardTitle>
        <CardDescription>
          Statements with low overall consensus where some pair of clusters strongly agrees (or
          disagrees) together
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StatefulBridgeStatementsSection
          statements={mockStatements}
          totalParticipants={totalParticipants}
          clusterSizes={clusterSizes}
        />
      </CardContent>
    </Card>
  );
}
