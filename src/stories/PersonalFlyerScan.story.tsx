import { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { FlyerVote } from "../components/flyer/FlyerVoteIntroCard";
import { PersonalScanScreen } from "../components/flyer/personal-flyer/PersonalScanScreen";
import { PersonalThanksScreen } from "../components/flyer/personal-flyer/PersonalThanksScreen";
import { PersonalWhoDisScreen } from "../components/flyer/personal-flyer/PersonalWhoDisScreen";
import { Button } from "../components/ui/button";
import { DebateSessionProvider } from "../hooks/useDebateSession";
import { useEmailOtpFlow } from "../hooks/useEmailOtpFlow";
import { mockUser } from "./mockData";
import { StoryContainer } from "./StoryContainer";

export default {
  title: "Flyer/PersonalFlyerScan",
};

const NEIGHBOR_COUNT = 405;
const VALID_CODE = "ABC123";
const REQUEST_DELAY_MS = 800;

type Screen = "scan" | "whoDis" | "thanks";

const STANDARD_PHONE_CLASS = "h-195 w-97.5";
// iPhone SE viewport (375x667) plus the 8px frame border on each side.
const SHORT_PHONE_CLASS = "h-[683px] w-[391px]";

interface Scenario {
  label: string;
  vote: FlyerVote;
  startScreen: Screen;
  isExistingEmail?: boolean;
  isSignedIn?: boolean;
  isShortPhone?: boolean;
}

const SCENARIOS: Record<string, Scenario> = {
  agreed: { label: "Agreed", vote: "agree", startScreen: "scan" },
  disagreed: { label: "Disagreed", vote: "disagree", startScreen: "scan" },
  "existing-email": { label: "Existing email", vote: "agree", startScreen: "scan", isExistingEmail: true },
  "logged-in": { label: "Already logged in", vote: "agree", startScreen: "scan", isSignedIn: true },
  "who-dis": { label: "Who dis", vote: "agree", startScreen: "whoDis" },
  thanks: { label: "Thanks screen", vote: "agree", startScreen: "thanks" },
  "short-phone": { label: "Short phone (SE)", vote: "agree", startScreen: "scan", isShortPhone: true },
};

export function PersonalFlyerScanStory() {
  return (
    <StoryContainer
      title="Personal Flyer Scan Screen"
      description={`Test variant of the flyer scan screen, written in Alex's voice with an immediate results email. Tap "who dis" for the bio screen. Requests take ${REQUEST_DELAY_MS}ms. On the code step, ${VALID_CODE} logs in.`}
      variants={Object.entries(SCENARIOS).map(([id, scenario]) => ({
        id,
        label: scenario.label,
        children: <PersonalFlyerScanDemo scenario={scenario} />,
      }))}
    />
  );
}

function PersonalFlyerScanDemo({ scenario }: { scenario: Scenario }) {
  const [replayKey, setReplayKey] = useState(0);

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setReplayKey((key) => key + 1)}>
        <RotateCcw className="h-4 w-4" />
        Replay
      </Button>

      <div
        className={`mx-auto ${scenario.isShortPhone ? SHORT_PHONE_CLASS : STANDARD_PHONE_CLASS} max-w-full overflow-y-auto rounded-4xl border-8 [scrollbar-width:none] border-slate-900 shadow-2xl`}
      >
        <DebateSessionProvider showcaseOverrides={buildOverrides(scenario)}>
          <PersonalFlyerHarness key={replayKey} scenario={scenario} />
        </DebateSessionProvider>
      </div>
    </div>
  );
}

function PersonalFlyerHarness({ scenario }: { scenario: Scenario }) {
  const [screen, setScreen] = useState<Screen>(scenario.startScreen);
  const emailFlow = useEmailOtpFlow({ onComplete: () => setScreen("thanks") });
  const handleKeepVoting = () => console.log("[Story] keep voting");

  if (screen === "scan") {
    return (
      <PersonalScanScreen
        vote={scenario.vote}
        neighborCount={NEIGHBOR_COUNT}
        isSignedIn={scenario.isSignedIn ?? false}
        emailFlow={emailFlow}
        onWhoDis={() => setScreen("whoDis")}
        onKeepVoting={handleKeepVoting}
      />
    );
  }

  if (screen === "whoDis") {
    return <PersonalWhoDisScreen emailFlow={emailFlow} onBack={() => setScreen("scan")} />;
  }

  return <PersonalThanksScreen onKeepVoting={handleKeepVoting} />;
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
