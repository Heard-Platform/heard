import { useEffect, useState } from "react";
import type { Statement } from "../types";
import { Confetti } from "./results/Confetti";
import { InProgressResults } from "./results/InProgressResults";
import { ConcludedResults } from "./results/ConcludedResults";

interface RealTimeResultsProps {
  statements: Statement[];
  currentRound: string;
  currentSubPhase?: string;
  mode?: "in-progress" | "concluded";
}

export function RealTimeResults({
  statements,
  currentRound,
  mode = "concluded",
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
        <InProgressResults statements={statements} />
      ) : (
        <ConcludedResults statements={statements} />
      )}
    </>
  );
}
