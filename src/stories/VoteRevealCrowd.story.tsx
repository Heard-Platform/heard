import { useState } from "react";
import { VoteRevealCrowd } from "../components/room/VoteRevealCrowd";
import { VoteRevealHeadline } from "../components/room/VoteRevealHeadline";
import { getPastelColor } from "../utils/colors";
import type { VoteEvent } from "../utils/vote-result";
import type { VoterVote } from "../utils/vote-reveal";
import type { SimpleVoteType } from "../types";

const CURRENT_VOTER_ID = "you";

interface VoteRevealCase {
  label: string;
  counts: Record<SimpleVoteType, number>;
  currentVoterVote: SimpleVoteType;
  voteEvent: VoteEvent | null;
}

const VOTE_REVEAL_CASES: VoteRevealCase[] = [
  { label: "50/0/50", counts: { disagree: 10, pass: 0, agree: 9 }, currentVoterVote: "agree", voteEvent: null },
  { label: "50/50/0, half pass", counts: { disagree: 10, pass: 9, agree: 0 }, currentVoterVote: "pass", voteEvent: null },
  { label: "80/20, you're with the majority", counts: { disagree: 4, pass: 0, agree: 15 }, currentVoterVote: "agree", voteEvent: null },
  { label: "80/20, you're in the minority", counts: { disagree: 3, pass: 0, agree: 16 }, currentVoterVote: "disagree", voteEvent: null },
  { label: "80/10/10", counts: { disagree: 2, pass: 2, agree: 15 }, currentVoterVote: "agree", voteEvent: null },
  { label: "10/80/10, mostly pass", counts: { disagree: 2, pass: 15, agree: 2 }, currentVoterVote: "pass", voteEvent: null },
  { label: "Unanimous", counts: { disagree: 0, pass: 0, agree: 11 }, currentVoterVote: "agree", voteEvent: null },
  { label: "Just a few voters", counts: { disagree: 1, pass: 0, agree: 1 }, currentVoterVote: "disagree", voteEvent: null },
  {
    label: "First vote",
    counts: { disagree: 0, pass: 0, agree: 0 },
    currentVoterVote: "agree",
    voteEvent: { type: "first_vote", headline: "First vote!" },
  },
  {
    label: "Swung the vote",
    counts: { disagree: 3, pass: 1, agree: 3 },
    currentVoterVote: "agree",
    voteEvent: { type: "swung_vote", headline: "You swung the vote!" },
  },
];

function makeVoterVotes(statementId: string, counts: Record<SimpleVoteType, number>): VoterVote[] {
  const voterVotes: VoterVote[] = [];
  for (const vote of Object.keys(counts) as SimpleVoteType[]) {
    for (let i = 0; i < counts[vote]; i++) {
      voterVotes.push({ voterId: `${statementId}-${vote}-${i}`, vote });
    }
  }
  return voterVotes;
}

export function VoteRevealCrowdStory() {
  const [replayCount, setReplayCount] = useState(0);
  const replay = () => setReplayCount((count) => count + 1);

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Vote Reveal Crowd</h2>
        <button
          className="rounded-md border px-3 py-1 text-sm font-medium hover:bg-slate-50"
          onClick={replay}
        >
          Replay all
        </button>
      </div>
      <p className="text-sm text-slate-500 max-w-xl">
        After a vote, the voter animals pop up in a huddle under Pass, then scurry into the third they voted
        for. The verdict sits over the winning third; first and swung votes replace it. Tap a vote button on
        a feed card to see it on the card, or swipe to see it in the snackbar.
      </p>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, 327px)" }}>
        {VOTE_REVEAL_CASES.map((revealCase) => (
          <VoteRevealCaseCard key={`${revealCase.label}-${replayCount}`} revealCase={revealCase} />
        ))}
      </div>
    </div>
  );
}

function VoteRevealCaseCard({ revealCase }: { revealCase: VoteRevealCase }) {
  const [replayCount, setReplayCount] = useState(0);
  const replay = () => setReplayCount((count) => count + 1);
  const statementId = `reveal-${revealCase.label}`;
  const voterVotes = [
    ...makeVoterVotes(statementId, revealCase.counts),
    { voterId: CURRENT_VOTER_ID, vote: revealCase.currentVoterVote },
  ];

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">{revealCase.label}</span>
        <button
          className="text-xs font-medium text-slate-500 underline"
          onClick={replay}
        >
          Replay
        </button>
      </div>
      <div key={replayCount} className={`relative h-24 pt-5 rounded-xl border-2 ${getPastelColor(statementId)}`}>
        <VoteRevealHeadline voterVotes={voterVotes} voteEvent={revealCase.voteEvent} />
        <div className="absolute left-0 right-0 bottom-0">
          <VoteRevealCrowd statementId={statementId} voterVotes={voterVotes} currentVoterId={CURRENT_VOTER_ID} />
        </div>
      </div>
    </div>
  );
}
