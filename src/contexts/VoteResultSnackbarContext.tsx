import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { VoteResultSnackbar } from "../components/room/VoteResultSnackbar";
import { FeatureFlags, isFeatureEnabled } from "../utils/constants/feature-flags";
import { buildVoteReveal, type VoteReveal } from "../utils/vote-reveal";
import type { Statement, VoteType } from "../types";

interface VoteResultSnackbarContextValue {
  showVoteResult: (
    statementBeforeVote: Statement,
    voteType: VoteType,
    voterId: string | undefined,
  ) => void;
}

const VoteResultSnackbarContext = createContext<VoteResultSnackbarContextValue | null>(null);

export function VoteResultSnackbarProvider({ children }: { children: ReactNode }) {
  const [voteReveal, setVoteReveal] = useState<VoteReveal | null>(null);

  const showVoteResult = useCallback(
    (statementBeforeVote: Statement, voteType: VoteType, voterId: string | undefined) => {
      if (!isFeatureEnabled(FeatureFlags.VOTE_RESULT_SNACKBAR)) return;
      setVoteReveal(buildVoteReveal(statementBeforeVote, voteType, voterId));
    },
    [],
  );

  const dismissVoteResult = useCallback(() => setVoteReveal(null), []);

  const value = useMemo(() => ({ showVoteResult }), [showVoteResult]);

  return (
    <VoteResultSnackbarContext.Provider value={value}>
      {children}
      <VoteResultSnackbar voteReveal={voteReveal} onDismiss={dismissVoteResult} />
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
