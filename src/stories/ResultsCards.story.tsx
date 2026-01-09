import { useState } from "react";
import { ConcludedResults } from "../components/results/ConcludedResults";
import { InProgressResults } from "../components/results/InProgressResults";
import { Statement } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export default {
  title: "Results/Cards",
};

// Mock data
const mockStatements: Statement[] = [
  {
    id: "stmt1",
    text: "Social media has fundamentally changed how we communicate, and not necessarily for the better. We spend more time crafting perfect online personas than having real conversations.",
    author: "TechSkeptic",
    agrees: 12,
    disagrees: 3,
    passes: 1,
    superAgrees: 2,
    roomId: "mock-room",
    timestamp: Date.now(),
    round: 1,
    voters: {},
  },
  {
    id: "stmt2",
    text: "The convenience of social media connecting people across distances far outweighs any downsides. It has democratized information and given voice to the voiceless.",
    author: "DigitalOptimist",
    agrees: 15,
    disagrees: 2,
    passes: 0,
    superAgrees: 3,
    roomId: "mock-room",
    timestamp: Date.now(),
    round: 1,
    voters: {},
  },
  {
    id: "stmt3",
    text: "We need to find a middle ground. Social media is a tool, and like any tool, it depends on how we use it. The problem is not the platform but our relationship with it.",
    author: "BalancedView",
    agrees: 8,
    disagrees: 5,
    passes: 2,
    superAgrees: 1,
    roomId: "mock-room",
    timestamp: Date.now(),
    round: 1,
    voters: {},
  },
  {
    id: "stmt4",
    text: "The mental health impacts are undeniable. Studies show increased anxiety and depression correlating with social media use, especially among young people.",
    author: "DataDriven",
    agrees: 10,
    disagrees: 4,
    passes: 1,
    superAgrees: 2,
    roomId: "mock-room",
    timestamp: Date.now(),
    round: 1,
    voters: {},
  },
  {
    id: "stmt5",
    text: "Before social media, people were just as addicted to TV or newspapers. Every generation fears new technology. This is just the latest moral panic.",
    author: "HistoryBuff",
    agrees: 6,
    disagrees: 8,
    passes: 3,
    superAgrees: 0,
    roomId: "mock-room",
    timestamp: Date.now(),
    round: 1,
    voters: {},
  },
];



export const ConcludedDebate = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <ConcludedResults
        statements={mockStatements}
        onDiscuss={(text) => console.log("Discuss:", text)}
        onShare={() => console.log("Share")}
        onBackToLobby={() => console.log("Back to lobby")}
      />
    </div>
  );
};

export const InProgressDebate = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <InProgressResults
        statements={mockStatements}
        debateTitle="Is social media good or bad for society?"
        onChangeVote={async () => {}}
      />
    </div>
  );
};

export const FewPlayers = () => {
  const fewStatements = mockStatements.slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <ConcludedResults
        statements={fewStatements}
        onDiscuss={(text) => console.log("Discuss:", text)}
        onShare={() => console.log("Share")}
        onBackToLobby={() => console.log("Back to lobby")}
      />
    </div>
  );
};

export const ManyPlayers = () => {
  const moreStatements: Statement[] = [...mockStatements];

  // Add more mock statements
  for (let i = 6; i <= 15; i++) {
    moreStatements.push({
      id: `stmt${i}`,
      text: `This is statement number ${i} with some interesting thoughts about the topic.`,
      author: `Player${i}`,
      agrees: Math.floor(Math.random() * 20),
      disagrees: Math.floor(Math.random() * 10),
      passes: Math.floor(Math.random() * 5),
      superAgrees: Math.floor(Math.random() * 5),
      roomId: "mock-room",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <ConcludedResults
        statements={moreStatements}
        onDiscuss={(text) => console.log("Discuss:", text)}
        onShare={() => console.log("Share")}
        onBackToLobby={() => console.log("Back to lobby")}
      />
    </div>
  );
};

export const TiedVotes = () => {
  const tiedStatements = mockStatements.map((stmt) => ({
    ...stmt,
    agrees: 10,
    disagrees: 5,
    passes: 2,
    superAgrees: 1,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <ConcludedResults
        statements={tiedStatements}
        onDiscuss={(text) => console.log("Discuss:", text)}
        onShare={() => console.log("Share")}
        onBackToLobby={() => console.log("Back to lobby")}
      />
    </div>
  );
};

export const ControversialDebate = () => {
  // Create statements with very close vote counts to trigger controversial
  const controversialStatements = mockStatements.map(
    (stmt, idx) => ({
      ...stmt,
      agrees: 10 + (idx % 2), // Alternate between 10 and 11
      disagrees: 10 - (idx % 2), // Create controversy with close agree/disagree
      passes: 2,
      superAgrees: 1,
    }),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <ConcludedResults
        statements={controversialStatements}
        onDiscuss={(text) => console.log("Discuss:", text)}
        onShare={() => console.log("Share")}
        onBackToLobby={() => console.log("Back to lobby")}
      />
    </div>
  );
};

export const LandslideVictory = () => {
  const landslideStatements = [
    { ...mockStatements[0], agrees: 50, disagrees: 1, passes: 0, superAgrees: 10 },
    { ...mockStatements[1], agrees: 5, disagrees: 40, passes: 5, superAgrees: 0 },
    { ...mockStatements[2], agrees: 3, disagrees: 35, passes: 8, superAgrees: 0 },
    { ...mockStatements[3], agrees: 2, disagrees: 30, passes: 10, superAgrees: 0 },
    { ...mockStatements[4], agrees: 1, disagrees: 25, passes: 12, superAgrees: 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <ConcludedResults
        statements={landslideStatements}
        onDiscuss={(text) => console.log("Discuss:", text)}
        onShare={() => console.log("Share")}
        onBackToLobby={() => console.log("Back to lobby")}
      />
    </div>
  );
};

// Main story component for ComponentShowcase
export function ResultsCardsStory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Results Cards</CardTitle>
        <CardDescription>
          Different result scenarios showing concluded and in-progress debates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="concluded" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="concluded">Concluded</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="few">Few Players</TabsTrigger>
            <TabsTrigger value="many">Many Players</TabsTrigger>
            <TabsTrigger value="tied">Tied Votes</TabsTrigger>
            <TabsTrigger value="controversial">Controversial</TabsTrigger>
            <TabsTrigger value="landslide">Landslide</TabsTrigger>
          </TabsList>
          
          <TabsContent value="concluded">
            <ConcludedDebate />
          </TabsContent>
          
          <TabsContent value="in-progress">
            <InProgressDebate />
          </TabsContent>
          
          <TabsContent value="few">
            <FewPlayers />
          </TabsContent>
          
          <TabsContent value="many">
            <ManyPlayers />
          </TabsContent>
          
          <TabsContent value="tied">
            <TiedVotes />
          </TabsContent>
          
          <TabsContent value="controversial">
            <ControversialDebate />
          </TabsContent>
          
          <TabsContent value="landslide">
            <LandslideVictory />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}