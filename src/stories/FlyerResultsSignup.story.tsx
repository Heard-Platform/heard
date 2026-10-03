import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { FlyerResultsSignupScreen } from "../components/flyer/results-signup/FlyerResultsSignupScreen";
import { FlyerResultsThanksScreen } from "../components/flyer/results-signup/FlyerResultsThanksScreen";
import type { FlyerVote } from "../components/flyer/FlyerVoteIntroCard";
import { Button } from "../components/ui/button";
import { DebateSessionProvider } from "../hooks/useDebateSession";
import { useEmailOtpFlow } from "../hooks/useEmailOtpFlow";
import { mockUser } from "./mockData";
import { StoryContainer } from "./StoryContainer";

export default {
  title: "Flyer/FlyerResultsSignup",
};

type Scenario = "agreed" | "disagreed" | "after-7pm" | "existing-email" | "logged-in" | "thanks";

const TAGLINE = "DC's place for community conversations";
const STATEMENT_TEXT = "DC should let driverless Waymo cars operate citywide.";
const VOTE_COUNT = 312;
const VALID_CODE = "ABC123";
const REQUEST_DELAY_MS = 800;
const ACCOUNT_EMAIL = "neighbor@example.com";

export function FlyerResultsSignupStory() {
  return (
    <StoryContainer
      title="Flyer Results Signup"
      description={`Waymo DC QR flyers: the vote is counted, results drop at 7pm ET, and we ask for an email to send them. Requests take ${REQUEST_DELAY_MS}ms. On the code step, ${VALID_CODE} logs in.`}
      variants={[
        { id: "agreed", label: "Scanned Agree", children: <FlyerResultsSignupDemo scenario="agreed" /> },
        { id: "disagreed", label: "Scanned Disagree", children: <FlyerResultsSignupDemo scenario="disagreed" /> },
        { id: "after-7pm", label: "Scanned after 7pm", children: <FlyerResultsSignupDemo scenario="after-7pm" /> },
        { id: "existing-email", label: "Existing email", children: <FlyerResultsSignupDemo scenario="existing-email" /> },
        { id: "logged-in", label: "Already logged in", children: <FlyerResultsSignupDemo scenario="logged-in" /> },
        { id: "thanks", label: "Thanks screen", children: <FlyerResultsSignupDemo scenario="thanks" /> },
      ]}
    />
  );
}

function FlyerResultsSignupDemo({ scenario }: { scenario: Scenario }) {
  const [replayKey, setReplayKey] = useState(0);

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setReplayKey((key) => key + 1)}>
        <RotateCcw className="h-4 w-4" />
        Replay
      </Button>

      <div className="mx-auto h-195 w-97.5 max-w-full overflow-y-auto rounded-4xl border-8 [scrollbar-width:none] border-slate-900 shadow-2xl">
        <DebateSessionProvider showcaseOverrides={buildOverrides(scenario)}>
          <SignupHarness
            key={replayKey}
            vote={scenario === "disagreed" ? "disagree" : "agree"}
            areResultsTomorrow={scenario === "after-7pm"}
            accountEmail={scenario === "logged-in" ? ACCOUNT_EMAIL : null}
            startOnThanks={scenario === "thanks"}
          />
        </DebateSessionProvider>
      </div>
    </div>
  );
}

interface SignupHarnessProps {
  vote: FlyerVote;
  areResultsTomorrow: boolean;
  accountEmail: string | null;
  startOnThanks: boolean;
}

function SignupHarness({ vote, areResultsTomorrow, accountEmail, startOnThanks }: SignupHarnessProps) {
  const [isThanksShown, setIsThanksShown] = useState(startOnThanks);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const signUp = async () => {
    setIsSigningUp(true);
    await wait(REQUEST_DELAY_MS);
    setIsSigningUp(false);
    setIsThanksShown(true);
  };
  const emailFlow = useEmailOtpFlow({ onComplete: signUp, sendWelcomeEmail: false });
  const handleLookAround = () => console.log("[Story] look around");

  if (!isThanksShown) {
    return (
      <FlyerResultsSignupScreen
        tagline={TAGLINE}
        statementText={STATEMENT_TEXT}
        vote={vote}
        voteCount={VOTE_COUNT}
        areResultsTomorrow={areResultsTomorrow}
        accountEmail={accountEmail}
        emailFlow={emailFlow}
        isSigningUp={isSigningUp}
        signupError={null}
        onSignUpWithAccountEmail={signUp}
      />
    );
  }

  return <FlyerResultsThanksScreen areResultsTomorrow={areResultsTomorrow} onLookAround={handleLookAround} />;
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
