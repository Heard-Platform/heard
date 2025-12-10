import { Card } from "./ui/card";
import { Users, MessageSquare, Target, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { Badge } from "./ui/badge";
import { StatBox } from "./analysis/StatBox";
import { TopAgreedPosts } from "./analysis/TopAgreedPosts";

interface TopPost {
  id: string;
  text: string;
  agreeVotes: number;
  disagreeVotes: number;
  passVotes: number;
  consensusScore: number;
}

interface DebateAnalysisReportProps {
  debateId: string;
  debateTopic: string;
  totalParticipants: number;
  totalStatements: number;
  totalVotes: number;
  topPosts: TopPost[];
}

export function DebateAnalysisReport({
  debateId,
  debateTopic,
  totalParticipants,
  totalStatements,
  totalVotes,
  topPosts,
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
      </div>
    </div>
  );
}