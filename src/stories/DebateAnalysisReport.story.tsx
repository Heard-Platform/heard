import { DebateAnalysisReport } from "../components/analysis/DebateAnalysisReport";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  StatementVotes,
  ClusterConsensus,
  AnalysisData,
} from "../types";

export default {
  title: "Analysis/Report",
};

const mockTopAgreedPosts: StatementVotes[] = [
  {
    id: "post-1",
    text: "We should invest more in renewable energy infrastructure to reduce our carbon footprint and create green jobs for the future.",
    agreeVotes: 170,
    rawAgreeVotes: 142,
    superAgreeVotes: 28,
    disagreeVotes: 23,
    passVotes: 15,
    consensusScore: 78.9,
    totalVotes: 180,
    clusterVotes: [
      { clusterId: 0, clusterSize: 92, agreeVotes: 70, superAgreeVotes: 12, disagreeVotes: 8, passVotes: 5 },
      { clusterId: 1, clusterSize: 85, agreeVotes: 60, superAgreeVotes: 10, disagreeVotes: 10, passVotes: 6 },
      { clusterId: 2, clusterSize: 70, agreeVotes: 40, superAgreeVotes: 6, disagreeVotes: 5, passVotes: 4 },
    ],
    mergedFrom: [],
  },
  {
    id: "post-2",
    text: "Public transportation improvements should be prioritized over expanding highway systems to reduce traffic congestion.",
    agreeVotes: 112,
    rawAgreeVotes: 98,
    superAgreeVotes: 14,
    disagreeVotes: 45,
    passVotes: 22,
    consensusScore: 59.4,
    totalVotes: 165,
    clusterVotes: [
      { clusterId: 0, clusterSize: 92, agreeVotes: 50, superAgreeVotes: 6, disagreeVotes: 14, passVotes: 8 },
      { clusterId: 1, clusterSize: 85, agreeVotes: 40, superAgreeVotes: 5, disagreeVotes: 15, passVotes: 8 },
      { clusterId: 2, clusterSize: 70, agreeVotes: 22, superAgreeVotes: 3, disagreeVotes: 16, passVotes: 6 },
    ],
    mergedFrom: [],
  },
  {
    id: "post-3",
    text: "Community gardens and urban green spaces contribute significantly to neighborhood wellbeing and should receive more funding.",
    agreeVotes: 98,
    rawAgreeVotes: 87,
    superAgreeVotes: 11,
    disagreeVotes: 31,
    passVotes: 28,
    consensusScore: 59.6,
    totalVotes: 146,
    clusterVotes: [
      { clusterId: 0, clusterSize: 92, agreeVotes: 42, superAgreeVotes: 5, disagreeVotes: 10, passVotes: 10 },
      { clusterId: 1, clusterSize: 85, agreeVotes: 34, superAgreeVotes: 4, disagreeVotes: 10, passVotes: 10 },
      { clusterId: 2, clusterSize: 70, agreeVotes: 22, superAgreeVotes: 2, disagreeVotes: 11, passVotes: 8 },
    ],
    mergedFrom: [],
  },
];

const mockTopDisagreedPosts: StatementVotes[] = [
  {
    id: "spicy-1",
    text: "We should completely ban cars in the downtown core to prioritize pedestrian spaces.",
    agreeVotes: 21,
    rawAgreeVotes: 18,
    superAgreeVotes: 3,
    disagreeVotes: 112,
    passVotes: 25,
    consensusScore: 11.6,
    totalVotes: 155,
    clusterVotes: [
      { clusterId: 0, clusterSize: 92, agreeVotes: 10, superAgreeVotes: 2, disagreeVotes: 45, passVotes: 10 },
      { clusterId: 1, clusterSize: 85, agreeVotes: 8, superAgreeVotes: 1, disagreeVotes: 42, passVotes: 10 },
      { clusterId: 2, clusterSize: 70, agreeVotes: 3, superAgreeVotes: 0, disagreeVotes: 25, passVotes: 5 },
    ],
    mergedFrom: [],
  },
  {
    id: "spicy-2",
    text: "Property taxes should be tripled to fund ambitious green initiatives.",
    agreeVotes: 24,
    rawAgreeVotes: 22,
    superAgreeVotes: 2,
    disagreeVotes: 96,
    passVotes: 14,
    consensusScore: 16.7,
    totalVotes: 132,
    clusterVotes: [
      { clusterId: 0, clusterSize: 92, agreeVotes: 12, superAgreeVotes: 1, disagreeVotes: 38, passVotes: 5 },
      { clusterId: 1, clusterSize: 85, agreeVotes: 8, superAgreeVotes: 1, disagreeVotes: 35, passVotes: 5 },
      { clusterId: 2, clusterSize: 70, agreeVotes: 4, superAgreeVotes: 0, disagreeVotes: 23, passVotes: 4 },
    ],
    mergedFrom: [],
  },
  {
    id: "spicy-3",
    text: "All parking lots should be converted to housing developments immediately.",
    agreeVotes: 16,
    rawAgreeVotes: 15,
    superAgreeVotes: 1,
    disagreeVotes: 78,
    passVotes: 19,
    consensusScore: 13.4,
    totalVotes: 112,
    clusterVotes: [
      { clusterId: 0, clusterSize: 92, agreeVotes: 8, superAgreeVotes: 1, disagreeVotes: 32, passVotes: 8 },
      { clusterId: 1, clusterSize: 85, agreeVotes: 5, superAgreeVotes: 0, disagreeVotes: 28, passVotes: 7 },
      { clusterId: 2, clusterSize: 70, agreeVotes: 3, superAgreeVotes: 0, disagreeVotes: 18, passVotes: 4 },
    ],
    mergedFrom: [],
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
          distinguishingScore: 82.6,
        },
        {
          id: "cluster-0-statement-2",
          text: "Better bike lanes and pedestrian infrastructure encourage healthier transportation options.",
          agreeVotes: 71,
          disagreeVotes: 14,
          totalVotes: 92,
          distinguishingScore: 77.2,
        },
        {
          id: "cluster-0-statement-3",
          text: "Light rail connections to surrounding suburbs would reduce car dependency.",
          agreeVotes: 65,
          disagreeVotes: 17,
          totalVotes: 92,
          distinguishingScore: 70.7,
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
          distinguishingScore: 80.0,
        },
        {
          id: "cluster-1-statement-2",
          text: "Solar panel installations on public buildings would demonstrate our commitment to clean energy.",
          agreeVotes: 62,
          disagreeVotes: 18,
          totalVotes: 85,
          distinguishingScore: 72.9,
        },
        {
          id: "cluster-1-statement-3",
          text: "Wind energy farms could provide clean power while creating local jobs.",
          agreeVotes: 58,
          disagreeVotes: 19,
          totalVotes: 85,
          distinguishingScore: 68.2,
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
          distinguishingScore: 84.3,
        },
        {
          id: "cluster-2-statement-2",
          text: "Neighborhood gardens foster community connections and provide fresh produce access.",
          agreeVotes: 54,
          disagreeVotes: 12,
          totalVotes: 70,
          distinguishingScore: 77.1,
        },
        {
          id: "cluster-2-statement-3",
          text: "Tree planting programs help combat urban heat islands and improve air quality.",
          agreeVotes: 51,
          disagreeVotes: 13,
          totalVotes: 70,
          distinguishingScore: 72.9,
        },
      ],
    },
  ],
};

const mockDemographics: Record<string, { [option: string]: number }> =
  {
    "What is your gender?": {
      Male: 98,
      Female: 112,
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
      Liberal: 74,
      Moderate: 89,
      Conservative: 61,
      Independent: 23,
    },
    "How long have you lived in this city?": {
      "Less than 1 year": 18,
      "1–5 years": 52,
      "5–10 years": 61,
      "More than 10 years": 116,
    },
  };

const mockAllStatements: StatementVotes[] = [
  ...mockTopAgreedPosts,
  ...mockTopDisagreedPosts,
];

const defaultAnalysisData: AnalysisData = {
  debateTopic: "What should our city prioritize in the next budget?",
  totalParticipants: 247,
  totalStatements: 156,
  totalVotes: 1842,
  totalPosters: 156,
  totalVoters: 220,
  demographics: {},
  participation: 0.71,
  topAgreedPosts: mockTopAgreedPosts,
  topDisagreedPosts: mockTopDisagreedPosts,
  spiciestPosts: [],
  clusterConsensus: mockClusterConsensus,
  allStatements: mockAllStatements,
};

export const WithClusters = () => {
  return (
    <DebateAnalysisReport
      {...defaultAnalysisData}
      debateId="demo-debate-123"
      debateTopic="What should our city prioritize in the next budget?"
      isModerator={false}
      selectedTags={[]}
      onSelectedTagsChange={() => {}}
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
      isModerator={false}
      selectedTags={[]}
      onSelectedTagsChange={() => {}}
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
      topAgreedPosts={[
        {
          id: "post-a",
          text: "Food trucks bring variety and support small businesses in our community.",
          agreeVotes: 32,
          rawAgreeVotes: 28,
          superAgreeVotes: 4,
          disagreeVotes: 8,
          passVotes: 6,
          consensusScore: 66.7,
          totalVotes: 42,
          mergedFrom: [],
          clusterVotes: [],
        },
        {
          id: "post-b",
          text: "We need to consider parking and traffic impacts before allowing food trucks.",
          agreeVotes: 26,
          rawAgreeVotes: 24,
          superAgreeVotes: 2,
          disagreeVotes: 12,
          passVotes: 6,
          consensusScore: 57.1,
          totalVotes: 42,
          mergedFrom: [],
          clusterVotes: [],
        },
      ]}
      topDisagreedPosts={[
        {
          id: "post-c",
          text: "Ban all restaurants within 500 feet of food truck locations.",
          agreeVotes: 6,
          rawAgreeVotes: 5,
          superAgreeVotes: 1,
          disagreeVotes: 34,
          passVotes: 8,
          consensusScore: 70.0,
          totalVotes: 47,
          mergedFrom: [],
          clusterVotes: [],
        },
      ]}
      spiciestPosts={[]}
      clusterConsensus={null}
      isModerator={false}
      selectedTags={[]}
      onSelectedTagsChange={() => {}}
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
            <TabsTrigger value="with-clusters">
              With Clusters
            </TabsTrigger>
            <TabsTrigger value="no-clusters">No Clusters</TabsTrigger>
            <TabsTrigger value="with-demographics">
              With Demographics
            </TabsTrigger>
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
