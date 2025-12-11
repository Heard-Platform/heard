import { Card } from "./ui/card";
import { Users, MessageSquare, Target, ThumbsUp, ThumbsDown, Minus, GitBranch, AlertCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { StatBox } from "./analysis/StatBox";
import { TopAgreedPosts } from "./analysis/TopAgreedPosts";
import { ClusterConsensusBox } from "./analysis/ClusterConsensusBox";
import { TopPost, ClusterConsensus } from "../types";

interface DebateAnalysisReportProps {
  debateId: string;
  debateTopic: string;
  totalParticipants: number;
  totalStatements: number;
  totalVotes: number;
  topPosts: TopPost[];
  clusterConsensus?: ClusterConsensus | null;
}

export function DebateAnalysisReport({
  debateId,
  debateTopic,
  totalParticipants,
  totalStatements,
  totalVotes,
  topPosts,
  clusterConsensus,
}: DebateAnalysisReportProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl">Debate Analysis</h1>
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

        <TopAgreedPosts topPosts={topPosts} />

        {!clusterConsensus || clusterConsensus.totalClusters === 0 ? (
          <Card className="p-6 border-2 border-yellow-200 bg-yellow-50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl text-yellow-900">No Cluster Data Available</h2>
                <p className="text-sm text-yellow-700 mt-1">
                  Cluster consensus analysis is not available for this debate.
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
              {Object.entries(clusterConsensus.statementsByCluster).map(([clusterId, statements]) => {
                const clusterNum = Number(clusterId);
                const clusterSize = clusterConsensus.clusterSizes[clusterNum] || 0;

                return (
                  <ClusterConsensusBox
                    key={clusterId}
                    clusterNumber={clusterNum + 1}
                    clusterSize={clusterSize}
                    statements={statements}
                  />
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}