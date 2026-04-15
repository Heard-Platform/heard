import { DebateAnalysisReport } from "../components/analysis/DebateAnalysisReport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { TopPost, ClusterConsensus, AnalysisData } from "../types";

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

const mockSpiciestPosts: TopPost[] = [
  {
    id: "spicy-1",
    text: "We should completely ban cars in the downtown core to prioritize pedestrian spaces.",
    agreeVotes: 18,
    disagreeVotes: 112,
    passVotes: 25,
    consensusScore: 11.6,
    totalVotes: 155,
  },
  {
    id: "spicy-2",
    text: "Property taxes should be tripled to fund ambitious green initiatives.",
    agreeVotes: 22,
    disagreeVotes: 96,
    passVotes: 14,
    consensusScore: 16.7,
    totalVotes: 132,
  },
  {
    id: "spicy-3",
    text: "All parking lots should be converted to housing developments immediately.",
    agreeVotes: 15,
    disagreeVotes: 78,
    passVotes: 19,
    consensusScore: 13.4,
    totalVotes: 112,
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
          disagreeVotes: 12,
          totalVotes: 92,
          consensusScore: 82.6,
        },
        {
          id: "cluster-0-statement-2",
          text: "Better bike lanes and pedestrian infrastructure encourage healthier transportation options.",
          agreeVotes: 71,
          disagreeVotes: 14,
          totalVotes: 92,
          consensusScore: 77.2,
        },
        {
          id: "cluster-0-statement-3",
          text: "Light rail connections to surrounding suburbs would reduce car dependency.",
          agreeVotes: 65,
          disagreeVotes: 17,
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
          disagreeVotes: 17,
          totalVotes: 85,
          consensusScore: 80.0,
        },
        {
          id: "cluster-1-statement-2",
          text: "Solar panel installations on public buildings would demonstrate our commitment to clean energy.",
          agreeVotes: 62,
          disagreeVotes: 18,
          totalVotes: 85,
          consensusScore: 72.9,
        },
        {
          id: "cluster-1-statement-3",
          text: "Wind energy farms could provide clean power while creating local jobs.",
          agreeVotes: 58,
          disagreeVotes: 19,
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
          disagreeVotes: 11,
          totalVotes: 70,
          consensusScore: 84.3,
        },
        {
          id: "cluster-2-statement-2",
          text: "Neighborhood gardens foster community connections and provide fresh produce access.",
          agreeVotes: 54,
          disagreeVotes: 12,
          totalVotes: 70,
          consensusScore: 77.1,
        },
        {
          id: "cluster-2-statement-3",
          text: "Tree planting programs help combat urban heat islands and improve air quality.",
          agreeVotes: 51,
          disagreeVotes: 13,
          totalVotes: 70,
          consensusScore: 72.9,
        },
      ],
    },
  ],
};

const mockDemographics: Record<string, { [option: string]: number }> = {
  "What is your gender?": {
    "Male": 98,
    "Female": 112,
    "Non-binary": 21,
    "Prefer not to say": 16,
  },
  "What is your age range?": {
    "18–24": 34,
    "25–34": 71,
    "35–44": 63,
    "45–54": 48,
    "55–64": 22,
    "65+": 9,
  },
  "What best describes your political leaning?": {
    "Liberal": 74,
    "Moderate": 89,
    "Conservative": 61,
    "Independent": 23,
  },
  "How long have you lived in this city?": {
    "Less than 1 year": 18,
    "1–5 years": 52,
    "5–10 years": 61,
    "More than 10 years": 116,
  },
};

const defaultAnalysisData: AnalysisData = {
  debateTopic: "What should our city prioritize in the next budget?",
  totalParticipants: 247,
  totalStatements: 156,
  totalVotes: 1842,
  totalPosters: 156,
  totalVoters: 220,
  demographics: {},
  participation: 0.71,
  consensusData: {consensus: 0.62, highConsensusPostCount: 48},
  spicinessData: {spiciness: 0.35, lowConsensusPostCount: 11},
  reachData: {reach: 0.42, postersWithHighConsensusPost: 66},
  topPosts: mockTopPosts,
  spiciestPosts: mockSpiciestPosts,
  clusterConsensus: mockClusterConsensus,
};

export const WithClusters = () => {
  return (
    <DebateAnalysisReport
      {...defaultAnalysisData}
      debateId="demo-debate-123"
      debateTopic="What should our city prioritize in the next budget?"
    />
  );
};

export const WithDemographics = () => {
  return (
    <DebateAnalysisReport
      {...defaultAnalysisData}
      debateId="demo-debate-789"
      debateTopic="What should our city prioritize in the next budget?"
      demographics={mockDemographics}
    />
  );
};

export const NoClusters = () => {
  return (
    <DebateAnalysisReport
      {...defaultAnalysisData}
      debateId="demo-debate-456"
      debateTopic="Should our neighborhood allow food trucks?"
      participation={0.74}
      consensusData={{consensus: 0.45, highConsensusPostCount: 12}}
      spicinessData={{spiciness: 0.68, lowConsensusPostCount: 19}}
      reachData={{reach: 0.28, postersWithHighConsensusPost: 15}}
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
      spiciestPosts={[
        {
          id: "spicy-a",
          text: "Ban all restaurants within 500 feet of food truck locations.",
          agreeVotes: 5,
          disagreeVotes: 34,
          passVotes: 8,
          consensusScore: 10.6,
          totalVotes: 47,
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
        <Tabs defaultValue="with-demographics" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="with-clusters">With Clusters</TabsTrigger>
            <TabsTrigger value="no-clusters">No Clusters</TabsTrigger>
            <TabsTrigger value="with-demographics">With Demographics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="with-clusters">
            <WithClusters />
          </TabsContent>
          
          <TabsContent value="no-clusters">
            <NoClusters />
          </TabsContent>

          <TabsContent value="with-demographics">
            <WithDemographics />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}