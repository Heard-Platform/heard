import { useEffect } from "react";
import type { FormEvent } from "react";
import { motion } from "motion/react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { ConfettiBurst } from "./ConfettiBurst";
import { CtaButton } from "./widgets/CtaButton";
import { TOSText } from "./onboarding/TOSText";
import { CertifyOtpStep } from "./room/CertifyOtpStep";
import { RoundedInput } from "./widgets/RoundedInput";
import { CARD_CLASS, COLORS, HEADLINE_CLASS } from "./flyer/personal-flyer/personal-flyer-theme";
import { useEmailOtpFlow } from "../hooks/useEmailOtpFlow";
import type { EmailOtpFlow } from "../hooks/useEmailOtpFlow";
import { useDebateSession } from "../hooks/useDebateSession";
import { api } from "../utils/api";

interface AnonResponseTripwireProps {
  roomId: string;
  isOpen: boolean;
  onComplete: () => void;
  onDismiss: () => void;
}

export function AnonResponseTripwire({
  roomId,
  isOpen,
  onComplete,
  onDismiss,
}: AnonResponseTripwireProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => !open && onDismiss()}
    >
      <DialogContent className="sm:max-w-md overflow-hidden p-0 border-0 bg-transparent shadow-none">
        <DialogTitle className="sr-only">
          Your take is live
        </DialogTitle>
        <DialogDescription className="sr-only">
          Add your email to hear when people vote on the statement you
          just posted.
        </DialogDescription>
        <TripwireCard
          roomId={roomId}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      </DialogContent>
    </Dialog>
  );
}

function TripwireCard({
  roomId,
  onComplete,
  onDismiss,
}: Omit<AnonResponseTripwireProps, "isOpen">) {
  const emailFlow = useEmailOtpFlow({ onComplete: () => onComplete() });

  useEffect(() => {
    api.trackEvent("anon_response_tripwire_shown", roomId);
  }, [roomId]);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      className={`relative ${CARD_CLASS}`}
    >
      <ConfettiBurst />
      {emailFlow.step === "otp" ? (
        <CertifyOtpStep
          email={emailFlow.email}
          otp={emailFlow.otp}
          error={emailFlow.error}
          loading={emailFlow.submitting}
          onOtpChange={emailFlow.setOtp}
          onSubmit={emailFlow.submitOtp}
          onBack={emailFlow.goBackToEmail}
        />
      ) : (
        <EmailForm roomId={roomId} emailFlow={emailFlow} onDismiss={onDismiss} />
      )}
    </motion.div>
  );
}

interface EmailFormProps {
  roomId: string;
  emailFlow: EmailOtpFlow;
  onDismiss: () => void;
}

function EmailForm({ roomId, emailFlow, onDismiss }: EmailFormProps) {
  const { user } = useDebateSession();
  const isPhoneOnlyUser = !!user && !user.isAnonymous;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    api.trackEvent("anon_response_tripwire_submitted", roomId);
    emailFlow.submitEmail();
  };

  return (
    <form noValidate onSubmit={handleSubmit}>
      <h2 className={`${HEADLINE_CLASS} text-[28px]`} style={{ color: COLORS.ink }}>
        Your take is live 🎉
      </h2>
      <p className="mt-2 text-base leading-relaxed" style={{ color: COLORS.body }}>
        Can we email you when people vote on it?
      </p>
      <RoundedInput
        className="mt-4"
        type="email"
        autoComplete="email"
        placeholder="you@email.com"
        autoFocus
        disabled={emailFlow.submitting}
        value={emailFlow.email}
        onChange={(event) => emailFlow.setEmail(event.target.value)}
      />
      {emailFlow.error && <p className="mt-3 text-sm text-[#C2410C]">{emailFlow.error}</p>}
      <CtaButton className="mt-3" type="submit" disabled={emailFlow.submitting}>
        {emailFlow.submitting ? "Sending…" : "Yes, email me"}
      </CtaButton>
      <button
        type="button"
        className="mt-3 w-full text-center text-sm font-semibold"
        style={{ color: COLORS.muted }}
        disabled={emailFlow.submitting}
        onClick={onDismiss}
      >
        Not now
      </button>
      {!isPhoneOnlyUser && (
        <TOSText
          className="mt-4 text-center text-xs text-[#5F6278]"
          linkClassName="underline-offset-2 hover:underline"
        />
      )}
    </form>
  );
}
