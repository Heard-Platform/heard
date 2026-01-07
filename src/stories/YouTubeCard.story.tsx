import { useState } from "react";
import { SwipeableStatementStack } from "../components/room/SwipeableStatementStack";
import { Statement, VoteType, YouTubeCard } from "../types";
import { Card, CardContent } from "../components/ui/card";

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

export function YouTubeCardStory() {
  const [youtubeCardSwiped, setYoutubeCardSwiped] = useState(false);

  const handleVote = async (statementId: string, voteType: VoteType) => {
    console.log("Vote:", { statementId, voteType });
  };

  const handleSubmitStatement = async (text: string) => {
    console.log("Submit statement:", text);
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  const handleYouTubeCardSwiped = async () => {
    console.log("YouTube card swiped");
    setYoutubeCardSwiped(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-100 rounded-lg p-8 flex items-center justify-center">
        <SwipeableStatementStack
          statements={mockStatements}
          currentUserId="story-user"
          allowAnonymous={true}
          isAnonymous={false}
          chanceCardSwiped={true}
          youtubeUrl="https://www.youtube.com/shorts/Ukwy8FqNGZc"
          youtubeCardSwiped={youtubeCardSwiped}
          onVote={handleVote}
          onSubmitStatement={handleSubmitStatement}
          onShowAccountSetupModal={() => {}}
          onChanceCardSwiped={async () => {}}
          onYouTubeCardSwiped={handleYouTubeCardSwiped}
        />
      </div>
    </div>
  );
}