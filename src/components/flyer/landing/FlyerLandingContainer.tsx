import { useEffect, useState } from "react";
import type { DebateRoom } from "../../../types";
import { api } from "../../../utils/api";
import { useDebateSession } from "../../../hooks/useDebateSession";
import { useEmailOtpFlow } from "../../../hooks/useEmailOtpFlow";
import type { FlyerCompleteReason } from "../FlyerSwipeContainer";
import type { FlyerVote } from "../FlyerVoteIntroCard";
import { FlyerLandingScreen, type FlyerVoteTally } from "./FlyerLandingScreen";
import { FlyerThanksScreen } from "./FlyerThanksScreen";

interface FlyerLandingContainerProps {
  room: DebateRoom;
  community: string | null;
  tally: FlyerVoteTally;
  vote: FlyerVote;
  onComplete: (roomId: string, reason: FlyerCompleteReason) => void;
}

export function FlyerLandingContainer({ room, community, tally, vote, onComplete }: FlyerLandingContainerProps) {
  const { user } = useDebateSession();
  const [isLoggedIn] = useState(!!user && !user.isAnonymous);
  const [submittedAs, setSubmittedAs] = useState<"new" | "returning" | null>(null);
  const track = (type: string) => api.trackEvent(type, room.id);

  const emailFlow = useEmailOtpFlow({
    onComplete: ({ wasOtpLogin }) => {
      track("flyer_landing_email_submitted");
      setSubmittedAs(wasOtpLogin ? "returning" : "new");
    },
  });

  useEffect(() => {
    track("flyer_landing_opened");
  }, []);

  const handleLookAround = () => {
    track("flyer_landing_looked_around");
    onComplete(room.id, "continue");
  };

  return (
    <div className="heard-feed-bg h-dvh overflow-y-auto">
      <div className="mx-auto min-h-full max-w-md">
        {submittedAs ? (
          <FlyerThanksScreen
            community={community}
            isReturningUser={submittedAs === "returning"}
            onLookAround={handleLookAround}
          />
        ) : (
          <FlyerLandingScreen
            community={community}
            tally={tally}
            vote={vote}
            isLoggedIn={isLoggedIn}
            emailFlow={emailFlow}
            onLookAround={handleLookAround}
          />
        )}
      </div>
    </div>
  );
}
