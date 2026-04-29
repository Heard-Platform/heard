import { Card } from "../ui/card";
import { Users, MessageSquare, Target, GitBranch, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { StatBox } from "./StatBox";
import { TopAgreedPosts } from "./TopAgreedPosts";
import { SpiciestPosts } from "./SpiciestPosts";
import { ClusterConsensusBox } from "./ClusterConsensusBox";
import { DemographicsPieCharts } from "./DemographicsPieCharts";
import { AnalysisData, StatementVotes } from "../../types";
import { FeatureFlags, isFeatureEnabled } from "../../utils/constants/feature-flags";
import { MetricCard } from "./MetricCard";
import { StatementVotesTable } from "./StatementVotesTable";

interface DebateAnalysisReportProps extends AnalysisData {
  debateId: string;
  debateTopic: string;
  isDeveloper?: boolean;
  regenerating?: boolean;
  onRegenerateClusters?: () => void;
}

export function DebateAnalysisReport({
  debateId,
  debateTopic,
  totalParticipants,
  totalStatements,
  totalVotes,
  totalPosters,
  consensusData,
  spicinessData,
  reachData,
  topPosts,
  spiciestPosts,
  clusterConsensus,
  demographics,
  allStatements,
  isDeveloper,
  regenerating,
  onRegenerateClusters,
}: DebateAnalysisReportProps) {
  const clusterSizes = clusterConsensus?.clusters.map((c) => c.size) ?? [];
  const statementVotesById = new Map(allStatements.map((s) => [s.id, s]));

  return (
    <div className="heard-page-bg p-4">
      <div className="mx-auto space-y-6">
        <div>
          <h1 className="text-3xl">Conversation Analysis</h1>
          <p className="text-muted-foreground mt-1">{debateTopic}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatBox
            icon={Users}
            value={totalParticipants}
            label="Participants"
            gradientFrom="from-purple-500"
            gradientTo="to-purple-600"
          />
          <StatBox
            icon={MessageSquare}
            value={totalStatements}
            label="Statements"
            gradientFrom="from-blue-500"
            gradientTo="to-blue-600"
          />
          <StatBox
            icon={Target}
            value={totalVotes}
            label="Votes"
            gradientFrom="from-green-500"
            gradientTo="to-green-600"
          />
        </div>

        {isFeatureEnabled(FeatureFlags.DEMOGRAPHICS) && (
          <DemographicsPieCharts demographics={demographics} />
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <MetricCard
            label="Participation"
            viz="dots"
            filled={totalPosters}
            total={totalParticipants}
            description={`${totalPosters} out of ${totalParticipants} people posted a statement`}
          />
          <MetricCard
            label="Consensus"
            viz="bar"
            score={consensusData.consensus}
            count={consensusData.highConsensusPostCount}
            description={`${consensusData.highConsensusPostCount} high consensus posts`}
          />
          <MetricCard
            label="Spiciness"
            viz="bar"
            score={spicinessData.spiciness}
            count={spicinessData.lowConsensusPostCount}
            description={`${spicinessData.lowConsensusPostCount} low consensus posts`}
          />
          <MetricCard
            label="Reach"
            viz="bar"
            score={reachData.reach}
            count={reachData.postersWithHighConsensusPost}
            description={`${reachData.postersWithHighConsensusPost} ${reachData.postersWithHighConsensusPost === 1 ? "person" : "people"} with a high consensus response`}
          />
        </div>

        <TopAgreedPosts topPosts={topPosts} />
        <SpiciestPosts spiciestPosts={spiciestPosts} />

        {!clusterConsensus || clusterConsensus.totalClusters === 0 ? (
          <Card className="p-6 border-2 border-yellow-200 bg-yellow-50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl text-yellow-900">No Cluster Data Available</h2>
                <p className="text-sm text-yellow-700 mt-1">
                  Cluster consensus analysis is not available for this conversation.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl">Cluster Consensus</h2>
                <p className="text-sm text-muted-foreground">
                  Top consensus statements by opinion cluster
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {clusterConsensus.clusters.map((cluster, index) => {
                const clusterStatements = cluster.statements
                  .map((s) => statementVotesById.get(s.id))
                  .filter(s => s !== undefined);
                return (
                  <ClusterConsensusBox
                    key={cluster.id}
                    clusterIndex={index}
                    clusterSize={cluster.size}
                    clusterSizes={clusterSizes}
                    totalParticipants={totalParticipants}
                    statements={clusterStatements}
                  />
                );
              })}
            </div>

            {isDeveloper && (
              <div className="mt-6">
                <Button
                  onClick={onRegenerateClusters}
                  disabled={regenerating}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {regenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    "Regenerate Clusters"
                  )}
                </Button>
              </div>
            )}
          </Card>
        )}

        <StatementVotesTable
          statements={allStatements}
          totalParticipants={totalParticipants}
          clusterSizes={clusterSizes}
        />

      </div>
    </div>
  );
}