import { useEffect, useState } from "react";
import { SwipeableStatementStack } from "../components/room/SwipeableStatementStack";
import { ChanceCard } from "../components/room/ChanceCard";
import { Statement, VoteType } from "../types";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Toaster } from "../components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

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

export function SwipeableStatementStackStory() {
  const [chanceCardSwiped, setChanceCardSwiped] = useState(false);

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

  const handleReset = () => {
    setChanceCardSwiped(false);
  };

  return (
    <div className="space-y-6">
      <Toaster />
      
      <Tabs defaultValue="stack" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="stack">Swipeable Stack</TabsTrigger>
          <TabsTrigger value="chance-card">Chance Card Only</TabsTrigger>
        </TabsList>

        <TabsContent value="stack">
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
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
                </div>

                <div className="p-4 rounded-lg border bg-muted/30">
                  <span className="text-muted-foreground">Chance Card:</span>{" "}
                  <span className="font-medium">
                    {chanceCardSwiped ? "Swiped" : "Not Swiped"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-slate-100 rounded-lg p-8 min-h-[600px] flex items-center justify-center">
              <SwipeableStatementStack
                statements={mockStatements}
                currentUserId="story-user"
                allowAnonymous={true}
                isAnonymous={false}
                chanceCardSwiped={chanceCardSwiped}
                checkingChanceCard={false}
                onVote={handleVote}
                onSubmitStatement={handleSubmitStatement}
                onShowAccountSetupModal={() => {}}
                onChanceCardSwiped={handleChanceCardSwiped}
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
                    isTopCard={true}
                    onSubmitStatement={handleSubmitStatement}
                    allowAnonymous={true}
                    isAnonymous={false}
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