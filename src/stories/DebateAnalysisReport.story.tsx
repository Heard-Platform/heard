import { useState } from "react";
import { DebateAnalysisView } from "../components/DebateAnalysisView";
import { Button } from "../components/ui/button";
import { BarChart3 } from "lucide-react";

const TEST_DATA = {
  totalParticipants: 42,
  totalStatements: 28,
  totalVotes: 156,
  topPosts: [
    {
      id: "1",
      text: "We should prioritize sustainable infrastructure that serves future generations while addressing immediate needs.",
      agreeVotes: 35,
      disagreeVotes: 4,
      passVotes: 3,
      consensusScore: 83,
    },
    {
      id: "2",
      text: "Community input should drive development decisions, with transparent processes for all stakeholders.",
      agreeVotes: 32,
      disagreeVotes: 6,
      passVotes: 4,
      consensusScore: 76,
    },
    {
      id: "3",
      text: "Balancing economic growth with environmental protection requires innovative solutions and compromise.",
      agreeVotes: 28,
      disagreeVotes: 9,
      passVotes: 5,
      consensusScore: 67,
    },
  ],
};

export function DebateAnalysisReportStory() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-full max-w-md"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Open Analysis Report
        </Button>
      </div>

      {isOpen && (
        <DebateAnalysisView
          roomId="demo-room-id-12345"
          debateTopic="Community Development Priorities"
          totalParticipants={TEST_DATA.totalParticipants}
          totalStatements={TEST_DATA.totalStatements}
          totalVotes={TEST_DATA.totalVotes}
          topPosts={TEST_DATA.topPosts}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}