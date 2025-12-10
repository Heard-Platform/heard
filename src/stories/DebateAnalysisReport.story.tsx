import { DebateAnalysisReport } from "../components/DebateAnalysisReport";

const mockTopPosts = [
  {
    id: "post-1",
    text: "We should invest more in renewable energy infrastructure to reduce our carbon footprint and create green jobs for the future.",
    agreeVotes: 142,
    disagreeVotes: 23,
    passVotes: 15,
    consensusScore: 78.9,
  },
  {
    id: "post-2",
    text: "Public transportation improvements should be prioritized over expanding highway systems to reduce traffic congestion.",
    agreeVotes: 98,
    disagreeVotes: 45,
    passVotes: 22,
    consensusScore: 59.4,
  },
  {
    id: "post-3",
    text: "Community gardens and urban green spaces contribute significantly to neighborhood wellbeing and should receive more funding.",
    agreeVotes: 87,
    disagreeVotes: 31,
    passVotes: 28,
    consensusScore: 59.6,
  },
];

export function DebateAnalysisReportStory() {
  return (
    <div className="min-h-screen">
      <DebateAnalysisReport
        debateId="demo-debate-123"
        debateTopic="What should our city prioritize in the next budget?"
        totalParticipants={247}
        totalStatements={156}
        totalVotes={1842}
        topPosts={mockTopPosts}
      />
    </div>
  );
}