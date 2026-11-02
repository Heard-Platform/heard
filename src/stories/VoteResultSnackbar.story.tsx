import { useCallback, useEffect, useRef, useState } from "react";
import { VoteResultSnackbar, type LatestVote } from "../components/room/VoteResultSnackbar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { calcVoteResult } from "../utils/vote-result";
import type { Statement, VoteType } from "../types";

interface VoteScenario {
  label: string;
  statementBeforeVote: Statement;
  voteType: VoteType;
}

const RAPID_VOTE_INTERVAL_MS = 900;

const buildStatement = (
  id: string,
  text: string,
  counts: Pick<Statement, "agrees" | "disagrees" | "superAgrees">,
): Statement => ({
  id,
  text,
  author: "story-author",
  passes: 2,
  roomId: "story-room",
  timestamp: Date.now(),
  round: 1,
  voters: {},
  ...counts,
});

const VOTE_SCENARIOS: VoteScenario[] = [
  {
    label: "With the majority",
    statementBeforeVote: buildStatement("statement-metro", "Metro should run later on weekends", {
      agrees: 27,
      disagrees: 11,
      superAgrees: 0,
    }),
    voteType: "agree",
  },
  {
    label: "In the minority",
    statementBeforeVote: buildStatement("statement-scooters", "Scooters should be banned from sidewalks", {
      agrees: 9,
      disagrees: 30,
      superAgrees: 0,
    }),
    voteType: "agree",
  },
  {
    label: "Nearly split",
    statementBeforeVote: buildStatement("statement-apartments", "Ward 3 needs more apartment buildings", {
      agrees: 20,
      disagrees: 19,
      superAgrees: 0,
    }),
    voteType: "agree",
  },
  {
    label: "Swung to agree",
    statementBeforeVote: buildStatement("statement-bike-lanes", "The Connecticut Ave bike lanes were worth it", {
      agrees: 3,
      disagrees: 3,
      superAgrees: 0,
    }),
    voteType: "agree",
  },
  {
    label: "Swung to disagree",
    statementBeforeVote: buildStatement("statement-rock-creek", "Rock Creek Park should close to cars on weekends", {
      agrees: 1,
      disagrees: 2,
      superAgrees: 1,
    }),
    voteType: "disagree",
  },
  {
    label: "First vote",
    statementBeforeVote: buildStatement("statement-anc", "Our ANC meetings should also be online", {
      agrees: 0,
      disagrees: 0,
      superAgrees: 0,
    }),
    voteType: "agree",
  },
];

const toLatestVote = ({ statementBeforeVote, voteType }: VoteScenario): LatestVote | null => {
  const result = calcVoteResult(statementBeforeVote, voteType);
  return result ? { statement: statementBeforeVote, result } : null;
};

export function VoteResultSnackbarStory() {
  const [latestVote, setLatestVote] = useState<LatestVote | null>(null);
  const rapidVoteTimeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  const cancelRapidVotes = () => {
    rapidVoteTimeoutIds.current.forEach((timeoutId) => clearTimeout(timeoutId));
    rapidVoteTimeoutIds.current = [];
  };

  useEffect(() => cancelRapidVotes, []);

  const showScenario = (scenario: VoteScenario) => {
    cancelRapidVotes();
    setLatestVote(toLatestVote(scenario));
  };

  const voteRapidlyThroughDeck = () => {
    cancelRapidVotes();
    rapidVoteTimeoutIds.current = VOTE_SCENARIOS.slice(0, 4).map((scenario, index) =>
      setTimeout(() => setLatestVote(toLatestVote(scenario)), index * RAPID_VOTE_INTERVAL_MS),
    );
  };

  const dismiss = useCallback(() => setLatestVote(null), []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vote Result Snackbar</CardTitle>
        <CardDescription>
          Shown after each swipe: how everyone else voted on the statement. A new vote
          while it is showing swaps the contents in place. Swung and first votes get the
          gold treatment with Share and stay up longer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {VOTE_SCENARIOS.map((scenario) => (
            <Button key={scenario.label} variant="outline" onClick={() => showScenario(scenario)}>
              {scenario.label}
            </Button>
          ))}
          <Button onClick={voteRapidlyThroughDeck}>Vote rapidly through a deck</Button>
        </div>
        <VoteResultSnackbar latestVote={latestVote} onDismiss={dismiss} />
      </CardContent>
    </Card>
  );
}
