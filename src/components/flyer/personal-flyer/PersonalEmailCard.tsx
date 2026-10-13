import type { FormEvent, ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import type { EmailOtpFlow } from "../../../hooks/useEmailOtpFlow";
import { TOSText } from "../../onboarding/TOSText";
import { CARD_CLASS, COLORS } from "./personal-flyer-theme";

const INPUT_CLASS = "w-full rounded-2xl border-2 px-4 py-3 text-base outline-none placeholder:text-[#8A8DA0]";

interface PersonalEmailCardProps {
  emailFlow: EmailOtpFlow;
}

export function PersonalEmailCard({ emailFlow }: PersonalEmailCardProps) {
  return (
    <div className={CARD_CLASS}>
      {emailFlow.step === "email" ? <EmailForm emailFlow={emailFlow} /> : <CodeForm emailFlow={emailFlow} />}
      {emailFlow.error && <p className="mt-3 text-sm text-[#C2410C]">{emailFlow.error}</p>}
      <TOSText
        className="mt-4 text-center text-xs text-[#5F6278]"
        linkClassName="underline-offset-2 hover:underline"
      />
    </div>
  );
}

function EmailForm({ emailFlow }: { emailFlow: EmailOtpFlow }) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    emailFlow.submitEmail();
  };

  return (
    <form noValidate onSubmit={handleSubmit}>
      <CardTitle>Can I send you a super cool email with the voting results?</CardTitle>
      <input
        className={`${INPUT_CLASS} mt-4`}
        style={{ borderColor: COLORS.inputBorder, backgroundColor: COLORS.inputFill, color: COLORS.ink }}
        type="email"
        autoComplete="email"
        placeholder="you@email.com"
        value={emailFlow.email}
        onChange={(event) => emailFlow.setEmail(event.target.value)}
      />
      <SubmitButton label="Send it" isSubmitting={emailFlow.submitting} />
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
      <CardTitle>Welcome back! Check your inbox.</CardTitle>
      <p className="mt-2 text-sm" style={{ color: COLORS.body }}>
        That email already has an account. I sent a 6-character code to{" "}
        <strong style={{ color: COLORS.ink }}>{emailFlow.email}</strong>.
      </p>
      <input
        className={`${INPUT_CLASS} mt-4 font-mono uppercase tracking-widest`}
        style={{ borderColor: COLORS.inputBorder, backgroundColor: COLORS.inputFill, color: COLORS.ink }}
        type="text"
        autoComplete="one-time-code"
        placeholder="ABC123"
        maxLength={6}
        autoFocus
        value={emailFlow.otp}
        onChange={(event) => emailFlow.setOtp(event.target.value)}
      />
      <SubmitButton label="Log in and send it" isSubmitting={emailFlow.submitting} />
      <button
        type="button"
        className="mt-3 flex items-center gap-1 text-sm font-semibold"
        style={{ color: COLORS.muted }}
        onClick={emailFlow.goBackToEmail}
      >
        <ChevronLeft className="h-4 w-4" />
        Use a different email
      </button>
    </form>
  );
}

function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-lg font-bold leading-snug tracking-tight" style={{ color: COLORS.ink }}>
      {children}
    </h2>
  );
}

function SubmitButton({ label, isSubmitting }: { label: string; isSubmitting: boolean }) {
  return (
    <button
      className="mt-3 w-full rounded-2xl py-3.5 text-base font-bold text-white disabled:opacity-60"
      style={{ backgroundColor: COLORS.button }}
      type="submit"
      disabled={isSubmitting}
    >
      {isSubmitting ? "Sending…" : label}
    </button>
  );
}
