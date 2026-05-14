import { useState } from "react";
import { isValidEmail } from "../utils/validation";
import { useDebateSession } from "./useDebateSession";

type Step = "email" | "otp";

interface UseEmailOtpFlowOptions {
  onComplete: (result: { wasOtpLogin: boolean }) => void;
}

export function useEmailOtpFlow({ onComplete }: UseEmailOtpFlowOptions) {
  const { anonAddEmailAndLogin, verifyMagicLink } = useDebateSession();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submitEmail = async () => {
    if (!isValidEmail(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await anonAddEmailAndLogin(email.trim());
      if (!response?.success) {
        throw new Error(response?.error || "Couldn't save email. Please try again.");
      }
      if (response.data?.requiresOtp) {
        setStep("otp");
      } else {
        onComplete({ wasOtpLogin: false });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitOtp = async () => {
    if (otp.trim().length !== 6) {
      setError("Enter the 6-character code from your email.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await verifyMagicLink(otp.trim().toUpperCase());
      if (!response?.success) {
        throw new Error(response?.error || "Invalid code. Please try again.");
      }
      onComplete({ wasOtpLogin: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const goBackToEmail = () => {
    setStep("email");
    setOtp("");
    setError(null);
  };

  return {
    step,
    email,
    otp,
    error,
    submitting,
    setEmail: (value: string) => {
      setEmail(value);
      if (error) setError(null);
    },
    setOtp: (value: string) => {
      setOtp(value.toUpperCase());
      if (error) setError(null);
    },
    submitEmail,
    submitOtp,
    goBackToEmail,
  };
}
