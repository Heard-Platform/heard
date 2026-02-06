import { Card } from "../ui/card";
import { Users, MessageSquare, Target, GitBranch, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { StatBox } from "./StatBox";
import { TopAgreedPosts } from "./TopAgreedPosts";
import { SpiciestPosts } from "./SpiciestPosts";
import { ClusterConsensusBox } from "./ClusterConsensusBox";
import { AnalysisData } from "../../types";
import { scoreToWord } from "../../utils/analysis";

interface DebateAnalysisReportProps extends AnalysisData{
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
  totalVoters,
  participation,
  consensusData,
  spicinessData,
  reachData,
  topPosts,
  spiciestPosts,
  clusterConsensus,
  isDeveloper,
  regenerating,
  onRegenerateClusters,
}: DebateAnalysisReportProps) {
  return (
    <div className="heard-page-bg p-4">
      <div className="max-w-7xl mx-auto space-y-6">
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

        <div className="text-sm text-muted-foreground mb-2">
          Participation: {scoreToWord(participation)}
          <div className="text-xs mt-0.5">
            {totalPosters} posters / {totalVoters} voters
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-2">
          Consensus: {scoreToWord(consensusData.consensus)}
          <div className="text-xs mt-0.5">
            {consensusData.highConsensusPostCount} high consensus posts
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-2">
          Spiciness: {scoreToWord(spicinessData.spiciness)}
          <div className="text-xs mt-0.5">
            {spicinessData.lowConsensusPostCount} low consensus posts
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-2">
          Reach: {scoreToWord(reachData.reach)}
          <div className="text-xs mt-0.5">
            {reachData.postersWithHighConsensusPost} posters with a high consensus post
          </div>
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
              {clusterConsensus.clusters.map((cluster, index) => (
                <ClusterConsensusBox
                  key={cluster.id}
                  clusterNumber={index + 1}
                  clusterSize={cluster.size}
                  statements={cluster.statements}
                />
              ))}
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
      </div>
    </div>
  );
}