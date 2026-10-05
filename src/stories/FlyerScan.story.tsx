import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { FlyerScanScreen } from "../components/flyer/results-signup/FlyerScanScreen";
import { FlyerResultsThanksScreen } from "../components/flyer/results-signup/FlyerResultsThanksScreen";
import type { FlyerVote } from "../components/flyer/FlyerVoteIntroCard";
import type { FlyerVoteTally } from "../components/flyer/landing/FlyerLandingScreen";
import { Button } from "../components/ui/button";
import { DebateSessionProvider } from "../hooks/useDebateSession";
import { useEmailOtpFlow } from "../hooks/useEmailOtpFlow";
import { mockUser } from "./mockData";
import { StoryContainer } from "./StoryContainer";

export default {
  title: "Flyer/FlyerScan",
};

const TAGLINE = "DC's place for community conversations";
const STATEMENT_TEXT = "I support Waymo in DC.";
const VALID_CODE = "ABC123";
const REQUEST_DELAY_MS = 800;

const tally = (agreeCount: number, disagreeCount: number): FlyerVoteTally => ({
  statementText: STATEMENT_TEXT,
  agreeCount,
  disagreeCount,
});

const MAJORITY_TALLY = tally(197, 115);
const MINORITY_TALLY = tally(109, 203);
const TOO_CLOSE_TALLY = tally(159, 153);

interface Scenario {
  label: string;
  vote: FlyerVote;
  tally: FlyerVoteTally;
  areResultsTomorrow?: boolean;
  isExistingEmail?: boolean;
  isSignedIn?: boolean;
  startOnThanks?: boolean;
}

const SCENARIOS: Record<string, Scenario> = {
  majority: { label: "Majority", vote: "agree", tally: MAJORITY_TALLY },
  minority: { label: "Minority", vote: "agree", tally: MINORITY_TALLY },
  "too-close": { label: "Too close", vote: "agree", tally: TOO_CLOSE_TALLY },
  "before-7pm": { label: "Before 7pm", vote: "agree", tally: TOO_CLOSE_TALLY },
  "after-7pm": { label: "After 7pm", vote: "agree", tally: TOO_CLOSE_TALLY, areResultsTomorrow: true },
  disagreed: { label: "Disagreed", vote: "disagree", tally: MINORITY_TALLY },
  "existing-email": { label: "Existing email", vote: "agree", tally: MAJORITY_TALLY, isExistingEmail: true },
  "logged-in": { label: "Already logged in", vote: "agree", tally: MAJORITY_TALLY, isSignedIn: true },
  thanks: { label: "Thanks screen", vote: "agree", tally: MAJORITY_TALLY, startOnThanks: true },
};

export function FlyerScanStory() {
  return (
    <StoryContainer
      title="Flyer Scan Screen"
      description={`Waymo DC QR flyers: the vote is counted, the headline reflects where DC stands, and we ask for an email to send the results at 7pm ET. Requests take ${REQUEST_DELAY_MS}ms. On the code step, ${VALID_CODE} logs in.`}
      variants={Object.entries(SCENARIOS).map(([id, scenario]) => ({
        id,
        label: scenario.label,
        children: <FlyerScanDemo scenario={scenario} />,
      }))}
    />
  );
}

function FlyerScanDemo({ scenario }: { scenario: Scenario }) {
  const [replayKey, setReplayKey] = useState(0);

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setReplayKey((key) => key + 1)}>
        <RotateCcw className="h-4 w-4" />
        Replay
      </Button>

      <div className="mx-auto h-195 w-97.5 max-w-full overflow-y-auto rounded-4xl border-8 [scrollbar-width:none] border-slate-900 shadow-2xl">
        <DebateSessionProvider showcaseOverrides={buildOverrides(scenario)}>
          <ScanHarness key={replayKey} scenario={scenario} />
        </DebateSessionProvider>
      </div>
    </div>
  );
}

function ScanHarness({ scenario }: { scenario: Scenario }) {
  const [isThanksShown, setIsThanksShown] = useState(scenario.startOnThanks ?? false);
  const emailFlow = useEmailOtpFlow({ onComplete: () => setIsThanksShown(true) });
  const areResultsTomorrow = scenario.areResultsTomorrow ?? false;
  const handleLookAround = () => console.log("[Story] look around");

  if (!isThanksShown) {
    return (
      <FlyerScanScreen
        tagline={TAGLINE}
        tally={scenario.tally}
        vote={scenario.vote}
        areResultsTomorrow={areResultsTomorrow}
        isSignedIn={scenario.isSignedIn ?? false}
        emailFlow={emailFlow}
        onLookAround={handleLookAround}
      />
    );
  }

  return <FlyerResultsThanksScreen areResultsTomorrow={areResultsTomorrow} onLookAround={handleLookAround} />;
}

function buildOverrides(scenario: Scenario) {
  return {
    user: { ...mockUser, isAnonymous: !scenario.isSignedIn },
    anonAddEmailAndLogin: async (email: string) => {
      console.log("[Story] anonAddEmailAndLogin", { email });
      await wait(REQUEST_DELAY_MS);
      if (scenario.isExistingEmail) {
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
