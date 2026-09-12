import { useState } from "react";
import { VoteSwingOverlay } from "../components/VoteSwingOverlay";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import type { Statement, VoteType } from "../types";

export default {
  title: "Voting/VoteSwingOverlay",
};

interface Scenario {
  label: string;
  statement: Statement;
  voteType: VoteType;
}

const baseStatement: Omit<Statement, "id" | "text" | "agrees" | "disagrees" | "superAgrees"> = {
  author: "someone",
  passes: 2,
  roomId: "mock-room",
  timestamp: Date.now(),
  round: 1,
  voters: {},
};

const SCENARIOS: Scenario[] = [
  {
    label: "Agree breaks the tie",
    statement: {
      ...baseStatement,
      id: "stmt-pineapple",
      text: "Pineapple belongs on pizza and makes it sweet and savory perfection!",
      agrees: 5,
      disagrees: 5,
      superAgrees: 0,
    },
    voteType: "agree",
  },
  {
    label: "Disagree breaks the tie",
    statement: {
      ...baseStatement,
      id: "stmt-remote-work",
      text: "Remote work should be the default for every company.",
      agrees: 4,
      disagrees: 4,
      superAgrees: 0,
    },
    voteType: "disagree",
  },
  {
    label: "Super agree breaks the tie",
    statement: {
      ...baseStatement,
      id: "stmt-cereal",
      text: "Cereal is a soup.",
      agrees: 2,
      disagrees: 3,
      superAgrees: 1,
    },
    voteType: "super_agree",
  },
];

export const AgreeBreaksTie = () => {
  const [isOpen, setIsOpen] = useState(true);
  const scenario = SCENARIOS[0];
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Button onClick={() => setIsOpen(true)}>Replay</Button>
      {isOpen && (
        <VoteSwingOverlay
          statement={scenario.statement}
          voteType={scenario.voteType}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export const DisagreeBreaksTie = () => {
  const [isOpen, setIsOpen] = useState(true);
  const scenario = SCENARIOS[1];
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Button onClick={() => setIsOpen(true)}>Replay</Button>
      {isOpen && (
        <VoteSwingOverlay
          statement={scenario.statement}
          voteType={scenario.voteType}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export function VoteSwingOverlayStory() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vote Swing Overlay</CardTitle>
        <CardDescription>
          Celebration screen shown when a user's vote breaks an exact tie and decides
          the statement's majority. Click a scenario to trigger it full-screen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {SCENARIOS.map((scenario, index) => (
            <Button
              key={scenario.label}
              variant="outline"
              onClick={() => setOpenIndex(index)}
            >
              {scenario.label}
            </Button>
          ))}
        </div>

        {openIndex !== null && (
          <VoteSwingOverlay
            statement={SCENARIOS[openIndex].statement}
            voteType={SCENARIOS[openIndex].voteType}
            onClose={() => setOpenIndex(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}
