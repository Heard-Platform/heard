import type { FormEvent } from "react";
import { ChevronLeft } from "lucide-react";
import type { EmailOtpFlow } from "../../../hooks/useEmailOtpFlow";
import { TOSText } from "../../onboarding/TOSText";
import type { FlyerVote } from "../FlyerVoteIntroCard";
import { ResultsCard, summarizeVoteSplit, type FlyerVoteTally } from "../landing/FlyerLandingScreen";
import { TogaMonkey } from "../landing/TogaMonkey";
import { EASING, transitionOf, useAnimationTrigger } from "../landing/landing-motion";
import { getStandingHeadline } from "./flyer-scan-headline";
import { FlyerResultsHeader } from "./FlyerResultsHeader";

const TRIGGER_DELAY_MS = 150;
const BUTTON_COLOR = "#A34E36";
const INPUT_CLASS =
  "w-full rounded-2xl border-2 border-[#E3DDD1] bg-white px-4 py-3.5 text-base text-[#1C1B1F] outline-none placeholder:text-[#A8A298] focus:border-[#1C1B1F]";

interface FlyerScanScreenProps {
  tagline: string;
  tally: FlyerVoteTally;
  vote: FlyerVote;
  areResultsTomorrow: boolean;
  /** Set when the viewer already has an account email, so we can skip asking for it. */
  accountEmail: string | null;
  emailFlow: EmailOtpFlow;
  onLookAround: () => void;
}

export function FlyerScanScreen({
  tagline,
  tally,
  vote,
  areResultsTomorrow,
  accountEmail,
  emailFlow,
  onLookAround,
}: FlyerScanScreenProps) {
  const isTriggered = useAnimationTrigger(TRIGGER_DELAY_MS);
  const { agreePercent } = summarizeVoteSplit(tally);
  const fadeIn = (delayMs: number) => ({
    opacity: isTriggered ? 1 : 0,
    transition: transitionOf("opacity", 400, EASING.ease, delayMs),
  });

  return (
    <div className="heard-feed-bg flex min-h-full flex-col px-5 pb-6 pt-4">
      <FlyerResultsHeader tagline={tagline} />

      <div className="mt-4 flex items-center gap-3">
        <TogaMonkey
          size={112}
          style={{
            opacity: isTriggered ? 1 : 0,
            transform: isTriggered ? "scale(1) rotate(0deg)" : "scale(0.6) rotate(-8deg)",
            transformOrigin: "50% 90%",
            transition: [
              transitionOf("opacity", 300, EASING.ease, 120),
              transitionOf("transform", 700, EASING.pop, 120),
            ].join(", "),
          }}
        />
        <div
          style={{
            opacity: isTriggered ? 1 : 0,
            transform: isTriggered ? "translateY(0)" : "translateY(16px)",
            transition: [
              transitionOf("opacity", 450, EASING.ease, 0),
              transitionOf("transform", 600, EASING.bounce, 0),
            ].join(", "),
          }}
        >
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#6B6760]">Your vote is in</p>
          <h1 className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight text-[#1C1B1F]">
            {getStandingHeadline({ vote, agreePercent, areResultsTomorrow })}
          </h1>
        </div>
      </div>

      <div className="mt-5" style={fadeIn(300)}>
        <ResultsCard tally={tally} vote={vote} isTriggered={isTriggered} />
      </div>

      <div className="mt-6" style={fadeIn(450)}>
        {!accountEmail ? (
          <>
            {emailFlow.step === "email" ? (
              <EmailForm emailFlow={emailFlow} areResultsTomorrow={areResultsTomorrow} />
            ) : (
              <CodeForm emailFlow={emailFlow} />
            )}
            {emailFlow.error && <p className="mt-2 text-sm text-[#C2410C]">{emailFlow.error}</p>}
            <TOSText
              prefix="No spam or selling your data. "
              className="mt-4 text-center text-sm text-[#4A463F]"
              linkClassName="text-[#A34E36] underline"
            />
          </>
        ) : (
          <AlreadySignedInNote
            accountEmail={accountEmail}
            areResultsTomorrow={areResultsTomorrow}
            onLookAround={onLookAround}
          />
        )}
      </div>
    </div>
  );
}

function ResultsTime({ areResultsTomorrow }: { areResultsTomorrow: boolean }) {
  return (
    <strong className="text-[#1C1B1F]">{areResultsTomorrow ? "tomorrow at 7pm" : "tonight at 7pm"}</strong>
  );
}

interface EmailFormProps {
  emailFlow: EmailOtpFlow;
  areResultsTomorrow: boolean;
}

function EmailForm({ emailFlow, areResultsTomorrow }: EmailFormProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    emailFlow.submitEmail();
  };

  return (
    <form noValidate onSubmit={handleSubmit}>
      <p className="text-base text-[#4A463F]">
        Results at <ResultsTime areResultsTomorrow={areResultsTomorrow} />.
      </p>
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
      <h2 className="text-base font-bold text-[#1C1B1F]">Welcome back.</h2>
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

interface AlreadySignedInNoteProps {
  accountEmail: string;
  areResultsTomorrow: boolean;
  onLookAround: () => void;
}

function AlreadySignedInNote({ accountEmail, areResultsTomorrow, onLookAround }: AlreadySignedInNoteProps) {
  return (
    <div className="text-center text-sm text-[#4A463F]">
      <p>
        You're signed in, so we'll email the results to{" "}
        <strong className="text-[#1C1B1F]">{accountEmail}</strong> <ResultsTime areResultsTomorrow={areResultsTomorrow} />.
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
      className="mt-3 w-full rounded-2xl py-4 text-lg font-bold text-white disabled:opacity-60"
      style={{ backgroundColor: BUTTON_COLOR }}
      type="submit"
      disabled={isSubmitting}
    >
      {isSubmitting ? "Sending…" : label}
    </button>
  );
}
