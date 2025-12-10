import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Target,
  Zap,
  Award,
  Clock,
  GitBranch,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Minus,
  Activity,
  Sparkles,
  Brain,
  Share2,
  Eye,
  Heart,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";

interface DebateAnalysisReportDemoProps {
  debateId: string;
  debateTopic: string;
  onClose?: () => void;
}

const FAKE_DATA = {
  overview: {
    totalParticipants: 247,
    totalStatements: 156,
    totalVotes: 3842,
    debateDuration: "4 days, 7 hours",
    completionRate: 73,
    averageEngagement: 15.6,
  },
  insights: [
    {
      id: "1",
      title: "High Initial Engagement",
      description:
        "85% of participants contributed within the first 24 hours, showing strong early momentum.",
      impact: "high" as const,
      icon: TrendingUp,
    },
    {
      id: "2",
      title: "Emerging Consensus",
      description:
        "Three distinct opinion clusters formed, with 42% of statements receiving 70%+ agreement.",
      impact: "high" as const,
      icon: Brain,
    },
    {
      id: "3",
      title: "Quality Over Quantity",
      description:
        "Top 10% of contributors generated 67% of the most-voted statements.",
      impact: "medium" as const,
      icon: Award,
    },
    {
      id: "4",
      title: "Cross-Cluster Agreement",
      description:
        "12 statements received strong support across all three opinion clusters.",
      impact: "high" as const,
      icon: GitBranch,
    },
  ],
  participation: {
    newUsers: 198,
    returningUsers: 49,
    activeContributors: 89,
    passiveVoters: 158,
    engagementRate: 36,
  },
  votingPatterns: {
    agreeRate: 48,
    disagreeRate: 31,
    passRate: 21,
    polarization: "moderate" as const,
    consensusStatements: 42,
  },
  timeline: [
    { day: "Day 1", statements: 45, votes: 892, participants: 112 },
    { day: "Day 2", statements: 38, votes: 1024, participants: 89 },
    { day: "Day 3", statements: 31, votes: 876, participants: 67 },
    { day: "Day 4", statements: 28, votes: 743, participants: 54 },
    { day: "Day 5", statements: 14, votes: 307, participants: 31 },
  ],
  topContributors: [
    { id: "1", name: "DebateMaster", statements: 12, votes: 847, influence: 94 },
    { id: "2", name: "ThoughtLeader", statements: 9, votes: 692, influence: 87 },
    { id: "3", name: "Philosopher", statements: 11, votes: 578, influence: 81 },
    {
      id: "4",
      name: "CriticalThinker",
      statements: 7,
      votes: 534,
      influence: 76,
    },
    { id: "5", name: "Mediator", statements: 8, votes: 489, influence: 72 },
  ],
  topStatements: [
    {
      id: "1",
      text: "We should prioritize sustainable infrastructure that serves future generations while addressing immediate needs.",
      author: "DebateMaster",
      agreeVotes: 178,
      disagreeVotes: 23,
      passVotes: 12,
      consensusScore: 84,
    },
    {
      id: "2",
      text: "Community input should drive development decisions, with transparent processes for all stakeholders.",
      author: "ThoughtLeader",
      agreeVotes: 165,
      disagreeVotes: 31,
      passVotes: 18,
      consensusScore: 77,
    },
    {
      id: "3",
      text: "Balancing economic growth with environmental protection requires innovative solutions and compromise.",
      author: "Philosopher",
      agreeVotes: 156,
      disagreeVotes: 28,
      passVotes: 24,
      consensusScore: 75,
    },
  ],
  clusters: [
    {
      id: "1",
      name: "Sustainability First",
      size: 42,
      centerStatement:
        "Environmental concerns should be the primary driver of all development decisions.",
    },
    {
      id: "2",
      name: "Balanced Growth",
      size: 38,
      centerStatement:
        "We need pragmatic solutions that balance economic and environmental needs.",
    },
    {
      id: "3",
      name: "Economic Priority",
      size: 20,
      centerStatement:
        "Economic development should take precedence to ensure community prosperity.",
    },
  ],
  sentiment: {
    averageToxicity: 12,
    averageConstructiveness: 78,
    qualityScore: 82,
  },
  trends: {
    participationTrend: "decreasing",
    polarizationTrend: "decreasing",
    qualityTrend: "increasing",
  },
};

export function DebateAnalysisReportDemo({
  debateId,
  debateTopic,
  onClose,
}: DebateAnalysisReportDemoProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["overview", "insights"])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const isExpanded = (section: string) => expandedSections.has(section);

  const SectionHeader = ({
    id,
    title,
    icon: Icon,
  }: {
    id: string;
    title: string;
    icon: any;
  }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl">{title}</h2>
      </div>
      {isExpanded(id) ? (
        <ChevronUp className="w-5 h-5 text-slate-400" />
      ) : (
        <ChevronDown className="w-5 h-5 text-slate-400" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl mb-2">Debate Analysis Report</h1>
            <p className="text-muted-foreground">{debateTopic}</p>
            <Badge
              variant="outline"
              className="mt-2 bg-purple-50 text-purple-700 border-purple-200"
            >
              Demo Version with Fake Data
            </Badge>
          </div>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>

        <Card>
          <SectionHeader id="overview" title="Overview" icon={BarChart3} />
          {isExpanded("overview") && (
            <div className="p-6 pt-0">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <Users className="w-8 h-8 text-purple-600 mb-2" />
                  <div className="text-2xl mb-1">
                    {FAKE_DATA.overview.totalParticipants}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Participants
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <MessageSquare className="w-8 h-8 text-blue-600 mb-2" />
                  <div className="text-2xl mb-1">
                    {FAKE_DATA.overview.totalStatements}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Statements
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <Target className="w-8 h-8 text-green-600 mb-2" />
                  <div className="text-2xl mb-1">
                    {FAKE_DATA.overview.totalVotes}
                  </div>
                  <div className="text-sm text-muted-foreground">Votes</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                  <Clock className="w-8 h-8 text-orange-600 mb-2" />
                  <div className="text-lg mb-1">
                    {FAKE_DATA.overview.debateDuration}
                  </div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg">
                  <Activity className="w-8 h-8 text-pink-600 mb-2" />
                  <div className="text-2xl mb-1">
                    {FAKE_DATA.overview.completionRate}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Completion
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
                  <Zap className="w-8 h-8 text-indigo-600 mb-2" />
                  <div className="text-2xl mb-1">
                    {FAKE_DATA.overview.averageEngagement}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg Engagement
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <SectionHeader id="insights" title="Key Insights" icon={Sparkles} />
          {isExpanded("insights") && (
            <div className="p-6 pt-0 space-y-3">
              {FAKE_DATA.insights.map((insight) => (
                <div
                  key={insight.id}
                  className="flex gap-3 p-4 bg-gradient-to-r from-slate-50 to-transparent rounded-lg"
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      insight.impact === "high"
                        ? "bg-purple-100"
                        : "bg-blue-100"
                    }`}
                  >
                    <insight.icon
                      className={`w-5 h-5 ${
                        insight.impact === "high"
                          ? "text-purple-600"
                          : "text-blue-600"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium">{insight.title}</h3>
                      <Badge
                        variant="outline"
                        className={
                          insight.impact === "high"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }
                      >
                        {insight.impact} impact
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {insight.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionHeader id="top-statements" title="Top Statements" icon={Award} />
          {isExpanded("top-statements") && (
            <div className="p-6 pt-0 space-y-3">
              {FAKE_DATA.topStatements.map((statement, index) => (
                <div
                  key={statement.id}
                  className="p-4 bg-gradient-to-r from-slate-50 to-transparent rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm mb-2">{statement.text}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          <span>{statement.agreeVotes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsDown className="w-3 h-3" />
                          <span>{statement.disagreeVotes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Minus className="w-3 h-3" />
                          <span>{statement.passVotes}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className="ml-auto bg-green-50 text-green-700 border-green-200"
                        >
                          {statement.consensusScore}% consensus
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
