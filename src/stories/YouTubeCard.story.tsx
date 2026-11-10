import { useState } from "react";
import { SwipeableStatementStack } from "../components/room/SwipeableStatementStack";
import { FullCoverData, Statement, VoteType } from "../types";
import { Button } from "../components/ui/button";
import { mockRooms } from "./mockData";

const mockStatements: Statement[] = [
  {
    id: "stmt-1",
    text: "This video perfectly captures the essence of modern debate culture.",
    author: "user-1",
    agrees: 45,
    disagrees: 12,
    passes: 3,
    superAgrees: 23,
    roomId: "room-1",
    timestamp: Date.now() - 300000,
    round: 1,
    voters: {},
    isSpicy: false,
  },
  {
    id: "stmt-2",
    text: "The arguments presented in the video are compelling and well-researched.",
    author: "user-2",
    agrees: 32,
    disagrees: 28,
    passes: 8,
    superAgrees: 15,
    roomId: "room-1",
    timestamp: Date.now() - 240000,
    round: 1,
    voters: {},
    isSpicy: true,
  },
  {
    id: "stmt-3",
    text: "I think the video raises important questions about how we approach discussions.",
    author: "user-3",
    agrees: 56,
    disagrees: 18,
    passes: 5,
    superAgrees: 34,
    roomId: "room-1",
    timestamp: Date.now() - 180000,
    round: 1,
    voters: {},
  },
];

const YOUTUBE_COVER: FullCoverData = { type: "youtube", url: "https://www.youtube.com/shorts/Ukwy8FqNGZc" };
const IMAGE_COVER: FullCoverData = { type: "image", url: "/live-preview.png" };

const handleVote = async (statement: Statement, voteType: VoteType) => {
  console.log("Vote:", { statementId: statement.id, voteType });
};

const handleSubmitStatement = async (text: string) => {
  console.log("Submit statement:", text);
  await new Promise((resolve) => setTimeout(resolve, 500));
};

export function YouTubeCardStory() {
  return (
    <div className="space-y-6">
      <CoverCardStack label="YouTube cover" cover={YOUTUBE_COVER} />
      <CoverCardStack label="Image cover" cover={IMAGE_COVER} />
    </div>
  );
}

function CoverCardStack({ label, cover }: { label: string; cover: FullCoverData }) {
  const [coverCardSwiped, setCoverCardSwiped] = useState(false);
  const markCoverCardSwiped = async () => setCoverCardSwiped(true);
  const showCoverCardAgain = () => setCoverCardSwiped(false);

  return (
    <div className="bg-slate-100 rounded-lg p-8 flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-600">{label}</span>
        <Button size="sm" variant="outline" onClick={showCoverCardAgain}>
          Show cover again
        </Button>
      </div>
      <SwipeableStatementStack
        room={mockRooms[0]}
        statements={mockStatements}
        currentUserId="story-user"
        allowAnonymous={true}
        isAnonymous={false}
        chanceCardSwiped={true}
        cover={cover}
        coverCardSwiped={coverCardSwiped}
        demographicQuestions={[]}
        answeredQuestionIds={new Set()}
        onVote={handleVote}
        onSubmitStatement={handleSubmitStatement}
        onShowAccountSetupModal={() => {}}
        onChanceCardSwiped={async () => {}}
        onCoverCardSwiped={markCoverCardSwiped}
        onDemographicsAnswered={() => {}}
        feedbackStatement={null}
        onFeedbackVoted={() => {}}
        onFeedbackTellMore={() => {}}
        onKeepVoting={() => {}}
      />
    </div>
  );
}
