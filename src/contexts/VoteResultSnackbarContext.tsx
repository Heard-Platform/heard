import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { VoteResultSnackbar, type LatestVote } from "../components/room/VoteResultSnackbar";
import { FeatureFlags, isFeatureEnabled } from "../utils/constants/feature-flags";
import { calcVoteResult } from "../utils/vote-result";
import type { Statement, VoteType } from "../types";

interface VoteResultSnackbarContextValue {
  showVoteResult: (statementBeforeVote: Statement, voteType: VoteType) => void;
}

const VoteResultSnackbarContext = createContext<VoteResultSnackbarContextValue | null>(null);

export function VoteResultSnackbarProvider({ children }: { children: ReactNode }) {
  const [latestVote, setLatestVote] = useState<LatestVote | null>(null);

  const showVoteResult = useCallback((statementBeforeVote: Statement, voteType: VoteType) => {
    if (!isFeatureEnabled(FeatureFlags.VOTE_RESULT_SNACKBAR)) return;
    const result = calcVoteResult(statementBeforeVote, voteType);
    if (result) setLatestVote({ statement: statementBeforeVote, result });
  }, []);

  const dismissVoteResult = useCallback(() => setLatestVote(null), []);

  const value = useMemo(() => ({ showVoteResult }), [showVoteResult]);

  return (
    <VoteResultSnackbarContext.Provider value={value}>
      {children}
      <VoteResultSnackbar latestVote={latestVote} onDismiss={dismissVoteResult} />
    </VoteResultSnackbarContext.Provider>
  );
}

export function useVoteResultSnackbar() {
  const context = useContext(VoteResultSnackbarContext);
  if (!context) {
    throw new Error("useVoteResultSnackbar must be used within VoteResultSnackbarProvider");
  }
  return context;
}
