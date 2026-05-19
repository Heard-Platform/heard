import { useState } from "react";
import { SwipeableStatementStack } from "../components/room/SwipeableStatementStack";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { mockRooms, mockStatements } from "./mockData";

const DEFAULT_ACTION =
"Vote for Oye Owolewa and other pro-ed candidates in the June 16th primary";
// "Attend Rat Abatement Day on May 9th at 3pm @ Stead Community Center";
const DEFAULT_LEARN_MORE = "https://example.com/rat-abatement-day";

type Outcome = "committed" | "ignored";

export function CommitCardStory() {
  const [action, setAction] = useState(DEFAULT_ACTION);
  const [learnMoreUrl, setLearnMoreUrl] = useState(DEFAULT_LEARN_MORE);
  const [swiped, setSwiped] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const reset = () => {
    setSwiped(false);
    setOutcome(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Commit Card</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl">
          A new swipeable card type rendered through the existing
          <code className="px-1 mx-1 rounded bg-muted">SwipeableStatementStack</code>
          framework. The host configures an action; swiping right commits and
          left ignores. Below, the card is inserted at the front of a normal
          statement stack to show how it slots in.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="commit-action">Proposed action</Label>
            <Input
              id="commit-action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. Attend Rat Abatement Day on May 9th..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commit-learn-more">Learn more URL (optional)</Label>
            <Input
              id="commit-learn-more"
              value={learnMoreUrl}
              onChange={(e) => setLearnMoreUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="font-medium mb-1">Last outcome</div>
            {outcome ? (
              <div className="flex items-center gap-2">
                <span>
                  {outcome === "committed" ? "🤝 Committed" : "👋 Ignored"}
                </span>
                <Button size="sm" variant="outline" onClick={reset}>
                  Reset
                </Button>
              </div>
            ) : (
              <span className="text-muted-foreground">
                Swipe the card to see the result.
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            The commit card is rendered first, then the demo statement stack
            below it. Swipe through the card to commit/ignore — the card then
            dismisses and reveals the next card in the stack.
          </p>
        </div>

        <div className="flex justify-center">
          <SwipeableStatementStack
            room={mockRooms[0]}
            statements={mockStatements["debate-with-image"]}
            currentUserId="demo-user"
            allowAnonymous={false}
            isAnonymous={false}
            chanceCardSwiped={true}
            cover={null}
            coverCardSwiped={true}
            commitAction={
              action.trim()
                ? { action, learnMoreUrl: learnMoreUrl || undefined }
                : null
            }
            commitCardSwiped={swiped}
            demographicQuestions={[]}
            answeredQuestionIds={new Set()}
            onVote={async () => {}}
            onSubmitStatement={async () => {}}
            onShowAccountSetupModal={() => {}}
            onChanceCardSwiped={async () => {}}
            onCoverCardSwiped={async () => {}}
            onCommitCardSwiped={(committed) => {
              setOutcome(committed ? "committed" : "ignored");
              setSwiped(true);
            }}
            onCertifyDone={async () => {}}
            onDemographicsAnswered={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
