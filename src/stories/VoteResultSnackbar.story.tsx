import { useCallback, useEffect, useRef, useState } from "react";
import { VoteResultSnackbar } from "../components/room/VoteResultSnackbar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { buildVoteReveal, type VoteReveal } from "../utils/vote-reveal";
import type { Statement, VoteType, SimpleVoteType } from "../types";

interface VoteScenario {
  label: string;
  statementBeforeVote: Statement;
  voteType: VoteType;
}

const RAPID_VOTE_INTERVAL_MS = 900;
const STORY_VOTER_ID = "story-voter";

const buildStatement = (id: string, text: string, voteCounts: Record<SimpleVoteType, number>): Statement => {
  const voters: Statement["voters"] = {};
  for (const vote of Object.keys(voteCounts) as SimpleVoteType[]) {
    for (let i = 0; i < voteCounts[vote]; i++) voters[`${id}-${vote}-${i}`] = vote;
  }
  return {
    id,
    text,
    author: "story-author",
    agrees: voteCounts.agree,
    disagrees: voteCounts.disagree,
    passes: voteCounts.pass,
    superAgrees: 0,
    roomId: "story-room",
    timestamp: Date.now(),
    round: 1,
    voters,
  };
};

const VOTE_SCENARIOS: VoteScenario[] = [
  {
    label: "With the majority",
    statementBeforeVote: buildStatement("statement-metro", "Metro should run later on weekends", {
      agree: 27,
      disagree: 11,
      pass: 2,
    }),
    voteType: "agree",
  },
  {
    label: "In the minority",
    statementBeforeVote: buildStatement("statement-scooters", "Scooters should be banned from sidewalks", {
      agree: 9,
      disagree: 30,
      pass: 2,
    }),
    voteType: "agree",
  },
  {
    label: "Nearly split",
    statementBeforeVote: buildStatement("statement-apartments", "Ward 3 needs more apartment buildings", {
      agree: 20,
      disagree: 19,
      pass: 2,
    }),
    voteType: "agree",
  },
  {
    label: "Passed, most passed",
    statementBeforeVote: buildStatement("statement-zoning", "Zoning variances should be decided by the ANC", {
      agree: 3,
      disagree: 2,
      pass: 12,
    }),
    voteType: "pass",
  },
  {
    label: "Swung to agree",
    statementBeforeVote: buildStatement("statement-bike-lanes", "The Connecticut Ave bike lanes were worth it", {
      agree: 3,
      disagree: 3,
      pass: 1,
    }),
    voteType: "agree",
  },
  {
    label: "Swung to disagree",
    statementBeforeVote: buildStatement("statement-rock-creek", "Rock Creek Park should close to cars on weekends", {
      agree: 2,
      disagree: 2,
      pass: 0,
    }),
    voteType: "disagree",
  },
  {
    label: "First vote",
    statementBeforeVote: buildStatement("statement-anc", "Our ANC meetings should also be online", {
      agree: 0,
      disagree: 0,
      pass: 0,
    }),
    voteType: "agree",
  },
  {
    label: "Big crowd, sampled",
    statementBeforeVote: buildStatement("statement-library", "The library should stay open until midnight", {
      agree: 212,
      disagree: 64,
      pass: 31,
    }),
    voteType: "disagree",
  },
];

const toVoteReveal = ({ statementBeforeVote, voteType }: VoteScenario): VoteReveal =>
  buildVoteReveal(statementBeforeVote, voteType, STORY_VOTER_ID);

export function VoteResultSnackbarStory() {
  const [voteReveal, setVoteReveal] = useState<VoteReveal | null>(null);
  const rapidVoteTimeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  const cancelRapidVotes = () => {
    rapidVoteTimeoutIds.current.forEach((timeoutId) => clearTimeout(timeoutId));
    rapidVoteTimeoutIds.current = [];
  };

  useEffect(() => cancelRapidVotes, []);

  const showScenario = (scenario: VoteScenario) => {
    cancelRapidVotes();
    setVoteReveal(toVoteReveal(scenario));
  };

  const voteRapidlyThroughDeck = () => {
    cancelRapidVotes();
    rapidVoteTimeoutIds.current = VOTE_SCENARIOS.slice(0, 4).map((scenario, index) =>
      setTimeout(() => setVoteReveal(toVoteReveal(scenario)), index * RAPID_VOTE_INTERVAL_MS),
    );
  };

  const dismiss = useCallback(() => setVoteReveal(null), []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vote Result Snackbar</CardTitle>
        <CardDescription>
          Shown after a swipe (a tapped vote reveals on the card instead): the voter animals huddle, then
          scurry to the third they voted for, with the verdict over the winning third. First and swung votes
          replace the verdict, get the gold outline with Share, and stay up longer.
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
        <VoteResultSnackbar voteReveal={voteReveal} onDismiss={dismiss} />
      </CardContent>
    </Card>
  );
}
