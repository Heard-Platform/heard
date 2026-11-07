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

interface TripwireVariant {
  headline: string;
  body: string;
  screenReaderTitle: string;
  screenReaderDescription: string;
  shownEventType: string;
  submittedEventType: string;
}

const LIVE_STATEMENT_VARIANT: TripwireVariant = {
  headline: "Your take is live 🎉",
  body: "Can we email you when people vote on it?",
  screenReaderTitle: "Your take is live",
  screenReaderDescription:
    "Add your email to hear when people vote on the statement you just posted.",
  shownEventType: "anon_response_tripwire_shown",
  submittedEventType: "anon_response_tripwire_submitted",
};

const AWAITING_APPROVAL_VARIANT: TripwireVariant = {
  headline: "Your take is in 🎉",
  body: "It goes live once it's approved. Want an email when people start voting on it?",
  screenReaderTitle: "Your take is in",
  screenReaderDescription:
    "Your statement goes live once it's approved. Add your email to hear when people start voting on it.",
  shownEventType: "anon_response_tripwire_awaiting_approval_shown",
  submittedEventType:
    "anon_response_tripwire_awaiting_approval_submitted",
};

interface AnonResponseTripwireProps {
  roomId: string;
  isOpen: boolean;
  isAwaitingApproval: boolean;
  onComplete: () => void;
  onDismiss: () => void;
}

export function AnonResponseTripwire({
  roomId,
  isOpen,
  isAwaitingApproval,
  onComplete,
  onDismiss,
}: AnonResponseTripwireProps) {
  const variant = isAwaitingApproval
    ? AWAITING_APPROVAL_VARIANT
    : LIVE_STATEMENT_VARIANT;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => !open && onDismiss()}
    >
      <DialogContent className="sm:max-w-md overflow-hidden p-0 border-0 bg-transparent shadow-none">
        <DialogTitle className="sr-only">
          {variant.screenReaderTitle}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {variant.screenReaderDescription}
        </DialogDescription>
        <TripwireCard
          roomId={roomId}
          variant={variant}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      </DialogContent>
    </Dialog>
  );
}

interface TripwireCardProps {
  roomId: string;
  variant: TripwireVariant;
  onComplete: () => void;
  onDismiss: () => void;
}

function TripwireCard({
  roomId,
  variant,
  onComplete,
  onDismiss,
}: TripwireCardProps) {
  const emailFlow = useEmailOtpFlow({ onComplete: () => onComplete() });

  useEffect(() => {
    api.trackEvent(variant.shownEventType, roomId);
  }, [variant, roomId]);

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
        <EmailForm
          roomId={roomId}
          variant={variant}
          emailFlow={emailFlow}
          onDismiss={onDismiss}
        />
      )}
    </motion.div>
  );
}

interface EmailFormProps {
  roomId: string;
  variant: TripwireVariant;
  emailFlow: EmailOtpFlow;
  onDismiss: () => void;
}

function EmailForm({
  roomId,
  variant,
  emailFlow,
  onDismiss,
}: EmailFormProps) {
  const { user } = useDebateSession();
  const isPhoneOnlyUser = !!user && !user.isAnonymous;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    api.trackEvent(variant.submittedEventType, roomId);
    emailFlow.submitEmail();
  };

  return (
    <form noValidate onSubmit={handleSubmit}>
      <h2 className={`${HEADLINE_CLASS} text-[28px]`} style={{ color: COLORS.ink }}>
        {variant.headline}
      </h2>
      <p className="mt-2 text-base leading-relaxed" style={{ color: COLORS.body }}>
        {variant.body}
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
