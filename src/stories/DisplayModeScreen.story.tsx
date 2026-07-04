import { useState } from "react";
import { DisplayModeScreen } from "../components/DisplayModeScreen";
import type { DebateRoom, Statement } from "../types";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export default {
  title: "Display/DisplayModeScreen",
};

const mockRoom: DebateRoom = {
  id: "mock-room",
  topic: "Should the city add a protected bike lane on Main Street?",
  phase: "results",
  gameNumber: 1,
  roundStartTime: Date.now(),
  participants: Array.from({ length: 42 }, (_, i) => `user-${i}`),
  hostId: "host-1",
  isActive: true,
  createdAt: Date.now(),
  mode: "host-controlled",
  demographicQuestions: [],
};

const mockStatements: Statement[] = [
  {
    id: "stmt1",
    text: "A protected bike lane would make it much safer for kids biking to school.",
    author: "SafeStreetsFan",
    agrees: 34,
    disagrees: 4,
    passes: 2,
    superAgrees: 9,
    type: "bridge",
    roomId: "mock-room",
    timestamp: Date.now(),
    round: 1,
    voters: {},
  },
  {
    id: "stmt2",
    text: "Removing street parking for a bike lane will hurt small businesses on Main Street.",
    author: "MainStreetMerchant",
    agrees: 18,
    disagrees: 20,
    passes: 3,
    superAgrees: 1,
    roomId: "mock-room",
    timestamp: Date.now(),
    round: 1,
    voters: {},
  },
  {
    id: "stmt3",
    text: "We should pilot the bike lane for six months before making it permanent.",
    author: "PragmaticPlanner",
    agrees: 27,
    disagrees: 3,
    passes: 6,
    superAgrees: 2,
    type: "bridge",
    roomId: "mock-room",
    timestamp: Date.now(),
    round: 1,
    voters: {},
  },
  {
    id: "stmt4",
    text: "Emergency vehicle response times could be affected by a narrower road.",
    author: "SafetyFirst",
    agrees: 9,
    disagrees: 11,
    passes: 4,
    superAgrees: 0,
    type: "crux",
    roomId: "mock-room",
    timestamp: Date.now(),
    round: 1,
    voters: {},
  },
  {
    id: "stmt5",
    text: "Honestly, most people will just keep driving no matter what we build.",
    author: "Skeptic99",
    agrees: 3,
    disagrees: 1,
    passes: 1,
    superAgrees: 0,
    roomId: "mock-room",
    timestamp: Date.now(),
    round: 1,
    voters: {},
  },
  {
    id: "stmt6",
    text: "Cities that added protected bike lanes saw retail sales go up, not down.",
    author: "DataDrivenDan",
    agrees: 22,
    disagrees: 6,
    passes: 2,
    superAgrees: 4,
    roomId: "mock-room",
    timestamp: Date.now(),
    round: 1,
    voters: {},
  },
];

type Scenario = "live" | "waiting" | "few" | null;

const scenarioStatements: Record<Exclude<Scenario, null>, Statement[]> = {
  live: mockStatements,
  waiting: [],
  few: mockStatements.slice(0, 1),
};

export function DisplayModeScreenStory() {
  const [scenario, setScenario] = useState<Scenario>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display Mode Screen</CardTitle>
        <CardDescription>
          The big-screen, view-only results display hosts can open from the room menu.
          Click a scenario to open it as a full-screen overlay — close it with the X
          button or Escape, same as in the real app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Button onClick={() => setScenario("live")}>Live</Button>
          <Button onClick={() => setScenario("waiting")}>
            Waiting for responses
          </Button>
          <Button onClick={() => setScenario("few")}>Few statements</Button>
        </div>
      </CardContent>

      {scenario && (
        <DisplayModeScreen
          room={mockRoom}
          statements={scenarioStatements[scenario]}
          onClose={() => setScenario(null)}
        />
      )}
    </Card>
  );
}
