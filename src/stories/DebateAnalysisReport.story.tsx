import { DebateAnalysisReport } from "../components/DebateAnalysisReport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { TopPost, ClusterConsensus } from "../types";

export default {
  title: "Analysis/Report",
};

const mockTopPosts: TopPost[] = [
  {
    id: "post-1",
    text: "We should invest more in renewable energy infrastructure to reduce our carbon footprint and create green jobs for the future.",
    agreeVotes: 142,
    disagreeVotes: 23,
    passVotes: 15,
    consensusScore: 78.9,
    totalVotes: 180,
  },
  {
    id: "post-2",
    text: "Public transportation improvements should be prioritized over expanding highway systems to reduce traffic congestion.",
    agreeVotes: 98,
    disagreeVotes: 45,
    passVotes: 22,
    consensusScore: 59.4,
    totalVotes: 165,
  },
  {
    id: "post-3",
    text: "Community gardens and urban green spaces contribute significantly to neighborhood wellbeing and should receive more funding.",
    agreeVotes: 87,
    disagreeVotes: 31,
    passVotes: 28,
    consensusScore: 59.6,
    totalVotes: 146,
  },
];

const mockClusterConsensus: ClusterConsensus = {
  totalClusters: 3,
  clusters: [
    {
      id: 0,
      size: 92,
      statements: [
        {
          id: "cluster-0-statement-1",
          text: "Expanding public transit reduces traffic and makes the city more accessible for everyone.",
          agreeVotes: 76,
          totalVotes: 92,
          consensusScore: 82.6,
        },
        {
          id: "cluster-0-statement-2",
          text: "Better bike lanes and pedestrian infrastructure encourage healthier transportation options.",
          agreeVotes: 71,
          totalVotes: 92,
          consensusScore: 77.2,
        },
        {
          id: "cluster-0-statement-3",
          text: "Light rail connections to surrounding suburbs would reduce car dependency.",
          agreeVotes: 65,
          totalVotes: 92,
          consensusScore: 70.7,
        },
      ],
    },
    {
      id: 1,
      size: 85,
      statements: [
        {
          id: "cluster-1-statement-1",
          text: "Renewable energy projects should be the top priority for long-term sustainability and economic growth.",
          agreeVotes: 68,
          totalVotes: 85,
          consensusScore: 80.0,
        },
        {
          id: "cluster-1-statement-2",
          text: "Solar panel installations on public buildings would demonstrate our commitment to clean energy.",
          agreeVotes: 62,
          totalVotes: 85,
          consensusScore: 72.9,
        },
        {
          id: "cluster-1-statement-3",
          text: "Wind energy farms could provide clean power while creating local jobs.",
          agreeVotes: 58,
          totalVotes: 85,
          consensusScore: 68.2,
        },
      ],
    },
    {
      id: 2,
      size: 70,
      statements: [
        {
          id: "cluster-2-statement-1",
          text: "Community parks and green spaces improve mental health and quality of life for residents.",
          agreeVotes: 59,
          totalVotes: 70,
          consensusScore: 84.3,
        },
        {
          id: "cluster-2-statement-2",
          text: "Neighborhood gardens foster community connections and provide fresh produce access.",
          agreeVotes: 54,
          totalVotes: 70,
          consensusScore: 77.1,
        },
        {
          id: "cluster-2-statement-3",
          text: "Tree planting programs help combat urban heat islands and improve air quality.",
          agreeVotes: 51,
          totalVotes: 70,
          consensusScore: 72.9,
        },
      ],
    },
  ],
};

export const WithClusters = () => {
  return (
    <DebateAnalysisReport
      debateId="demo-debate-123"
      debateTopic="What should our city prioritize in the next budget?"
      totalParticipants={247}
      totalStatements={156}
      totalVotes={1842}
      topPosts={mockTopPosts}
      clusterConsensus={mockClusterConsensus}
    />
  );
};

export const NoClusters = () => {
  return (
    <DebateAnalysisReport
      debateId="demo-debate-456"
      debateTopic="Should our neighborhood allow food trucks?"
      totalParticipants={42}
      totalStatements={28}
      totalVotes={315}
      topPosts={[
        {
          id: "post-a",
          text: "Food trucks bring variety and support small businesses in our community.",
          agreeVotes: 28,
          disagreeVotes: 8,
          passVotes: 6,
          consensusScore: 66.7,
          totalVotes: 42,
        },
        {
          id: "post-b",
          text: "We need to consider parking and traffic impacts before allowing food trucks.",
          agreeVotes: 24,
          disagreeVotes: 12,
          passVotes: 6,
          consensusScore: 57.1,
          totalVotes: 42,
        },
      ]}
      clusterConsensus={null}
    />
  );
};

export function DebateAnalysisReportStory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Debate Analysis Report</CardTitle>
        <CardDescription>
          Analysis reports with and without cluster consensus data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="with-clusters" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="with-clusters">With Clusters</TabsTrigger>
            <TabsTrigger value="no-clusters">No Clusters</TabsTrigger>
          </TabsList>
          
          <TabsContent value="with-clusters">
            <WithClusters />
          </TabsContent>
          
          <TabsContent value="no-clusters">
            <NoClusters />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}