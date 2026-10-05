import type { FormEvent, ReactNode } from "react";
import { Check, ChevronLeft } from "lucide-react";
import type { EmailOtpFlow } from "../../../hooks/useEmailOtpFlow";
import { TOSText } from "../../onboarding/TOSText";
import type { FlyerVote } from "../FlyerVoteIntroCard";
import { TogaMonkey } from "../landing/TogaMonkey";
import { EASING, transitionOf, useAnimationTrigger } from "../landing/landing-motion";
import { FlyerResultsHeader } from "./FlyerResultsHeader";

const TRIGGER_DELAY_MS = 150;
const AGREE_COLOR = "#16A34A";
const DISAGREE_COLOR = "#DC2626";
const BUTTON_COLOR = "#B5401F";
const INPUT_CLASS =
  "w-full rounded-xl border border-[#E3DDD1] bg-white px-4 py-3.5 text-base text-[#1C1B1F] outline-none placeholder:text-[#A8A298] focus:border-[#1C1B1F]";

interface FlyerScanScreenProps {
  tagline: string;
  statementText: string;
  vote: FlyerVote;
  voteCount: number;
  areResultsTomorrow: boolean;
  /** Set when the viewer already has an account email, so we can skip asking for it. */
  accountEmail: string | null;
  emailFlow: EmailOtpFlow;
  onLookAround: () => void;
}

export function FlyerScanScreen({
  tagline,
  statementText,
  vote,
  voteCount,
  areResultsTomorrow,
  accountEmail,
  emailFlow,
  onLookAround,
}: FlyerScanScreenProps) {
  const isTriggered = useAnimationTrigger(TRIGGER_DELAY_MS);
  const fadeIn = (delayMs: number) => ({
    opacity: isTriggered ? 1 : 0,
    transform: isTriggered ? "translateY(0)" : "translateY(12px)",
    transition: [
      transitionOf("opacity", 400, EASING.ease, delayMs),
      transitionOf("transform", 500, EASING.bounce, delayMs),
    ].join(", "),
  });

  return (
    <div className="heard-feed-bg flex min-h-full flex-col px-5 pb-6 pt-4">
      <FlyerResultsHeader tagline={tagline} />

      <div className="mt-4 flex flex-col items-center text-center">
        <TogaMonkey
          size={104}
          style={{
            opacity: isTriggered ? 1 : 0,
            transform: isTriggered ? "scale(1) rotate(0deg)" : "scale(0.6) rotate(-8deg)",
            transformOrigin: "50% 90%",
            transition: [
              transitionOf("opacity", 300, EASING.ease, 0),
              transitionOf("transform", 700, EASING.pop, 0),
            ].join(", "),
          }}
        />

        <div style={fadeIn(100)}>
          <p className="font-serif mt-3 text-xl font-bold leading-snug text-[#1C1B1F]">"{statementText}"</p>
          <VoteCountedPill vote={vote} />
        </div>

        <div className="mt-5" style={fadeIn(250)}>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6B6760]">
            Voting is open · {voteCount} {voteCount === 1 ? "vote" : "votes"} in
          </p>
          <h1 className="font-serif mt-1 text-[32px] font-bold leading-tight text-[#1C1B1F]">
            {areResultsTomorrow ? "Results drop tomorrow at 7pm" : "Results drop at 7pm"}
          </h1>
          <p className="mt-1 text-sm text-[#4A463F]">Your neighbors are weighing in now.</p>
        </div>
      </div>

      <div className="mt-6" style={fadeIn(400)}>
        {!accountEmail ? (
          <>
            {emailFlow.step === "email" ? <EmailForm emailFlow={emailFlow} /> : <CodeForm emailFlow={emailFlow} />}
            {emailFlow.error && <p className="mt-2 text-sm text-[#C2410C]">{emailFlow.error}</p>}
            <p className="mt-3 text-center text-xs font-semibold text-[#1C1B1F]">
              Just the results. No spam or selling your data.
            </p>
            <TOSText className="mt-2 text-center text-[11px] text-[#4A463F]" linkClassName="text-[#4A463F] underline" />
          </>
        ) : (
          <AccountEmailNote
            accountEmail={accountEmail}
            areResultsTomorrow={areResultsTomorrow}
            onLookAround={onLookAround}
          />
        )}
      </div>
    </div>
  );
}

function VoteCountedPill({ vote }: { vote: FlyerVote }) {
  const isAgree = vote === "agree";

  return (
    <span
      className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold text-white"
      style={{ backgroundColor: isAgree ? AGREE_COLOR : DISAGREE_COLOR }}
    >
      <Check className="h-4 w-4" strokeWidth={3} />
      {isAgree ? "You agreed." : "You disagreed."} Counted.
    </span>
  );
}

function FormHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-base font-bold text-[#1C1B1F]">{children}</h2>;
}

function EmailForm({ emailFlow }: { emailFlow: EmailOtpFlow }) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    emailFlow.submitEmail();
  };

  return (
    <form noValidate onSubmit={handleSubmit}>
      <FormHeading>Can we send you the results?</FormHeading>
      <input
        className={`${INPUT_CLASS} mt-3`}
        type="email"
        autoComplete="email"
        placeholder="you@email.com"
        value={emailFlow.email}
        onChange={(event) => emailFlow.setEmail(event.target.value)}
      />
      <SubmitButton label="Send me the results" isSubmitting={emailFlow.submitting} />
    </form>
  );
}

function CodeForm({ emailFlow }: { emailFlow: EmailOtpFlow }) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    emailFlow.submitOtp();
  };

  return (
    <form noValidate onSubmit={handleSubmit}>
      <FormHeading>Welcome back.</FormHeading>
      <p className="mt-1 text-sm text-[#4A463F]">
        That email already has an account. We sent a 6-character code to{" "}
        <strong className="text-[#1C1B1F]">{emailFlow.email}</strong>.
      </p>
      <input
        className={`${INPUT_CLASS} mt-3 font-mono uppercase tracking-widest`}
        type="text"
        autoComplete="one-time-code"
        placeholder="ABC123"
        maxLength={6}
        autoFocus
        value={emailFlow.otp}
        onChange={(event) => emailFlow.setOtp(event.target.value)}
      />
      <SubmitButton label="Log in and send results" isSubmitting={emailFlow.submitting} />
      <button
        type="button"
        className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#6B6760]"
        onClick={emailFlow.goBackToEmail}
      >
        <ChevronLeft className="h-3 w-3" />
        Use a different email
      </button>
    </form>
  );
}

interface AccountEmailNoteProps {
  accountEmail: string;
  areResultsTomorrow: boolean;
  onLookAround: () => void;
}

function AccountEmailNote({ accountEmail, areResultsTomorrow, onLookAround }: AccountEmailNoteProps) {
  return (
    <div className="text-center text-sm text-[#4A463F]">
      <p>
        You're signed in, so we'll email the results to <strong className="text-[#1C1B1F]">{accountEmail}</strong>{" "}
        {areResultsTomorrow ? "tomorrow at 7pm" : "at 7pm"}.
      </p>
      <p className="mt-4">
        Got some more time? Feel free to{" "}
        <button className="underline underline-offset-2" onClick={onLookAround}>
          look around
        </button>
        .
      </p>
    </div>
  );
}

function SubmitButton({ label, isSubmitting }: { label: string; isSubmitting: boolean }) {
  return (
    <button
      className="mt-3 w-full rounded-xl py-3.5 text-base font-bold text-white disabled:opacity-60"
      style={{ backgroundColor: BUTTON_COLOR }}
      type="submit"
      disabled={isSubmitting}
    >
      {isSubmitting ? "Sending…" : label}
    </button>
  );
}
