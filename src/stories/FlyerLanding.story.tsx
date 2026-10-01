import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { FlyerLandingScreen, type FlyerVoteTally } from "../components/flyer/landing/FlyerLandingScreen";
import { FlyerThanksScreen } from "../components/flyer/landing/FlyerThanksScreen";
import type { FlyerVote } from "../components/flyer/FlyerVoteIntroCard";
import { Button } from "../components/ui/button";
import { DebateSessionProvider } from "../hooks/useDebateSession";
import { useEmailOtpFlow } from "../hooks/useEmailOtpFlow";
import { mockUser } from "./mockData";
import { StoryContainer } from "./StoryContainer";

export default {
  title: "Flyer/FlyerLanding",
};

type Scenario = "agreed" | "disagreed" | "existing-email" | "logged-in" | "no-community" | "thanks";

const COMMUNITY = "Washington, DC";
const VALID_CODE = "ABC123";
const REQUEST_DELAY_MS = 800;

const TALLY: FlyerVoteTally = {
  statementText: "I support Waymo in DC.",
  agreeCount: 26,
  disagreeCount: 15,
};

export function FlyerLandingStory() {
  return (
    <StoryContainer
      title="Flyer Landing"
      description={`The flyer results path (FLYER_RESULTS flag): vote results right after the QR scan, then a thank-you once an email is added. Requests take ${REQUEST_DELAY_MS}ms. Type a bad email to see the error. On the code step, ${VALID_CODE} logs in.`}
      variants={[
        { id: "agreed", label: "Scanned Agree", children: <FlyerLandingDemo scenario="agreed" /> },
        { id: "disagreed", label: "Scanned Disagree", children: <FlyerLandingDemo scenario="disagreed" /> },
        { id: "existing-email", label: "Existing email", children: <FlyerLandingDemo scenario="existing-email" /> },
        { id: "logged-in", label: "Already logged in", children: <FlyerLandingDemo scenario="logged-in" /> },
        { id: "no-community", label: "No community", children: <FlyerLandingDemo scenario="no-community" /> },
        { id: "thanks", label: "Thanks screen", children: <FlyerLandingDemo scenario="thanks" /> },
      ]}
    />
  );
}

export const ScannedAgree = () => <FlyerLandingDemo scenario="agreed" />;
export const ScannedDisagree = () => <FlyerLandingDemo scenario="disagreed" />;
export const ExistingEmail = () => <FlyerLandingDemo scenario="existing-email" />;
export const AlreadyLoggedIn = () => <FlyerLandingDemo scenario="logged-in" />;
export const NoCommunity = () => <FlyerLandingDemo scenario="no-community" />;
export const Thanks = () => <FlyerLandingDemo scenario="thanks" />;

function FlyerLandingDemo({ scenario }: { scenario: Scenario }) {
  const [replayKey, setReplayKey] = useState(0);

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setReplayKey((key) => key + 1)}>
        <RotateCcw className="h-4 w-4" />
        Replay
      </Button>

      <div className="mx-auto h-195 w-97.5 max-w-full overflow-y-auto rounded-4xl border-8 [scrollbar-width:none] border-slate-900 shadow-2xl">
        <DebateSessionProvider showcaseOverrides={buildOverrides(scenario)}>
          <LandingHarness
            key={replayKey}
            community={scenario === "no-community" ? null : COMMUNITY}
            vote={scenario === "disagreed" ? "disagree" : "agree"}
            isLoggedIn={scenario === "logged-in"}
            startOnThanks={scenario === "thanks"}
          />
        </DebateSessionProvider>
      </div>
    </div>
  );
}

interface LandingHarnessProps {
  community: string | null;
  vote: FlyerVote;
  isLoggedIn: boolean;
  startOnThanks: boolean;
}

function LandingHarness({ community, vote, isLoggedIn, startOnThanks }: LandingHarnessProps) {
  const [isThanksShown, setIsThanksShown] = useState(startOnThanks);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const emailFlow = useEmailOtpFlow({
    onComplete: ({ wasOtpLogin }) => {
      console.log("[Story] email complete", { wasOtpLogin });
      setIsReturningUser(wasOtpLogin);
      setIsThanksShown(true);
    },
  });
  const handleLookAround = () => console.log("[Story] look around");

  if (isThanksShown) {
    return <FlyerThanksScreen community={community} isReturningUser={isReturningUser} onLookAround={handleLookAround} />;
  }

  return (
    <FlyerLandingScreen
      community={community}
      tally={TALLY}
      vote={vote}
      isLoggedIn={isLoggedIn}
      emailFlow={emailFlow}
      onLookAround={handleLookAround}
    />
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
