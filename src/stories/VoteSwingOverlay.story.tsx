import { useState } from "react";
import { VoteSwingOverlay } from "../components/VoteSwingOverlay";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export default {
  title: "Voting/VoteSwingOverlay",
};

interface Scenario {
  label: string;
  statementText: string;
  beforeAgreePercent: number;
  afterAgreePercent: number;
}

const SCENARIOS: Scenario[] = [
  {
    label: "Disagree → Agree",
    statementText: "Pineapple belongs on pizza and makes it sweet and savory perfection!",
    beforeAgreePercent: 46,
    afterAgreePercent: 52,
  },
  {
    label: "Agree → Disagree",
    statementText: "Remote work should be the default for every company.",
    beforeAgreePercent: 51,
    afterAgreePercent: 45,
  },
  {
    label: "Nail-biter (Disagree → Agree)",
    statementText: "Cereal is a soup.",
    beforeAgreePercent: 49,
    afterAgreePercent: 50.5,
  },
];

export const DisagreeToAgree = () => {
  const [isOpen, setIsOpen] = useState(true);
  const scenario = SCENARIOS[0];
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Button onClick={() => setIsOpen(true)}>Replay</Button>
      <VoteSwingOverlay
        isOpen={isOpen}
        statementText={scenario.statementText}
        beforeAgreePercent={scenario.beforeAgreePercent}
        afterAgreePercent={scenario.afterAgreePercent}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};

export const AgreeToDisagree = () => {
  const [isOpen, setIsOpen] = useState(true);
  const scenario = SCENARIOS[1];
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Button onClick={() => setIsOpen(true)}>Replay</Button>
      <VoteSwingOverlay
        isOpen={isOpen}
        statementText={scenario.statementText}
        beforeAgreePercent={scenario.beforeAgreePercent}
        afterAgreePercent={scenario.afterAgreePercent}
        onClose={() => setIsOpen(false)}
      />
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
          Celebration screen shown when a vote flips a statement's majority from agree
          to disagree, or vice versa. Click a scenario to trigger it full-screen.
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
            isOpen={openIndex !== null}
            statementText={SCENARIOS[openIndex].statementText}
            beforeAgreePercent={SCENARIOS[openIndex].beforeAgreePercent}
            afterAgreePercent={SCENARIOS[openIndex].afterAgreePercent}
            onClose={() => setOpenIndex(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}
