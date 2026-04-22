import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { useDebateSession } from "../../hooks/useDebateSession";
import { api } from "../../utils/api";
import { CertifyEmailStep } from "./CertifyEmailStep";
import { CertifyCelebrationStep } from "./CertifyCelebrationStep";

type Step = "email" | "celebration";

interface CertifyCardProps {
  roomId: string;
  isActive: boolean;
  onSuccess: () => void;
}

export function CertifyCard({ roomId, isActive, onSuccess }: CertifyCardProps) {
  const { anonAddEmailAndLogin } = useDebateSession();
  const [step, setStep] = useState<Step>("email");

  useEffect(() => {
    if (isActive) {
      api.trackEvent("certify_card_shown", roomId);
    }
  }, [isActive, roomId]);

  const handleEmailSubmit = async (email: string) => {
    api.trackEvent("certify_card_email_submitted", roomId);
    const response = await anonAddEmailAndLogin(email);
    if (response && response.success) {
      setStep("celebration");
    } else {
      throw new Error(response?.error || "Couldn't save email. Please try again.");
    }
  };

  return (
    <>

      <AnimatePresence mode="wait">
        {step === "email" && (
          <CertifyEmailStep onSubmit={handleEmailSubmit} />
        )}
        {step === "celebration" && (
          <CertifyCelebrationStep onDone={onSuccess} />
        )}
      </AnimatePresence>
    </>
  );
}
