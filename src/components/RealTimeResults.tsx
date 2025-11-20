import { useEffect, useState } from "react";
import type { Statement, VoteType } from "../types";
import { Confetti } from "./results/Confetti";
import { InProgressResults } from "./results/InProgressResults";
import { ConcludedResults } from "./results/ConcludedResults";

interface RealTimeResultsProps {
  statements: Statement[];
  currentRound: string;
  currentSubPhase?: string;
  mode?: "in-progress" | "concluded";
  onDiscuss?: (statementText: string) => void;
  currentUserId?: string;
  onChangeVote?: (statementId: string, newVote: VoteType) => Promise<void>;
  debateTitle?: string;
}

export function RealTimeResults({
  statements,
  currentRound,
  mode = "concluded",
  onDiscuss,
  currentUserId,
  onChangeVote,
  debateTitle,
}: RealTimeResultsProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  // Show confetti on initial load (only for concluded mode)
  useEffect(() => {
    if (mode === "concluded") {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  return (
    <>
      {showConfetti && <Confetti />}

      {mode === "in-progress" ? (
        <InProgressResults 
          statements={statements} 
          currentUserId={currentUserId}
          debateTitle={debateTitle || "Debate"}
          onChangeVote={onChangeVote}
        />
      ) : (
        <ConcludedResults statements={statements} onDiscuss={onDiscuss} />
      )}
    </>
  );
}