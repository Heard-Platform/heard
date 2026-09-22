import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import type { Statement } from "../../types";
import { api } from "../../utils/api";
import { countVotesAgreeingWithUser } from "../../utils/statement";
import { useDebateSession } from "../../hooks/useDebateSession";
import { buildLiveHighlights } from "../results/LiveHighlights";
import { useEmailOtpFlow } from "../../hooks/useEmailOtpFlow";
import { CertifyEmailStep } from "./CertifyEmailStep";
import { CertifyOtpStep } from "./CertifyOtpStep";
import { CertifyCelebrationStep } from "./CertifyCelebrationStep";

interface CertifyCardProps {
  roomId: string;
  statements: Statement[];
  isActive: boolean;
  onSuccess: () => void;
}

export function CertifyCard({ roomId, statements, isActive, onSuccess }: CertifyCardProps) {
  const [done, setDone] = useState(false);
  const { user } = useDebateSession();

  const {
    step,
    email,
    otp,
    error,
    submitting,
    setEmail,
    setOtp,
    submitEmail,
    submitOtp,
    goBackToEmail,
  } = useEmailOtpFlow({
    onComplete: () => setDone(true),
  });

  useEffect(() => {
    if (isActive) {
      api.trackEvent("certify_card_shown", roomId);
    }
  }, [isActive, roomId]);

  const highlights = buildLiveHighlights(statements);
  const teaserHighlight =
    highlights.find((h) => h.kind === "topDisagreed") ??
    highlights.find((h) => h.kind === "mostSplit") ??
    highlights.find((h) => h.kind === "topAgreed") ??
    null;
  const agreeingVotes = user ? countVotesAgreeingWithUser(statements, user.id) : 0;

  const handleEmailSubmit = () => {
    api.trackEvent("certify_card_email_submitted", roomId);
    submitEmail();
  };

  return (
    <AnimatePresence mode="wait">
      {done ? (
        <CertifyCelebrationStep onDone={onSuccess} />
      ) : step === "otp" ? (
        <CertifyOtpStep
          email={email}
          otp={otp}
          error={error}
          loading={submitting}
          onOtpChange={setOtp}
          onSubmit={submitOtp}
          onBack={goBackToEmail}
        />
      ) : (
        <CertifyEmailStep
          email={email}
          error={error}
          loading={submitting}
          teaserHighlight={teaserHighlight}
          agreeingVotes={agreeingVotes}
          isActive={isActive}
          onEmailChange={setEmail}
          onSubmit={handleEmailSubmit}
        />
      )}
    </AnimatePresence>
  );
}
