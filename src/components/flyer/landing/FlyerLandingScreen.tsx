import type { FormEvent } from "react";
import { ArrowRight, ChevronLeft } from "lucide-react";
import type { EmailOtpFlow } from "../../../hooks/useEmailOtpFlow";
import { TOSText } from "../../onboarding/TOSText";
import type { FlyerVote } from "../FlyerVoteIntroCard";
import { FlyerLandingHeader } from "./FlyerLandingHeader";
import { LookAroundLink } from "./LookAroundLink";
import { TogaMonkey } from "./TogaMonkey";
import { EASING, transitionOf, useAnimationTrigger } from "./landing-motion";

const TRIGGER_DELAY_MS = 150;
const GREEN = "#16A34A";
const RED = "#DC2626";
const NAVY = "#1c1a2b";
const INPUT_CLASS =
  "min-w-0 flex-1 rounded-2xl border-2 border-[#E3DDD1] bg-white px-4 py-3.5 text-base text-[#1C1B1F] outline-none placeholder:text-[#A8A298] focus:border-[#1c1a2b]";

export interface FlyerVoteTally {
  statementText: string;
  agreeCount: number;
  disagreeCount: number;
}

interface FlyerLandingScreenProps {
  community: string | null;
  tally: FlyerVoteTally;
  vote: FlyerVote;
  isLoggedIn: boolean;
  emailFlow: EmailOtpFlow;
  onLookAround: () => void;
}

export function FlyerLandingScreen({
  community,
  tally,
  vote,
  isLoggedIn,
  emailFlow,
  onLookAround,
}: FlyerLandingScreenProps) {
  const isTriggered = useAnimationTrigger(TRIGGER_DELAY_MS);

  return (
    <div className="heard-feed-bg flex min-h-full flex-col px-5 pb-6 pt-4">
      <FlyerLandingHeader community={community} />

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
          <h1 className="mt-1 text-[28px] font-extrabold leading-tight tracking-tight text-[#1C1B1F]">
            The assembly has heard you.
          </h1>
        </div>
      </div>

      <div
        className="mt-5"
        style={{
          opacity: isTriggered ? 1 : 0,
          transition: transitionOf("opacity", 400, EASING.ease, 300),
        }}
      >
        <ResultsCard tally={tally} vote={vote} isTriggered={isTriggered} />
      </div>

      <div
        className="mt-6"
        style={{
          opacity: isTriggered ? 1 : 0,
          transition: transitionOf("opacity", 400, EASING.ease, 450),
        }}
      >
        {isLoggedIn ? (
          <div className="mt-4 text-center">
            <LookAroundLink onClick={onLookAround} />
          </div>
        ) : (
          <>
            {emailFlow.step === "otp" ? <CodeForm emailFlow={emailFlow} /> : <EmailForm emailFlow={emailFlow} />}
            {emailFlow.error && <p className="mt-2 text-sm text-[#C2410C]">{emailFlow.error}</p>}
          </>
        )}
      </div>
    </div>
  );
}

interface ResultsCardProps {
  tally: FlyerVoteTally;
  vote: FlyerVote;
  isTriggered: boolean;
}

export function ResultsCard({ tally, vote, isTriggered }: ResultsCardProps) {
  const split = summarizeVoteSplit(tally);

  return (
    <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "0 6px 18px rgba(28, 27, 31, 0.08)" }}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-bold leading-snug text-[#1C1B1F]">"{tally.statementText}"</p>
        <VotePill vote={vote} />
      </div>

      <div className="mt-3 flex h-3 justify-between overflow-hidden rounded-full">
        <BarSegment color={GREEN} percent={split.agreePercent} isTriggered={isTriggered} />
        <BarSegment color={RED} percent={split.disagreePercent} isTriggered={isTriggered} />
      </div>

      <div className="mt-2 flex items-center justify-between text-sm text-[#4A463F]">
        <span>
          <strong className="text-[#1C1B1F]">{split.agreePercent}%</strong> agree
        </span>
        <span>{split.voteCount} votes so far</span>
        <span>
          <strong className="text-[#1C1B1F]">{split.disagreePercent}%</strong> disagree
        </span>
      </div>
    </div>
  );
}

function VotePill({ vote }: { vote: FlyerVote }) {
  const isAgree = vote === "agree";

  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-white"
      style={{ backgroundColor: isAgree ? GREEN : RED }}
    >
      {isAgree ? "You agreed" : "You disagreed"}
    </span>
  );
}

interface BarSegmentProps {
  color: string;
  percent: number;
  isTriggered: boolean;
}

function BarSegment({ color, percent, isTriggered }: BarSegmentProps) {
  return (
    <div
      className="h-full"
      style={{
        backgroundColor: color,
        width: isTriggered ? `${percent}%` : "0%",
        transition: transitionOf("width", 900, EASING.fill, 500),
      }}
    />
  );
}

function EmailForm({ emailFlow }: { emailFlow: EmailOtpFlow }) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    emailFlow.submitEmail();
  };

  return (
    <>
      <h2 className="text-xl font-extrabold tracking-tight text-[#1C1B1F]">Can we send you the final results?</h2>
      <form className="mt-3 flex gap-2" noValidate onSubmit={handleSubmit}>
        <input
          className={INPUT_CLASS}
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={emailFlow.email}
          onChange={(event) => emailFlow.setEmail(event.target.value)}
        />
        <SubmitButton label="Send me the results" isSubmitting={emailFlow.submitting} />
      </form>
      <TOSText
        prefix="No spam, no selling your data. "
        className="mt-3 text-xs text-[#4A463F]"
        linkClassName="text-[#4A463F] underline"
      />
    </>
  );
}

function CodeForm({ emailFlow }: { emailFlow: EmailOtpFlow }) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    emailFlow.submitOtp();
  };

  return (
    <>
      <h2 className="text-xl font-extrabold tracking-tight text-[#1C1B1F]">Welcome back.</h2>
      <p className="mt-1 text-sm text-[#4A463F]">
        That email already has an account. We sent a 6-character code to{" "}
        <strong className="text-[#1C1B1F]">{emailFlow.email}</strong>.
      </p>
      <form className="mt-3 flex gap-2" noValidate onSubmit={handleSubmit}>
        <input
          className={`${INPUT_CLASS} font-mono uppercase tracking-widest`}
          type="text"
          autoComplete="one-time-code"
          placeholder="ABC123"
          maxLength={6}
          autoFocus
          value={emailFlow.otp}
          onChange={(event) => emailFlow.setOtp(event.target.value)}
        />
        <SubmitButton label="Log in" isSubmitting={emailFlow.submitting} />
      </form>
      <button
        className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#6B6760]"
        onClick={emailFlow.goBackToEmail}
      >
        <ChevronLeft className="h-3 w-3" />
        Use a different email
      </button>
    </>
  );
}

function SubmitButton({ label, isSubmitting }: { label: string; isSubmitting: boolean }) {
  return (
    <button
      className="flex w-14 shrink-0 items-center justify-center rounded-2xl text-white disabled:opacity-60"
      style={{ backgroundColor: NAVY }}
      type="submit"
      aria-label={label}
      disabled={isSubmitting}
    >
      <ArrowRight className="h-5 w-5" />
    </button>
  );
}

interface VoteSplit {
  agreePercent: number;
  disagreePercent: number;
  voteCount: number;
}

export function summarizeVoteSplit(tally: FlyerVoteTally): VoteSplit {
  const voteCount = tally.agreeCount + tally.disagreeCount;
  if (voteCount === 0) {
    return { agreePercent: 0, disagreePercent: 0, voteCount };
  }
  const agreePercent = Math.round((tally.agreeCount / voteCount) * 100);
  return { agreePercent, disagreePercent: 100 - agreePercent, voteCount };
}
