import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { api } from "../../utils/api";
import { useEmailOtpFlow } from "../../hooks/useEmailOtpFlow";
import { CertifyEmailStep } from "./CertifyEmailStep";
import { CertifyOtpStep } from "./CertifyOtpStep";
import { CertifyCelebrationStep } from "./CertifyCelebrationStep";

interface CertifyCardProps {
  roomId: string;
  isActive: boolean;
  onSuccess: () => void;
}

export function CertifyCard({ roomId, isActive, onSuccess }: CertifyCardProps) {
  const [done, setDone] = useState(false);

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
          isActive={isActive}
          onEmailChange={setEmail}
          onSubmit={handleEmailSubmit}
        />
      )}
    </AnimatePresence>
  );
}
