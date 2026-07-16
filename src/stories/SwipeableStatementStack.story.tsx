import { useEffect, useState } from "react";
import { SwipeableStatementStack } from "../components/room/SwipeableStatementStack";
import { ChanceCard } from "../components/room/ChanceCard";
import { Statement, VoteType } from "../types";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Toaster } from "../components/ui/sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { mockRooms } from "./mockData";

const mockStatements: Statement[] = [
  {
    id: "stmt-1",
    text: "Climate change is the most pressing issue of our generation and requires immediate global action.",
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
    text: "Universal basic income would solve more problems than it creates in modern society.",
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
    text: "Social media has done more harm than good for mental health and society.",
    author: "user-3",
    agrees: 56,
    disagrees: 18,
    passes: 5,
    superAgrees: 34,
    roomId: "room-1",
    timestamp: Date.now() - 180000,
    round: 1,
    voters: {},
    type: "bridge",
  },
  {
    id: "stmt-4",
    text: "Remote work should be the default for all jobs that can be done digitally.",
    author: "user-4",
    agrees: 41,
    disagrees: 22,
    passes: 7,
    superAgrees: 19,
    roomId: "room-1",
    timestamp: Date.now() - 120000,
    round: 1,
    voters: {},
    type: "crux",
  },
  {
    id: "stmt-5",
    text: "The education system needs a complete overhaul to prepare students for the modern world.",
    author: "user-5",
    agrees: 48,
    disagrees: 15,
    passes: 4,
    superAgrees: 27,
    roomId: "room-1",
    timestamp: Date.now() - 60000,
    round: 1,
    voters: {},
    type: "plurality",
  },
  {
    id: "stmt-6",
    text: "Artificial intelligence will create more jobs than it destroys in the long run.",
    author: "user-6",
    agrees: 29,
    disagrees: 35,
    passes: 11,
    superAgrees: 12,
    roomId: "room-1",
    timestamp: Date.now() - 30000,
    round: 1,
    voters: {},
    isSpicy: true,
  },
  {
    id: "stmt-7",
    text: "Cities should ban cars from downtown areas to reduce pollution and improve quality of life.",
    author: "user-7",
    agrees: 38,
    disagrees: 31,
    passes: 9,
    superAgrees: 18,
    roomId: "room-1",
    timestamp: Date.now() - 15000,
    round: 1,
    voters: {},
  },
];

const shareStoryStatement: Statement = {
  id: "share-story-stmt-1",
  text: "Pineapple belongs on pizza.",
  author: "user-1",
  agrees: 45,
  disagrees: 52,
  passes: 3,
  superAgrees: 8,
  roomId: "room-1",
  timestamp: Date.now() - 60000,
  round: 1,
  voters: {},
};

export function SwipeableStatementStackStory() {
  const [chanceCardSwiped, setChanceCardSwiped] = useState(false);
  const [coverCardSwiped, setCoverCardSwiped] = useState(false);
  const [shareCardSwiped, setShareCardSwiped] = useState(false);
  const [shareStoryKey, setShareStoryKey] = useState(0);

  const storyRoom = mockRooms[0];
  const cover = storyRoom.imageUrl
    ? { type: "image" as const, url: storyRoom.imageUrl, description: storyRoom.description }
    : null;

  useEffect(() => {
    const checkChanceCardSwiped = async (
      userId: string,
      roomId: string,
    ) => {
      console.log("Check chance card swiped:", {
        userId,
        roomId,
        swiped: chanceCardSwiped,
      });
      await new Promise((resolve) => setTimeout(resolve, 300));
      return chanceCardSwiped;
    };
    checkChanceCardSwiped("story-user", "room-1");
  }, [chanceCardSwiped]);

  const handleVote = async (
    statementId: string,
    voteType: VoteType,
  ) => {
    console.log("Vote:", { statementId, voteType });
  };

  const handleSubmitStatement = async (text: string) => {
    console.log("Submit statement:", text);
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  const handleChanceCardSwiped = async () => {
    console.log("Mark chance card swiped");
    await new Promise((resolve) => setTimeout(resolve, 100));
    setChanceCardSwiped(true);
  };

  const handleCoverCardSwiped = async () => {
    console.log("Mark cover card swiped");
    await new Promise((resolve) => setTimeout(resolve, 100));
    setCoverCardSwiped(true);
  };

  const handleShareCardSwiped = async () => {
    console.log("Mark share card swiped");
    await new Promise((resolve) => setTimeout(resolve, 100));
    setShareCardSwiped(true);
  };

  const handleReset = () => {
    setChanceCardSwiped(false);
    setCoverCardSwiped(false);
    setShareCardSwiped(false);
  };

  const handleResetShareStory = () => {
    setShareStoryKey((key) => key + 1);
  };

  return (
    <div className="space-y-6">
      <Toaster />

      <Tabs defaultValue="stack" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="stack">Swipeable Stack</TabsTrigger>
          <TabsTrigger value="chance-card">Chance Card Only</TabsTrigger>
          <TabsTrigger value="share-card">Share Card</TabsTrigger>
        </TabsList>

        <TabsContent value="stack">
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handleReset} variant="outline" size="sm">
                    Reset Story
                  </Button>
                  <Button
                    onClick={() => setChanceCardSwiped(!chanceCardSwiped)}
                    variant="outline"
                    size="sm"
                  >
                    {chanceCardSwiped ? "Show Chance Card" : "Hide Chance Card"}
                  </Button>
                  <Button
                    onClick={() => setCoverCardSwiped(!coverCardSwiped)}
                    variant="outline"
                    size="sm"
                  >
                    {coverCardSwiped ? "Show Cover Card" : "Hide Cover Card"}
                  </Button>
                </div>

                <div className="p-4 rounded-lg border bg-muted/30 space-y-1">
                  <div>
                    <span className="text-muted-foreground">Chance Card:</span>{" "}
                    <span className="font-medium">
                      {chanceCardSwiped ? "Swiped" : "Not Swiped"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cover Card:</span>{" "}
                    <span className="font-medium">
                      {coverCardSwiped ? "Swiped" : "Not Swiped"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Share Card:</span>{" "}
                    <span className="font-medium">
                      {shareCardSwiped ? "Swiped" : "Not Swiped"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-slate-100 rounded-lg p-8 min-h-[600px] flex items-center justify-center">
              <SwipeableStatementStack
                room={storyRoom}
                statements={mockStatements}
                currentUserId="story-user"
                allowAnonymous={true}
                isAnonymous={false}
                chanceCardSwiped={chanceCardSwiped}
                cover={cover}
                coverCardSwiped={coverCardSwiped}
                shareCardSwiped={shareCardSwiped}
                demographicQuestions={[]}
                answeredQuestionIds={new Set()}
                isActive={true}
                onVote={handleVote}
                onSubmitStatement={handleSubmitStatement}
                onShowAccountSetupModal={() => {}}
                onChanceCardSwiped={handleChanceCardSwiped}
                onCoverCardSwiped={handleCoverCardSwiped}
                onShareCardSwiped={handleShareCardSwiped}
                onCertifyDone={async () => {}}
                onDemographicsAnswered={async () => {}}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="share-card">
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handleResetShareStory} variant="outline" size="sm">
                    Reset Story
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Vote on the one statement below to reveal the share card,
                  which invites the voter to find out where their friends land.
                </p>
              </CardContent>
            </Card>

            <div className="bg-slate-100 rounded-lg p-8 min-h-[600px] flex items-center justify-center">
              <SwipeableStatementStack
                key={shareStoryKey}
                room={storyRoom}
                statements={[shareStoryStatement]}
                currentUserId="story-user"
                allowAnonymous={true}
                isAnonymous={false}
                chanceCardSwiped={true}
                cover={null}
                coverCardSwiped={true}
                shareCardSwiped={false}
                demographicQuestions={[]}
                answeredQuestionIds={new Set()}
                isActive={true}
                onVote={handleVote}
                onSubmitStatement={handleSubmitStatement}
                onShowAccountSetupModal={() => {}}
                onChanceCardSwiped={handleChanceCardSwiped}
                onCoverCardSwiped={handleCoverCardSwiped}
                onShareCardSwiped={async () => console.log("Mark share card swiped")}
                onCertifyDone={async () => {}}
                onDemographicsAnswered={async () => {}}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chance-card">
          <div className="space-y-6">
            <div className="bg-slate-100 rounded-lg p-8 min-h-[600px] flex items-center justify-center">
              <div className="w-full max-w-md">
                <div className="p-6 rounded-xl border-2 shadow-xl bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-300">
                  <ChanceCard
                    room={mockRooms[0]}
                    isTopCard={true}
                    allowAnonymous={true}
                    isAnonymous={false}
                    onSubmitStatement={handleSubmitStatement}
                    onShowAccountSetupModal={() => {}}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
