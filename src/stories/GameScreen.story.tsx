import { useState } from "react";
import { GameScreen } from "../screens/GameScreen";
import { StoryContainer } from "./StoryContainer";
import { toast } from "sonner@2.0.3";
import type { UserSession, DebateRoom, Statement, Rant } from "../types";

export function GameScreenStory() {
  const [activeVariant, setActiveVariant] = useState<"no-rant" | "rant-no-votes" | "rant-with-votes">("no-rant");

  // Mock user
  const mockUser: UserSession = {
    id: "user-1",
    nickname: "TestPlayer",
    email: "test@example.com",
    score: 100,
    streak: 3,
    isDeveloper: true,
    lastActive: Date.now(),
  };

  // Mock room
  const mockRoom: DebateRoom = {
    id: "room-1",
    topic: "Pineapple belongs on pizza",
    description: "A heated debate about the most controversial pizza topping.",
    phase: "round1",
    subPhase: "ranting",
    gameNumber: 1,
    roundStartTime: Date.now(),
    participants: ["user-1", "user-2", "user-3"],
    hostId: "user-1",
    isActive: true,
    createdAt: Date.now(),
    mode: "host-controlled",
    rantFirst: true,
  };

  // Mock rants - varies by state
  const mockRantsNoRant: Rant[] = [];
  
  const mockRantsHasRant: Rant[] = [
    {
      id: "rant-1",
      text: "Pineapple on pizza is absolutely disgusting! The sweetness of the fruit completely ruins the savory cheese and sauce. It's a crime against Italian cuisine!",
      author: "TestPlayer",
      roomId: "room-1",
      timestamp: Date.now() - 1000,
    },
    {
      id: "rant-2",
      text: "I actually love pineapple on pizza. The sweet and salty combination is amazing, and it adds a refreshing tropical twist to an otherwise ordinary meal.",
      author: "user-2",
      roomId: "room-1",
      timestamp: Date.now() - 2000,
    },
    {
      id: "rant-3",
      text: "People who hate pineapple pizza have never tried it with the right toppings. Pair it with jalapeños and you get the perfect sweet-spicy combo!",
      author: "user-3",
      roomId: "room-1",
      timestamp: Date.now() - 3000,
    },
  ];

  // Mock statements - varies by state
  const mockStatementsNoVotes: Statement[] = [
    {
      id: "stmt-1",
      text: "Pineapple on pizza ruins the savory flavor profile",
      author: "Anonymous",
      agrees: 0,
      disagrees: 0,
      passes: 0,
      superAgrees: 0,
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
    {
      id: "stmt-2",
      text: "Sweet and salty combinations make food more interesting",
      author: "Anonymous",
      agrees: 0,
      disagrees: 0,
      passes: 0,
      superAgrees: 0,
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
    {
      id: "stmt-3",
      text: "Pineapple pizza with jalapeños is the perfect sweet-spicy balance",
      author: "Anonymous",
      agrees: 0,
      disagrees: 0,
      passes: 0,
      superAgrees: 0,
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {},
    },
  ];

  const mockStatementsWithVotes: Statement[] = [
    {
      id: "stmt-1",
      text: "Pineapple on pizza ruins the savory flavor profile",
      author: "Anonymous",
      agrees: 2,
      disagrees: 5,
      passes: 1,
      superAgrees: 0,
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {
        "user-1": "disagree",
        "user-2": "agree",
        "user-3": "pass",
      },
    },
    {
      id: "stmt-2",
      text: "Sweet and salty combinations make food more interesting",
      author: "Anonymous",
      agrees: 7,
      disagrees: 1,
      passes: 0,
      superAgrees: 2,
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {
        "user-1": "super_agree",
        "user-2": "agree",
        "user-3": "agree",
      },
    },
    {
      id: "stmt-3",
      text: "Pineapple pizza with jalapeños is the perfect sweet-spicy balance",
      author: "Anonymous",
      agrees: 4,
      disagrees: 2,
      passes: 2,
      superAgrees: 1,
      roomId: "room-1",
      timestamp: Date.now(),
      round: 1,
      voters: {
        "user-1": "agree",
        "user-2": "disagree",
        "user-3": "super_agree",
      },
    },
  ];

  // Determine which data to show based on active variant
  const rants = activeVariant === "no-rant" ? mockRantsNoRant : mockRantsHasRant;
  const statements = activeVariant === "rant-with-votes" ? mockStatementsWithVotes : 
                     activeVariant === "rant-no-votes" ? mockStatementsNoVotes : [];

  // Mock handlers
  const handleSubmitStatement = async (text: string) => {
    console.log("Mock submit statement:", text);
  };

  const handleSubmitRant = async (text: string) => {
    console.log("Mock submit rant:", text);
  };

  const handleVote = async (id: string, voteType: string) => {
    console.log("Mock vote:", { id, voteType });
  };

  const handleAdvance = async () => {
    console.log("Mock advance phase");
  };

  const handleStartDebate = async () => {
    console.log("Mock start debate");
  };

  const handleLeaveRoom = () => {
    console.log("Mock leave room");
  };

  const handleNewDiscussion = (statement: Statement) => {
    console.log("Mock new discussion:", statement);
    toast.success(`Creating new discussion: "${statement.text.substring(0, 50)}..." 🔥`);
  };

  const handleScheduleFuture = () => {
    console.log("Mock schedule future");
  };

  const handleSkipToNextStep = async () => {
    console.log("Mock skip to next step");
  };

  const handleStartAutoPlay = () => {
    console.log("Mock start auto-play");
  };

  const handleStopAutoPlay = () => {
    console.log("Mock stop auto-play");
  };

  const handleUpdateRoomDescription = async (description: string) => {
    console.log("Mock update description:", description);
    return true;
  };

  return (
    <StoryContainer
      title="Game Screen"
      variants={[
        { id: "no-rant", label: "No Rant" },
        { id: "rant-no-votes", label: "Rant, No Votes" },
        { id: "rant-with-votes", label: "Rant + Votes" },
      ]}
      activeVariant={activeVariant}
      onVariantChange={setActiveVariant}
      previewClassName="border border-slate-200 rounded-lg overflow-hidden"
      debugInfo={
        <>
          <div><span className="text-slate-400">Rants:</span> {rants.length}</div>
          <div><span className="text-slate-400">Statements:</span> {statements.length}</div>
          <div><span className="text-slate-400">Total votes:</span> {statements.reduce((sum, s) => sum + s.agrees + s.disagrees + s.passes + s.superAgrees, 0)}</div>
        </>
      }
    >
      <GameScreen
        user={mockUser}
        room={mockRoom}
        statements={statements}
        rants={rants}
        timerActive={false}
        lastAchievement={null}
        autoPlayActive={false}
        startingDebate={false}
        onSubmitStatement={handleSubmitStatement}
        onSubmitRant={handleSubmitRant}
        onVote={handleVote}
        onAdvance={handleAdvance}
        onStartDebate={handleStartDebate}
        onLeaveRoom={handleLeaveRoom}
        onNewDiscussion={handleNewDiscussion}
        onScheduleFuture={handleScheduleFuture}
        onSkipToNextStep={handleSkipToNextStep}
        onStartAutoPlay={handleStartAutoPlay}
        onStopAutoPlay={handleStopAutoPlay}
        onUpdateRoomDescription={handleUpdateRoomDescription}
      />
    </StoryContainer>
  );
}
