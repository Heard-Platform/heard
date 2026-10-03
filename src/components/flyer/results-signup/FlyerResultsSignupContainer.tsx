import { useEffect, useState } from "react";
import { api } from "../../../utils/api";
import { useDebateSession } from "../../../hooks/useDebateSession";
import { useEmailOtpFlow } from "../../../hooks/useEmailOtpFlow";
import { isAfterFlyerResultsTime } from "../../../utils/time";
import type { FlyerCompleteReason } from "../FlyerSwipeContainer";
import type { FlyerVote } from "../FlyerVoteIntroCard";
import { FlyerResultsSignupScreen } from "./FlyerResultsSignupScreen";
import { FlyerResultsThanksScreen } from "./FlyerResultsThanksScreen";

const TAGLINE = "DC's place for community conversations";
const SIGNUP_FAILED_ERROR =
  "We saved your email but couldn't sign you up for results. Please try again.";

export interface FlyerResultsSignup {
  roomId: string;
  statementId: string;
  statementText: string;
  vote: FlyerVote;
  voteCount: number;
}

interface FlyerResultsSignupContainerProps {
  signup: FlyerResultsSignup;
  onComplete: (roomId: string, reason: FlyerCompleteReason) => void;
}

export function FlyerResultsSignupContainer({
  signup,
  onComplete,
}: FlyerResultsSignupContainerProps) {
  const { roomId, statementId } = signup;
  const { user } = useDebateSession();
  const [areResultsTomorrow] = useState(isAfterFlyerResultsTime);
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const track = (type: string) => api.trackEvent(type, roomId);

  const accountEmail =
    user && !user.isAnonymous && user.email ? user.email : null;

  const signUpForResults = async () => {
    setIsSigningUp(true);
    setSignupError(null);
    const response = await api.signUpForFlyerResults(statementId);
    setIsSigningUp(false);
    if (response.success) {
      track("flyer_results_signup_submitted");
      setIsSignedUp(true);
    } else {
      track("flyer_results_signup_failed");
      setSignupError(SIGNUP_FAILED_ERROR);
    }
  };

  const emailFlow = useEmailOtpFlow({
    onComplete: signUpForResults,
    sendWelcomeEmail: false,
  });

  useEffect(() => {
    track("flyer_results_signup_opened");
  }, []);

  const handleLookAround = () => {
    track("flyer_results_signup_looked_around");
    onComplete(roomId, "continue");
  };

  return (
    <div className="heard-feed-bg h-dvh overflow-y-auto">
      <div className="mx-auto min-h-full max-w-md">
        {!isSignedUp ? (
          <FlyerResultsSignupScreen
            tagline={TAGLINE}
            statementText={signup.statementText}
            vote={signup.vote}
            voteCount={signup.voteCount}
            areResultsTomorrow={areResultsTomorrow}
            accountEmail={accountEmail}
            emailFlow={emailFlow}
            isSigningUp={isSigningUp}
            signupError={signupError}
            onSignUpWithAccountEmail={signUpForResults}
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
