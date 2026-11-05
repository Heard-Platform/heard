import {
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { ArrowRight, ChevronLeft, Loader2 } from "lucide-react";
import {
  useEmailOtpFlow,
  type EmailOtpFlow,
} from "../../hooks/useEmailOtpFlow";
import { TOSText } from "../onboarding/TOSText";
import { RoundedInput } from "../widgets/RoundedInput";
import { WhoDisButton } from "../flyer/personal-flyer/WhoDisButton";
import {
  COLORS,
  HEADLINE_CLASS,
} from "../flyer/personal-flyer/personal-flyer-theme";
import { WhoDisSheet } from "./WhoDisSheet";

export const SIGNUP_CARD_SHELL_CLASS = "heard-feed-bg border-white";

interface SignUpCardProps {
  neighborCount: number;
  onKeepVoting: () => void;
}

export function SignUpCard({
  neighborCount,
  onKeepVoting,
}: SignUpCardProps) {
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [isWhoDisOpen, setIsWhoDisOpen] = useState(false);
  const emailFlow = useEmailOtpFlow({
    onComplete: () => setIsSignedUp(true),
  });

  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <h1
          className={`${HEADLINE_CLASS} text-[22px]`}
          style={{ color: COLORS.ink }}
        >
          Thanks for checking out my app!
        </h1>
        <WhoDisButton
          avatarSizePx={52}
          labelClassName="text-xs"
          onClick={() => setIsWhoDisOpen(true)}
        />
      </div>

      <p
        className="mt-2 text-sm leading-snug"
        style={{ color: COLORS.body }}
      >
        You just entered a world of civic delight, along with{" "}
        <strong style={{ color: COLORS.ink }}>
          {neighborCount.toLocaleString()}
        </strong>{" "}
        of your neighbors.
      </p>

      <div className="mt-5">
        {isSignedUp ? (
          <SignedUpStep onKeepVoting={onKeepVoting} />
        ) : emailFlow.step === "email" ? (
          <EmailStep emailFlow={emailFlow} />
        ) : (
          <CodeStep emailFlow={emailFlow} />
        )}
      </div>

      <WhoDisSheet
        isOpen={isWhoDisOpen}
        onClose={() => setIsWhoDisOpen(false)}
      />
    </div>
  );
}

function EmailStep({ emailFlow }: { emailFlow: EmailOtpFlow }) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    emailFlow.submitEmail();
  };

  return (
    <>
      <StepPrompt>
        Can I get your email to send you some super cool results?
      </StepPrompt>
      <InlineSubmitForm
        submitLabel="Send"
        isSubmitting={emailFlow.submitting}
        onSubmit={handleSubmit}
        inputProps={{
          type: "email",
          autoComplete: "email",
          "aria-label": "Email",
          placeholder: "you@email.com",
          value: emailFlow.email,
          onChange: (event) => emailFlow.setEmail(event.target.value),
        }}
      />
      <StepError error={emailFlow.error} />
      <TOSText
        className="mt-2 text-center text-[11px] leading-snug"
        linkClassName="underline underline-offset-2"
      />
    </>
  );
}

function CodeStep({ emailFlow }: { emailFlow: EmailOtpFlow }) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    emailFlow.submitOtp();
  };

  return (
    <>
      <StepPrompt>
        Welcome back! Enter the code I sent to{" "}
        <span className="font-normal">{emailFlow.email}</span>.
      </StepPrompt>
      <InlineSubmitForm
        submitLabel="Log in"
        isSubmitting={emailFlow.submitting}
        onSubmit={handleSubmit}
        inputProps={{
          type: "text",
          autoComplete: "one-time-code",
          "aria-label": "Login code",
          placeholder: "ABC123",
          maxLength: 6,
          autoFocus: true,
          className: "font-mono uppercase tracking-widest",
          value: emailFlow.otp,
          onChange: (event) => emailFlow.setOtp(event.target.value),
        }}
      />
      <StepError error={emailFlow.error} />
      <button
        type="button"
        className="mt-2 flex items-center gap-1 text-xs font-semibold"
        style={{ color: COLORS.muted }}
        onClick={emailFlow.goBackToEmail}
      >
        <ChevronLeft className="h-3 w-3" />
        Use a different email
      </button>
    </>
  );
}

function SignedUpStep({
  onKeepVoting,
}: {
  onKeepVoting: () => void;
}) {
  return (
    <>
      <StepPrompt>
        You're in! The results are headed to your inbox.
      </StepPrompt>
      <button
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white"
        style={{ backgroundColor: COLORS.ink }}
        onClick={onKeepVoting}
      >
        Keep voting
        <ArrowRight className="h-4 w-4" />
      </button>
    </>
  );
}

interface InlineSubmitFormProps {
  inputProps: InputHTMLAttributes<HTMLInputElement>;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent) => void;
}

function InlineSubmitForm({
  inputProps,
  submitLabel,
  isSubmitting,
  onSubmit,
}: InlineSubmitFormProps) {
  const { className = "", ...otherInputProps } = inputProps;

  return (
    <form
      className="mt-2 flex items-center gap-2"
      noValidate
      onSubmit={onSubmit}
    >
      <RoundedInput
        className={`min-w-0 flex-1 py-2.5 text-sm ${className}`}
        {...otherInputProps}
      />
      <button
        type="submit"
        aria-label={submitLabel}
        disabled={isSubmitting}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white disabled:opacity-60"
        style={{ backgroundColor: COLORS.ink }}
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ArrowRight className="h-5 w-5" />
        )}
      </button>
    </form>
  );
}

function StepPrompt({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-sm font-bold leading-snug"
      style={{ color: COLORS.ink }}
    >
      {children}
    </p>
  );
}

function StepError({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="mt-2 text-xs text-[#C2410C]">{error}</p>;
}
