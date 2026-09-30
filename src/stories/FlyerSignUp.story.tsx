import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { FlyerResults } from "../components/flyer/FlyerResults";
import { SaveSpotDrawer } from "../components/flyer/SaveSpotDrawer";
import type { FlyerCompleteReason } from "../components/flyer/FlyerSwipeContainer";
import { Button } from "../components/ui/button";
import { DebateSessionProvider, useDebateSession } from "../hooks/useDebateSession";
import { useEmailOtpFlow } from "../hooks/useEmailOtpFlow";
import { estimateClusterProbabilities } from "../utils/cluster-estimation";
import { summarizeTribe } from "../utils/tribe-summary";
import type { VoteType } from "../types";
import { FLYER_CLUSTERS, FLYER_DECK_ORDER, FLYER_STATEMENTS } from "./flyer-fixtures";
import { mockUser } from "./mockData";
import { StoryContainer } from "./StoryContainer";

export default {
  title: "Flyer/FlyerSignUp",
};

type Scenario = "new-email" | "existing-email" | "logged-in" | "no-clusters";

const VALID_CODE = "ABC123";
const REQUEST_DELAY_MS = 800;

const VOTES: Record<string, VoteType> = {
  "safer-streets": "agree",
  "pilot-first": "disagree",
  jobs: "disagree",
  "public-data": "pass",
  traffic: "disagree",
  "night-service": "agree",
};

export function FlyerSignUpStory() {
  return (
    <StoryContainer
      title="Flyer Sign-up"
      description={`The end of the flyer flow: results, Save my spot, and the email drawer. Requests take ${REQUEST_DELAY_MS}ms so the submitting state shows. Type a bad email to see the email error. On the code step, ${VALID_CODE} logs in and anything else shows the code error.`}
      variants={[
        { id: "new-email", label: "Anon, new email", children: <FlyerSignUpDemo scenario="new-email" /> },
        { id: "existing-email", label: "Anon, existing email", children: <FlyerSignUpDemo scenario="existing-email" /> },
        { id: "logged-in", label: "Already logged in", children: <FlyerSignUpDemo scenario="logged-in" /> },
        { id: "no-clusters", label: "Room without groups yet", children: <FlyerSignUpDemo scenario="no-clusters" /> },
      ]}
    />
  );
}

export const AnonNewEmail = () => <FlyerSignUpDemo scenario="new-email" />;
export const AnonExistingEmail = () => <FlyerSignUpDemo scenario="existing-email" />;
export const AlreadyLoggedIn = () => <FlyerSignUpDemo scenario="logged-in" />;
export const NoClusters = () => <FlyerSignUpDemo scenario="no-clusters" />;

function FlyerSignUpDemo({ scenario }: { scenario: Scenario }) {
  const [resetKey, setResetKey] = useState(0);
  const [completedReason, setCompletedReason] = useState<FlyerCompleteReason | null>(null);

  const handleReset = () => {
    setCompletedReason(null);
    setResetKey((key) => key + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-2" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <span className="font-mono text-xs text-muted-foreground">
          {completedReason ? `completed: ${completedReason} → lands in the feed` : "not completed"}
        </span>
      </div>

      <div className="heard-feed-bg mx-auto h-195 w-97.5 max-w-full overflow-y-auto rounded-4xl border-8 [scrollbar-width:none] border-slate-900 px-5 pt-4 shadow-2xl">
        <DebateSessionProvider showcaseOverrides={buildOverrides(scenario)}>
          <SignUpHarness
            key={resetKey}
            hasClusters={scenario !== "no-clusters"}
            onComplete={(reason) => {
              console.log("[Story] complete", reason);
              setCompletedReason(reason);
            }}
          />
        </DebateSessionProvider>
      </div>
    </div>
  );
}

interface SignUpHarnessProps {
  hasClusters: boolean;
  onComplete: (reason: FlyerCompleteReason) => void;
}

function SignUpHarness({ hasClusters, onComplete }: SignUpHarnessProps) {
  const { user } = useDebateSession();
  const [isSaveSpotOpen, setIsSaveSpotOpen] = useState(false);
  const emailFlow = useEmailOtpFlow({
    onComplete: ({ wasOtpLogin }) => {
      setIsSaveSpotOpen(false);
      onComplete(wasOtpLogin ? "otp-login" : "signup");
    },
  });

  const clusters = hasClusters ? FLYER_CLUSTERS : [];
  const clusterProbabilities = hasClusters ? estimateClusterProbabilities(FLYER_DECK_ORDER, VOTES) : null;
  const summary = clusterProbabilities ? summarizeTribe(FLYER_DECK_ORDER, VOTES, clusterProbabilities) : null;
  const crossoverId = summary?.crossover?.statementId;
  const crossoverStatement = FLYER_STATEMENTS.find((statement) => statement.id === crossoverId) ?? null;

  const handleSaveSpot = () => {
    if (user && !user.isAnonymous) {
      onComplete("continue");
    } else {
      setIsSaveSpotOpen(true);
    }
  };

  return (
    <>
      <FlyerResults
        seed="flyer-room"
        clusters={clusters}
        clusterProbabilities={clusterProbabilities}
        summary={summary}
        crossoverStatement={crossoverStatement}
        onSaveSpot={handleSaveSpot}
        onJustLooking={() => onComplete("continue")}
      />
      <SaveSpotDrawer
        isOpen={isSaveSpotOpen}
        tribe={summary ? clusters[summary.clusterIndex] : null}
        emailFlow={emailFlow}
        onNotNow={() => setIsSaveSpotOpen(false)}
        onDismiss={() => setIsSaveSpotOpen(false)}
      />
    </>
  );
}

function buildOverrides(scenario: Scenario) {
  return {
    user: { ...mockUser, isAnonymous: scenario !== "logged-in" },
    anonAddEmailAndLogin: async (email: string) => {
      console.log("[Story] anonAddEmailAndLogin", { email, scenario });
      await wait(REQUEST_DELAY_MS);
      if (scenario === "existing-email") {
        return { success: true, data: { requiresOtp: true as const, email } };
      }
      return { success: true, data: { requiresOtp: false as const, user: mockUser } };
    },
    verifyMagicLink: async (code: string) => {
      console.log("[Story] verifyMagicLink", { code });
      await wait(REQUEST_DELAY_MS);
      if (code !== VALID_CODE) {
        return { success: false, error: "Invalid code. Please try again." };
      }
      return { success: true, data: { user: mockUser, sessionId: "story-session" } };
    },
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
