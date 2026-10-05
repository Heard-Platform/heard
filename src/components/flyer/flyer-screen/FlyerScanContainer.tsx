import { useEffect, useState } from "react";
import { api } from "../../../utils/api";
import { useDebateSession } from "../../../hooks/useDebateSession";
import { useEmailOtpFlow } from "../../../hooks/useEmailOtpFlow";
import { isAfterFlyerResultsTime } from "../../../utils/time";
import type { FlyerCompleteReason } from "../FlyerSwipeContainer";
import type { FlyerVote } from "../FlyerVoteIntroCard";
import type { FlyerVoteTally } from "../landing/FlyerLandingScreen";
import { FlyerScanScreen } from "./FlyerScanScreen";
import { FlyerResultsThanksScreen } from "./FlyerResultsThanksScreen";

const TAGLINE = "DC's place for community conversations";

export interface FlyerScan {
  roomId: string;
  tally: FlyerVoteTally;
  vote: FlyerVote;
}

interface FlyerScanContainerProps {
  scan: FlyerScan;
  onComplete: (roomId: string, reason: FlyerCompleteReason) => void;
}

export function FlyerScanContainer({
  scan,
  onComplete,
}: FlyerScanContainerProps) {
  const { roomId } = scan;
  const { user } = useDebateSession();
  const [areResultsTomorrow] = useState(isAfterFlyerResultsTime);
  // Read once on arrival so the screen doesn't switch to the note when a new email is added.
  const [isSignedIn] = useState(() => !!user?.email);
  const [isEmailAdded, setIsEmailAdded] = useState(false);
  const track = (type: string) => api.trackEvent(type, roomId);

  const emailFlow = useEmailOtpFlow({
    onComplete: () => {
      track("flyer_screen_email_added");
      setIsEmailAdded(true);
    },
  });

  useEffect(() => {
    track("flyer_screen_opened");
  }, []);

  const handleLookAround = () => {
    track("flyer_screen_looked_around");
    onComplete(roomId, "continue");
  };

  return (
    <div className="heard-feed-bg h-dvh overflow-y-auto">
      <div className="mx-auto min-h-full max-w-md">
        {!isEmailAdded ? (
          <FlyerScanScreen
            tagline={TAGLINE}
            tally={scan.tally}
            vote={scan.vote}
            areResultsTomorrow={areResultsTomorrow}
            isSignedIn={isSignedIn}
            emailFlow={emailFlow}
            onLookAround={handleLookAround}
          />
        ) : (
          <FlyerResultsThanksScreen
            areResultsTomorrow={areResultsTomorrow}
            onLookAround={handleLookAround}
          />
        )}
      </div>
    </div>
  );
}
