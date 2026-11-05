import { useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  SignUpCard,
  SIGNUP_CARD_SHELL_CLASS,
} from "../components/room/SignUpCard";
import { Button } from "../components/ui/button";
import { DebateSessionProvider } from "../hooks/useDebateSession";
import {
  buildEmailOtpOverrides,
  STORY_REQUEST_DELAY_MS,
  STORY_VALID_CODE,
} from "./email-otp-story-overrides";
import { PhoneFrame } from "./PhoneFrame";
import { StoryContainer } from "./StoryContainer";

const NEIGHBOR_COUNT = 405;

interface Scenario {
  label: string;
  isExistingEmail: boolean;
}

const SCENARIOS: Record<string, Scenario> = {
  "new-email": { label: "New email", isExistingEmail: false },
  "existing-email": {
    label: "Existing email (code step)",
    isExistingEmail: true,
  },
};

export function SignUpCardStory() {
  return (
    <StoryContainer
      title="Sign Up Card"
      description={`Shown to anonymous voters at the 5th spot of a stack. Enter any email to sign up and see the thanks state. Tap "who dis" for the bio sheet. Requests take ${STORY_REQUEST_DELAY_MS}ms. On the code step, ${STORY_VALID_CODE} logs in.`}
      variants={Object.keys(SCENARIOS).map((id) => ({
        id,
        label: SCENARIOS[id].label,
        children: <SignUpCardDemo scenario={SCENARIOS[id]} />,
      }))}
    />
  );
}

function SignUpCardDemo({ scenario }: { scenario: Scenario }) {
  const [replayKey, setReplayKey] = useState(0);
  const handleReplay = () => setReplayKey((key) => key + 1);

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleReplay}
      >
        <RotateCcw className="h-4 w-4" />
        Replay
      </Button>

      <PhoneFrame>
        <DebateSessionProvider
          showcaseOverrides={buildEmailOtpOverrides(scenario)}
        >
          <div className="p-4">
            <div
              className={`rounded-xl border-2 p-6 shadow-xl ${SIGNUP_CARD_SHELL_CLASS}`}
            >
              <SignUpCard
                key={replayKey}
                neighborCount={NEIGHBOR_COUNT}
                onKeepVoting={() =>
                  console.log("[Story] keep voting")
                }
              />
            </div>
          </div>
        </DebateSessionProvider>
      </PhoneFrame>
    </div>
  );
}
